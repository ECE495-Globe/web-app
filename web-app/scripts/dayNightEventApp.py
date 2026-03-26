import requests
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

from control_state import load_luminosity
from mapToCoordinates import countries, states, provinces


LOG_DIR = Path(__file__).resolve().parent / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "python_scripts.log"


class _TeeStream:
    def __init__(self, *streams):
        self.streams = streams

    def write(self, data):
        for stream in self.streams:
            try:
                stream.write(data)
                stream.flush()
            except Exception:
                pass
        return len(data)

    def flush(self):
        for stream in self.streams:
            try:
                stream.flush()
            except Exception:
                pass


def _setup_script_logging():
    log_handle = open(LOG_FILE, "a", encoding="utf-8", buffering=1)
    stamp = datetime.now().isoformat(timespec="seconds")
    log_handle.write(f"\n[{stamp}] --- {Path(__file__).name} start ---\n")
    sys.stdout = _TeeStream(sys.__stdout__, log_handle)
    sys.stderr = _TeeStream(sys.__stderr__, log_handle)
    return log_handle


_LOG_HANDLE = _setup_script_logging()
DATA_CACHE_DIR = Path(__file__).resolve().parent / "cache"
DATA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
CACHE_FILE = DATA_CACHE_DIR / "daynight_last.json"


def chunk_list(data, size):
    for i in range(0, len(data), size):
        yield data[i:i+size]


def save_cache(dataset):
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(dataset, f)
    except Exception as e:
        print(f"[Cache] failed to save day-night cache: {e}")


def load_cache():
    if not CACHE_FILE.exists():
        return {}
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cached = json.load(f)
        return cached if isinstance(cached, dict) else {}
    except Exception as e:
        print(f"[Cache] failed to read day-night cache: {e}")
        return {}


# Combine all locations
locations = {**countries, **states, **provinces}
location_items = list(locations.items())

base_url = "https://api.open-meteo.com/v1/forecast"

daynight_data = {
    "type": "Day-Night",
    "luminosity": load_luminosity(),
    "data": {}
}

BATCH_SIZE = 50
MAX_RETRIES = 4
REQUEST_TIMEOUT = 15
BETWEEN_BATCH_DELAY_SEC = 0.35


def daynight_to_rgb(is_day):
    return [0, 0, 150] if is_day == 1 else [255, 200, 0]


def normalize_batch_response(data, expected_count):
    if isinstance(data, list):
        normalized = data
    elif isinstance(data, dict) and expected_count == 1:
        normalized = [data]
    else:
        actual_type = type(data).__name__
        raise ValueError(f"Unexpected Open-Meteo batch response shape: {actual_type}")

    if len(normalized) != expected_count:
        raise ValueError(
            f"Unexpected Open-Meteo batch length: expected {expected_count}, got {len(normalized)}"
        )

    return normalized


def fetch_batch(current_field, lats, lons):
    params = {
        "latitude": lats,
        "longitude": lons,
        "current": current_field
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.get(base_url, params=params, timeout=REQUEST_TIMEOUT)

            if response.status_code == 429:
                reason = ""
                try:
                    body = response.json()
                    reason = str(body.get("reason", ""))
                except Exception:
                    reason = response.text

                if "Daily API request limit exceeded" in reason:
                    print("[Rate limit] day-night daily API limit exceeded, stopping fresh fetches")
                    return "DAILY_LIMIT"

                print("[Rate limit] day-night batch rate-limited; skipping retries for this cycle")
                return None

            response.raise_for_status()
            data = response.json()
            return normalize_batch_response(data, len(lats))
        except requests.exceptions.Timeout as e:
            print(f"Batch request timed out; skipping retries for this cycle: {e}")
            return None
        except Exception as e:
            if attempt == MAX_RETRIES:
                print(f"Batch request failed after {MAX_RETRIES} attempts: {e}")
                return None
            wait_seconds = 1.0 * (2 ** (attempt - 1))
            print(f"Batch request attempt {attempt}/{MAX_RETRIES} failed: {e} | retrying in {wait_seconds:.1f}s")
            time.sleep(wait_seconds)

    return None


# BATCH LOOP
for chunk in chunk_list(location_items, BATCH_SIZE):

    keys = [item[0] for item in chunk]
    lats = [item[1][0] for item in chunk]
    lons = [item[1][1] for item in chunk]

    data = fetch_batch("is_day", lats, lons)
    if data == "DAILY_LIMIT":
        break
    if data is None:
        continue

    # Handle batched response (list of results)
    for i, location in enumerate(keys):
        try:
            is_day = data[i]["current"]["is_day"]
            rgb = daynight_to_rgb(is_day)
            daynight_data["data"][location] = rgb
        except Exception as e:
            print(f"Error processing {location}: {e}\n")

    time.sleep(BETWEEN_BATCH_DELAY_SEC)

if daynight_data["data"]:
    save_cache(daynight_data["data"])
else:
    cached = load_cache()
    if cached:
        daynight_data["data"] = cached
        print(f"[Cache] using cached day-night data points={len(cached)}")


# Send full dataset
payload = json.dumps(daynight_data)
publish_script = str(Path(__file__).resolve().parent / "Publish.py")


publish_result = subprocess.run(
    ["python3", publish_script, payload],
    capture_output=True,
    text=True
)

if publish_result.stdout:
    print("[Publish.py stdout]")
    print(publish_result.stdout, end="")

if publish_result.stderr:
    print("[Publish.py stderr]")
    print(publish_result.stderr, end="")

print(f"[Publish.py exit] code={publish_result.returncode}")
print(f"Day/Night data published to MQTT. points={len(daynight_data['data'])}")

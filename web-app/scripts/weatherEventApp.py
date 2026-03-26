import requests
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

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
CACHE_FILE = DATA_CACHE_DIR / "weather_last.json"

def lerp(a, b, t):
    return int(a + (b - a) * t)

def interpolate(c1, c2, t):
    return (
        lerp(c1[0], c2[0], t),
        lerp(c1[1], c2[1], t),
        lerp(c1[2], c2[2], t)
    )

def temp_to_rgb(temp):

    # clamp range
    temp = max(-60, min(50, temp))

    # color stops
    stops = [
        (-60, (255,255,255)),  # white
        (-30, (128,0,128)),    # purple
        (-10, (0,0,255)),      # blue
        (10,  (0,255,0)),      # green
        (25,  (255,255,0)),    # yellow
        (35,  (255,165,0)),    # orange
        (50,  (255,0,0))       # red
    ]

    for i in range(len(stops)-1):
        t0, c0 = stops[i]
        t1, c1 = stops[i+1]

        if t0 <= temp <= t1:
            ratio = (temp - t0) / (t1 - t0)
            return interpolate(c0, c1, ratio)

    return stops[-1][1]


def chunk_list(data, size):
    for i in range(0, len(data), size):
        yield data[i:i+size]


def save_cache(dataset):
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(dataset, f)
    except Exception as e:
        print(f"[Cache] failed to save weather cache: {e}")


def load_cache():
    if not CACHE_FILE.exists():
        return {}
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cached = json.load(f)
        return cached if isinstance(cached, dict) else {}
    except Exception as e:
        print(f"[Cache] failed to read weather cache: {e}")
        return {}


locations = {**countries, **states, **provinces}
location_items = list(locations.items())

base_url = "https://api.open-meteo.com/v1/forecast"

weather_data = {
    "type": "Weather",
    "data": {}
}

BATCH_SIZE = 50
MAX_RETRIES = 4
REQUEST_TIMEOUT = 15
BETWEEN_BATCH_DELAY_SEC = 0.35


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
                    print("[Rate limit] weather daily API limit exceeded, stopping fresh fetches")
                    return "DAILY_LIMIT"

                retry_after = response.headers.get("Retry-After")
                if retry_after:
                    try:
                        wait_seconds = max(1.0, float(retry_after))
                    except ValueError:
                        wait_seconds = 1.5 * (2 ** (attempt - 1))
                else:
                    wait_seconds = 1.5 * (2 ** (attempt - 1))

                print(f"[Rate limit] weather batch attempt {attempt}/{MAX_RETRIES}, retrying in {wait_seconds:.1f}s")
                time.sleep(wait_seconds)
                continue

            response.raise_for_status()
            data = response.json()
            if not isinstance(data, list):
                raise ValueError("Unexpected Open-Meteo batch response shape")
            return data
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

    data = fetch_batch("temperature_2m", lats, lons)
    if data == "DAILY_LIMIT":
        break
    if data is None:
        continue

    # Handle batched response (list of results)
    for i, location in enumerate(keys):
        try:
            temp = data[i]["current"]["temperature_2m"]
            rgb = temp_to_rgb(temp)
            weather_data["data"][location] = rgb
        except Exception as e:
            print(f"Error processing {location}: {e}")

    time.sleep(BETWEEN_BATCH_DELAY_SEC)

if weather_data["data"]:
    save_cache(weather_data["data"])
else:
    cached = load_cache()
    if cached:
        weather_data["data"] = cached
        print(f"[Cache] using cached weather data points={len(cached)}")


# Send full dataset
'''

for location_key, (lat, lon) in locations.items():
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m"
    }

    response = requests.get(base_url, params=params)

    if response.status_code != 200:
        print("Request failed:", response.text)
        continue

    data = response.json()

    temp = data["current"]["temperature_2m"]

    r,g,b = temp_to_rgb(temp)

    weather_data[location_key] = {
        "temp": temp,
        "rgb": [r,g,b]
    }
'''

payload = json.dumps(weather_data)
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
print(f"Published weather data via MQTT. points={len(weather_data['data'])}")

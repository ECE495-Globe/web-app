import requests
import json
import subprocess
import sys
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


def chunk_list(data, size):
    for i in range(0, len(data), size):
        yield data[i:i+size]


# Combine all locations
locations = {**countries, **states, **provinces}
location_items = list(locations.items())

base_url = "https://api.open-meteo.com/v1/forecast"

daynight_data = {
    "type": "Day-Night",
    "data": {}
}

BATCH_SIZE = 51 # Tried 200, was way to big, 50 was too small


def daynight_to_rgb(is_day):
    return [255, 200, 0] if is_day == 1 else [0, 0, 150]


# BATCH LOOP
for chunk in chunk_list(location_items, BATCH_SIZE):

    keys = [item[0] for item in chunk]
    lats = [item[1][0] for item in chunk]
    lons = [item[1][1] for item in chunk]

    params = {
        "latitude": lats,
        "longitude": lons,
        "current": "is_day"
    }

    try:
        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Batch request failed: {e}\n")
        continue

    # Handle batched response (list of results)
    for i, location in enumerate(keys):
        try:
            is_day = data[i]["current"]["is_day"]
            rgb = daynight_to_rgb(is_day)
            daynight_data["data"][location] = rgb
        except Exception as e:
            print(f"Error processing {location}: {e}\n")


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

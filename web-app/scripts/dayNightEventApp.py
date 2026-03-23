import requests
import json
import subprocess

# Reuse your coordinate dictionaries
from mapToCoordinates import countries, states, provinces

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

BATCH_SIZE = 50  # 5 calls total for ~250 locations

# Optional: convert day/night RGB (for LEDs or maps)
def daynight_to_rgb(is_day):
    if is_day == 1:
        return [255, 200, 0]  # soft daylight (warm white)
    else:
        return [0, 0, 150]    # dark blue (night)


for location, (lat, lon) in locations.items():
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "is_day"
    }

    try:
        response = requests.get(base_url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Request failed for {location}: {e}")
        continue

    is_day = data["current"]["is_day"]
    rgb = daynight_to_rgb(is_day)

    daynight_data["data"][location] = rgb


# Send full dataset
payload = json.dumps(daynight_data)

subprocess.run(["python3", "Publish.py", payload])
print("Day/Night data published to MQTT. Payload:", payload)
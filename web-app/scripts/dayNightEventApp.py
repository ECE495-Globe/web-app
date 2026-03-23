import requests
import json
import subprocess

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

BATCH_SIZE = 50 # Tried 200, was way to big


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
        response = requests.get(base_url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Batch request failed: {e}")
        continue

    # Handle batched response (list of results)
    for i, location in enumerate(keys):
        try:
            is_day = data[i]["current"]["is_day"]
            rgb = daynight_to_rgb(is_day)
            daynight_data["data"][location] = rgb
        except Exception as e:
            print(f"Error processing {location}: {e}")


# Send full dataset
payload = json.dumps(daynight_data)


# subprocess.run(["python3", "Publish.py", payload])
print("Day/Night data published to MQTT. Payload:", payload)
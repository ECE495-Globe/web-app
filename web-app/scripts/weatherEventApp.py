import requests
import json
import paho.mqtt.client as mqtt

from mapToCoordinates import countries, states, provinces

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


locations = {**countries, **states, **provinces}
# location_items = list(locations.items())
# print(locations)

base_url = "https://api.open-meteo.com/v1/forecast"


weather_data = {}


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


payload = json.dumps(weather_data)
print("Published weather data via MQTT. Payload:", payload)
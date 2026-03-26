import paho.mqtt.client as mqtt
import sys
import json


BROKER = "broker.hivemq.com"


data = json.loads(sys.argv[1])

client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
client.connect(BROKER, 1883, 60)

payload_type = data.get("type", "unknown")

print("Payload type:", payload_type)

def scale_luminosity(value):
    value = max(0, min(100, value))  # clamp
    return int(value * 2.55)

lum = scale_luminosity(data.get("luminosity", 100))


# Publishes all Settings before transmitting any Packets of LED data
def publish_config(data):
    client.publish("/trackpointai/globe/config/motorspeed", str(data.get("speed", 0)), qos=1)
    client.publish("/trackpointai/globe/config/motordir", str(data.get("direction", 0)), qos=1)
    client.publish("/trackpointai/globe/config/volume", str(data.get("volume", 0)), qos=1)
    client.publish("/trackpointai/globe/config/haptic", str(data.get("haptic", 0)), qos=1)

    # # Default/global instruction (acts like reset/base state)
    # instruction = f"global,{data.get('luminosity',100)},255,255,255" # Commented out for now
    # client.publish("/trackpointai/globe/instruction", instruction)


publish_config(data)



# DAY-NIGHT MODE
if payload_type == "Day-Night":

    day_night_data = data.get("data", {})

    instructions = ""

    for location, info in day_night_data.items():
        if "rgb" not in info:
            continue

        r, g, b = info["rgb"]
        instructions += f"{location},{lum},{r},{g},{b}\n"

    client.publish("/trackpointai/globe/instruction", instructions)



# WEATHER MODE
elif payload_type == "Weather":

    weather_data = data.get("data", {})

    instructions = ""

    for location, info in weather_data.items():
        if "rgb" not in info:
            continue

        r, g, b = info["rgb"]
        instructions += f"{location},{lum},{r},{g},{b}\n"

    client.publish("/trackpointai/globe/instruction", instructions)


# STRIPE MODE
elif payload_type == "Stripe":

    stripe_data = data.get("data", {})
    instructions = ""

    for location, info in stripe_data.items():
        if "rgb" not in info:
            continue

        r, g, b = info["rgb"]
        instructions += f"{location},{lum},{r},{g},{b}\n"
    # print("Instructions: ", instructions, flush=True)
    client.publish("/trackpointai/globe/instruction", instructions)

# CONTROL MODE (UI BUTTON ONLY CHANGES CONFIG)
elif payload_type == "control":

    print("Control-only update")
    # config already sent

else:
    print("Unknown payload type")

client.disconnect()
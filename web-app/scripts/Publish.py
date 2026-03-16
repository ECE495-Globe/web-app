import paho.mqtt.client as mqtt
import sys
import json
import os

BROKER = "broker.hivemq.com"


data = json.loads(sys.argv[1])

client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
client.connect(BROKER, 1883, 60)

client.publish("/trackpointai/globe/config/motorspeed", str(data["speed"]), qos=1)
print(str(data['speed']))
client.publish("/trackpointai/globe/config/motordir", str(data["direction"]), qos=1)
client.publish("/trackpointai/globe/config/volume", str(data["volume"]), qos=1)
client.publish("/trackpointai/globe/config/haptic", str(data["haptic"]), qos=1)

for location, info in data.items():

    r,g,b = info["rgb"]

    instruction = f"{location},255,{r},{g},{b}"

    client.publish("/trackpointai/globe/instruction", instruction)

# client.publish("/trackpointai/globe/instruction", instruction)

client.disconnect()
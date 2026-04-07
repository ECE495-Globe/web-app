import paho.mqtt.client as mqtt
import sys
import json
import os

BROKER = "broker.hivemq.com"
# Read-in data from globe

client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
client.connect(BROKER, 1883, 60)


client.disconnect()
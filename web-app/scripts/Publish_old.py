import paho.mqtt.client as mqtt
import sys
import os
import json
import paho.mqtt.client as mqtt
from time import time, sleep
# from cryptography.fernet import Fernet
import threading

# capstone495/group67/test

MQTT_BROKER = "broker.hivemq.com"
MQTT_TOPIC = "capstone495/group67/test"

def publish(payload: str):
    mqttBroker = MQTT_BROKER
    client = mqtt.Client(client_id="capstone495/group67/test", callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
    client.connect(mqttBroker)
    #client.connect(MQTT_BROKER, 1883, 60)

    client.publish(MQTT_TOPIC, payload, qos=1, retain=False)
    client.disconnect()

    print("Published successfully.")
    print(payload)


if __name__ == "__main__":

    # Option 1: Read from environment variable (recommended)
    payload = os.environ.get("PAYLOAD")

    # Option 2: Read from CLI argument (fallback)
    if not payload and len(sys.argv) > 1:
        payload = sys.argv[1]

    if not payload:
        print("No payload received.")
        sys.exit(1)

    # Validate it's valid JSON (optional but good practice)
    try:
        json.loads(payload)
    except Exception:
        print("Invalid JSON payload.")
        sys.exit(1)

    publish(payload)
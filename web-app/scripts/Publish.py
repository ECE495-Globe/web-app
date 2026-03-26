import paho.mqtt.client as mqtt
import sys
import json
from datetime import datetime
from pathlib import Path


BROKER = "broker.hivemq.com"

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


data = json.loads(sys.argv[1])

try:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
except AttributeError:
    client = mqtt.Client()
client.connect(BROKER, 1883, 60)
client.loop_start()

payload_type = data.get("type", "unknown")

print("Payload type:", payload_type)

def scale_luminosity(value):
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        numeric = 100.0
    numeric = max(0, min(100, numeric))  # clamp
    return round(numeric)

lum = scale_luminosity(data.get("luminosity", 100))

def normalize_rgb(info):
    if isinstance(info, dict):
        rgb = info.get("rgb")
    elif isinstance(info, (list, tuple)):
        rgb = info
    else:
        return None

    if not isinstance(rgb, (list, tuple)) or len(rgb) < 3:
        return None

    return rgb[0], rgb[1], rgb[2]

def sanitize_instruction_payload(message):
    corrected_lines = []
    adjusted = 0

    for line in message.splitlines():
        parts = line.split(",")
        if len(parts) != 5:
            corrected_lines.append(line)
            continue

        try:
            brightness = int(float(parts[1]))
        except (TypeError, ValueError):
            brightness = 100

        clamped_brightness = max(0, min(100, brightness))
        if clamped_brightness != brightness:
            adjusted += 1
        parts[1] = str(clamped_brightness)
        corrected_lines.append(",".join(parts))

    if adjusted:
        print(f"[Instruction sanitize] adjusted brightness on {adjusted} line(s)", flush=True)

    return "\n".join(corrected_lines) + ("\n" if message.endswith("\n") else "")


def publish_with_debug(topic, message):
    if topic == "/trackpointai/globe/instruction":
        message = sanitize_instruction_payload(message)

    info = client.publish(topic, message, qos=1)
    print(
        f"[MQTT publish] topic={topic} bytes={len(message.encode('utf-8'))} mid={info.mid} rc={info.rc}",
        flush=True,
    )
    try:
        info.wait_for_publish(timeout=5)
    except TypeError:
        info.wait_for_publish()
    print(f"[MQTT ack] topic={topic} published={info.is_published()}", flush=True)
    if not info.is_published():
        print(f"[MQTT warn] publish timed out topic={topic}", flush=True)


# Publishes all Settings before transmitting any Packets of LED data
def publish_config(data):
    publish_with_debug("/trackpointai/globe/config/motorspeed", str(data.get("speed", 0)))
    publish_with_debug("/trackpointai/globe/config/motordir", str(data.get("direction", 0)))
    publish_with_debug("/trackpointai/globe/config/volume", str(data.get("volume", 0)))
    publish_with_debug("/trackpointai/globe/config/haptic", str(data.get("haptic", 0)))

    # # Default/global instruction (acts like reset/base state)
    # instruction = f"global,{data.get('luminosity',100)},255,255,255" # Commented out for now
    # client.publish("/trackpointai/globe/instruction", instruction)


def has_control_updates(payload):
    return any(key in payload for key in ("speed", "direction", "volume", "haptic"))


if has_control_updates(data):
    publish_config(data)
else:
    print("[Config] no control fields in payload, skipping config publish", flush=True)



# DAY-NIGHT MODE
if payload_type == "Day-Night":

    day_night_data = data.get("data", {})

    instructions = ""
    parsed_count = 0

    for location, info in day_night_data.items():
        normalized = normalize_rgb(info)
        if normalized is None:
            continue

        r, g, b = normalized
        instructions += f"{location},{lum},{r},{g},{b}\n"
        parsed_count += 1

    print(f"[Instruction build] mode=Day-Night total={len(day_night_data)} valid={parsed_count}", flush=True)
    print(f"[Instruction sample] {instructions.splitlines()[:3]}", flush=True)
    publish_with_debug("/trackpointai/globe/instruction", instructions)



# WEATHER MODE
elif payload_type == "Weather":

    weather_data = data.get("data", {})

    instructions = ""
    parsed_count = 0

    for location, info in weather_data.items():
        normalized = normalize_rgb(info)
        if normalized is None:
            continue

        r, g, b = normalized
        instructions += f"{location},{lum},{r},{g},{b}\n"
        parsed_count += 1

    print(f"[Instruction build] mode=Weather total={len(weather_data)} valid={parsed_count}", flush=True)
    print(f"[Instruction sample] {instructions.splitlines()[:3]}", flush=True)
    publish_with_debug("/trackpointai/globe/instruction", instructions)


# STRIPE MODE
elif payload_type == "Stripe":

    stripe_data = data.get("data", {})
    instructions = ""
    parsed_count = 0

    for location, info in stripe_data.items():
        normalized = normalize_rgb(info)
        if normalized is None:
            continue

        r, g, b = normalized
        instructions += f"{location},{lum},{r},{g},{b}\n"
        parsed_count += 1

    print(f"[Instruction build] mode=Stripe total={len(stripe_data)} valid={parsed_count}", flush=True)
    print(f"[Instruction sample] {instructions.splitlines()[:3]}", flush=True)
    publish_with_debug("/trackpointai/globe/instruction", instructions)

# CONTROL MODE (UI BUTTON ONLY CHANGES CONFIG)
elif payload_type == "control":

    print("Control-only update")
    # config already sent

else:
    print("Unknown payload type")

client.loop_stop()
client.disconnect()

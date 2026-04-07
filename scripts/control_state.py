import json
from pathlib import Path


CONTROL_STATE_FILE = Path(__file__).resolve().parent.parent / "data" / "control-state.json"


def load_control_state():
    try:
        with open(CONTROL_STATE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def load_luminosity(default=100):
    try:
        data = load_control_state()
        value = data.get("luminosity", default)
        numeric = float(value)
        return round(max(0, min(100, numeric)))
    except Exception:
        return default


def is_luminosity_enabled(default=True):
    data = load_control_state()
    return data.get("luminosityEnabled", default) is not False

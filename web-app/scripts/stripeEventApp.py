import requests
import json
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

from stripeToKey import countries


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



# =========================
# ENV SETUP
# =========================
load_dotenv()
STRIPE_KEY = os.getenv("STRIPE_SECRET_KEY")

DATA_FILE = "transactions.json"

# =========================
# STORAGE
# =========================
def load_transactions():
    if not os.path.exists(DATA_FILE):
        return []

    with open(DATA_FILE, "r") as f:
        raw = json.load(f)

    return [
        {
            "id": tx.get("id"),
            "key": tx["key"],
            "amount": tx["amount"],
            "time": datetime.fromisoformat(tx["time"])
        }
        for tx in raw
    ]


def save_transactions(transactions):
    with open(DATA_FILE, "w") as f:
        json.dump([
            {
                "id": tx.get("id"),
                "key": tx["key"],
                "amount": tx["amount"],
                "time": tx["time"].isoformat()
            }
            for tx in transactions
        ], f, indent=2)


transactions = load_transactions()
# transactions = []

# =========================
# COLOR MAPPING
# =========================
def revenue_to_rgb(value):
    v = max(0, min(100000, value))

    if v == 0: return(0, 0, 0) # Light is off
    if v <= 10: return (128, 0, 128) # Purple
    if v <= 100: return (0, 0, 255) # Blue
    if v <= 1000: return (0, 255, 0) # Green
    if v <= 10000: return (255, 255, 0) # Yellow
    if v <= 100000: return (255, 165, 0) # Orange

    return (255, 0, 0) # Red

# =========================
# INGEST DATA
# =========================
def ingest(data):
    if not data or "data" not in data:
        print("No valid data to ingest")
        return

    seen_ids = {tx.get("id") for tx in transactions if tx.get("id")}

    for charge in data.get("data", []):

        if charge.get("status") != "succeeded":
            continue

        charge_id = charge.get("id")
        if charge_id in seen_ids:
            continue

        # Correct country extraction for Charges API
        country = (
            charge.get("billing_details", {})
                  .get("address", {})
                  .get("country")
        )

        if not country:
            continue

        key = countries.get(country.upper())
        if not key:
            continue

        timestamp = charge.get(
            "created",
            int(datetime.now(timezone.utc).timestamp())
        )

        amount = charge.get("amount", 0) / 100

        transactions.append({
            "id": charge_id,
            "key": key,
            "amount": amount,
            "time": datetime.fromtimestamp(timestamp, timezone.utc)
        })

    save_transactions(transactions)

# =========================
# AGGREGATE BY TIME WINDOW
# =========================
def aggregate(window_hours):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=window_hours)

    revenue_map = {}

    for tx in transactions:
        if tx["time"] < cutoff:
            continue

        key = tx["key"]
        revenue_map[key] = revenue_map.get(key, 0) + tx["amount"]

    return {
        key: revenue_to_rgb(value)
        for key, value in revenue_map.items()
    }

# =========================
# FETCH STRIPE DATA
# =========================
def fetch_data():
    if not STRIPE_KEY:
        print("No Stripe key found")
        return None
    
    try:
        response = requests.get(
            "https://api.stripe.com/v1/charges", # payment_intents
            headers={"Authorization": f"Bearer {STRIPE_KEY}"},
            params={
                "limit": 10000,
                # "expand[]": "data.charges" # Comment if polling charges
            },
            timeout=5
        )
        response.raise_for_status()
        return response.json()

    except Exception as e:
        print("Stripe fetch failed:", e)
        return None

# =========================
# MAIN
# =========================
data = fetch_data()

if not data:
    print("No data received from Stripe")
    exit()

ingest(data)

stripe_data = {
    "type": "Stripe",
    "data": aggregate(24*365)
    # "data": {
    #     "daily": aggregate(24),
    #     "weekly": aggregate(24 * 7),
    #     "monthly": aggregate(24 * 30),
    #     "yearly": aggregate(24 * 365)
    # }
}

payload = json.dumps(stripe_data)
publish_script = str(Path(__file__).resolve().parent / "Publish.py")

print(f"Stripe payload prepared. points={len(stripe_data['data'])}")
print(payload)
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
print(f"Published stripe data via MQTT. points={len(stripe_data['data'])}")

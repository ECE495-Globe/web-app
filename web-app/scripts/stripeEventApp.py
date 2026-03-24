import requests
import json
import os
import random
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

from stripeToKey import countries

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
                "key": tx["key"],
                "amount": tx["amount"],
                "time": tx["time"].isoformat()
            }
            for tx in transactions
        ], f, indent=2)


transactions = load_transactions()

# =========================
# FAKE DATA (FOR TESTING)
# =========================
def generate_fake_data(n=50):
    fake = []

    for _ in range(n):
        country = random.choice(list(countries.keys()))

        fake.append({
            "amount": random.randint(100, 20000),
            "billing_details": {
                "address": {
                    "country": country
                }
            },
            "created": int(datetime.now(timezone.utc).timestamp())
        })

    return {"data": fake}


# =========================
# COLOR MAPPING
# =========================
def revenue_to_rgb(value):
    v = max(0, min(100000, value))

    if v == 0: return (0, 0, 0)
    if v <= 10: return (0, 0, 255)
    if v <= 100: return (0, 255, 0)
    if v <= 1000: return (255, 255, 0)
    if v <= 10000: return (255, 165, 0)

    return (255, 0, 0)


# =========================
# INGEST DATA
# =========================
def ingest(data):
    for charge in data.get("data", []):
        address = charge.get("billing_details", {}).get("address", {})
        country = address.get("country")

        timestamp = charge.get(
            "created",
            int(datetime.now(timezone.utc).timestamp())
        )

        amount = charge.get("amount", 0) / 100

        key = countries.get(country.upper()) if country else None
        if not key:
            continue

        transactions.append({
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
# FETCH DATA (REAL OR FAKE)
# =========================
def fetch_data():
    if STRIPE_KEY:
        try:
            response = requests.get(
                "https://api.stripe.com/v1/charges",
                headers={"Authorization": f"Bearer {STRIPE_KEY}"},
                params={"limit": 100},
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print("Stripe fetch failed, using fake data:", e)

    return generate_fake_data(20)


# =========================
# MAIN
# =========================
data = fetch_data()
ingest(data)

stripe_data = {
    "type": "Stripe",
    "data": {
        "daily": aggregate(24),
        "weekly": aggregate(24 * 7),
        "monthly": aggregate(24 * 30),
        "yearly": aggregate(24 * 365)
    }
}

payload = json.dumps(stripe_data)

print(payload)
print("Published stripe data via MQTT")
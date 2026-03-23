import requests
import json
import os

from mapToCoordinates import provinces, states, countries

STRIPE_KEY = os.getenv("STRIPE_SECRET_KEY")

base_url = "https://api.stripe.com/v1/charges"

# Combine lookup tables
locations_lookup = {**provinces, **states, **countries}

def revenue_to_rgb(value):
    v = max(0, min(100000, value))

    if v == 0: return (0, 0, 0)
    if v <= 10: return (0, 0, 255)
    if v <= 100: return (0, 255, 0)
    if v <= 1000: return (255, 255, 0)
    if v <= 10000: return (255, 165, 0)

    return (255, 0, 0) # Return red if amount > 100,000


# Fetch Stripe charges
response = requests.get(
    base_url,
    headers={"Authorization": f"Bearer {STRIPE_KEY}"},
    params={"limit": 100}
)

data = response.json()

revenue_map = {}

for charge in data.get("data", []):
    address = charge.get("billing_details", {}).get("address", {})

    country = address.get("country")
    state = address.get("state")

    key = None

    # USA
    if country == "US" and state:
        key = state[:3].title()  # "Cal", "Tex"

    # Canada
    elif country == "CA" and state:
        key = state.upper()  # "ON", "BC"

    # Countries
    elif country:
        key = country.upper()[:3]

    if not key or key not in locations_lookup:
        continue

    amount = charge.get("amount", 0) / 100

    revenue_map[key] = revenue_map.get(key, 0) + amount


# Convert to payload format
formatted_output = []

for key, revenue in revenue_map.items():
    r, g, b = revenue_to_rgb(revenue)

    formatted_output.append(f"{key}:{revenue}:{r}:{g}:{b}")
    # print(formatted_output)


payload = json.dumps(formatted_output)
print("Published stripe data via MQTT", formatted_output)

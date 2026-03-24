import requests
import random

url = "https://api.stripe.com/v1/charges"

headers = {
    "Authorization": f"Bearer {STRIPE_KEY}"
}

for _ in range(20):
    data = {
        "amount": random.randint(100, 20000),
        "currency": "usd",
        "source": "tok_visa",
        "description": "Bulk test",
        "billing_details[address][country]": random.choice(countries),
        "billing_details[address][state]": random.choice(states)
    }

    requests.post(
        "https://api.stripe.com/v1/charges",
        headers={"Authorization": f"Bearer {STRIPE_KEY}"},
        data=data
    )

response = requests.post(url, headers=headers, data=data)
print(response.json())
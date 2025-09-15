import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Sample user credentials for authentication (should exist in system)
USER_CREDENTIALS = {
    "email": "testuser@example.com",
    "password": "Test@1234"
}

def authenticate():
    url = f"{BASE_URL}/auth/login"
    resp = requests.post(url, json=USER_CREDENTIALS, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Authentication failed: {resp.text}"
    data = resp.json()
    assert "token" in data
    return data["token"]

def test_sales_pipeline():
    token = authenticate()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        # 1. Kanban visual negotiations (list negotiations)
        kanban_url = f"{BASE_URL}/sales/negotiations"
        kanban_resp = requests.get(kanban_url, headers=headers, timeout=TIMEOUT)
        assert kanban_resp.status_code == 200
        kanban_data = kanban_resp.json()
        assert isinstance(kanban_data, list)

        # 2. Sales simulation (simulate a sale)
        sim_url = f"{BASE_URL}/sales/simulate"
        # Example payload for sale simulation
        sim_payload = {
            "lotId": None,
            "quantity": 5,
            "pricePerAnimal": 1500.0,
            "discount": 0.05
        }

        # Need to create a lot to simulate sale if lotId is required
        lot_id = None
        # Create lot for simulation
        lot_payload = {
            "name": "Test Lot for Sale Simulation",
            "description": "Lot created for sales simulation test",
            "quantity": 10
        }
        lot_resp = requests.post(f"{BASE_URL}/lots", json=lot_payload, headers=headers, timeout=TIMEOUT)
        assert lot_resp.status_code == 201
        lot_id = lot_resp.json().get("id")
        assert lot_id is not None
        sim_payload["lotId"] = lot_id

        sim_resp = requests.post(sim_url, json=sim_payload, headers=headers, timeout=TIMEOUT)
        assert sim_resp.status_code == 200
        sim_result = sim_resp.json()
        assert "totalPrice" in sim_result and sim_result["totalPrice"] > 0

        # 3. Register a sale
        sale_url = f"{BASE_URL}/sales"
        sale_payload = {
            "lotId": lot_id,
            "quantity": 5,
            "unitPrice": 1500.0,
            "buyer": "Buyer Test",
            "date": "2024-06-01",
            "paymentStatus": "pending"
        }
        sale_resp = requests.post(sale_url, json=sale_payload, headers=headers, timeout=TIMEOUT)
        assert sale_resp.status_code == 201
        sale_id = sale_resp.json().get("id")
        assert sale_id is not None

        # 4. Register a slaughter related to the sale
        slaughter_url = f"{BASE_URL}/slaughters"
        slaughter_payload = {
            "saleId": sale_id,
            "date": "2024-06-02",
            "weight": 350,  # kg
            "slaughterhouse": "Frigorifico Test"
        }
        slaughter_resp = requests.post(slaughter_url, json=slaughter_payload, headers=headers, timeout=TIMEOUT)
        assert slaughter_resp.status_code == 201
        slaughter_id = slaughter_resp.json().get("id")
        assert slaughter_id is not None

        # 5. Payment control - update payment status to "completed"
        payment_url = f"{BASE_URL}/sales/{sale_id}/payment"
        payment_payload = {"status": "completed", "paidAt": "2024-06-03"}
        payment_resp = requests.put(payment_url, json=payment_payload, headers=headers, timeout=TIMEOUT)
        assert payment_resp.status_code == 200
        payment_data = payment_resp.json()
        assert payment_data.get("paymentStatus") == "completed"

        # 6. Performance analytics (summary stats about sales)
        analytics_url = f"{BASE_URL}/sales/analytics"
        analytics_resp = requests.get(analytics_url, headers=headers, timeout=TIMEOUT)
        assert analytics_resp.status_code == 200
        analytics_data = analytics_resp.json()
        assert isinstance(analytics_data, dict)
        # Example expected keys in analytics data
        for key in ("totalSales", "totalRevenue", "averagePrice"):
            assert key in analytics_data

        # 7. Integration with slaughterhouses - list slaughters and check data
        slaughters_list_url = f"{BASE_URL}/slaughters"
        slaughters_resp = requests.get(slaughters_list_url, headers=headers, timeout=TIMEOUT)
        assert slaughters_resp.status_code == 200
        slaughters_data = slaughters_resp.json()
        assert any(sl.get("id") == slaughter_id for sl in slaughters_data)

    finally:
        # Cleanup created resources
        if 'payment_url' in locals():
            requests.delete(payment_url, headers=headers, timeout=TIMEOUT)
        if 'slaughter_id' in locals():
            requests.delete(f"{BASE_URL}/slaughters/{slaughter_id}", headers=headers, timeout=TIMEOUT)
        if 'sale_id' in locals():
            requests.delete(f"{BASE_URL}/sales/{sale_id}", headers=headers, timeout=TIMEOUT)
        if lot_id:
            requests.delete(f"{BASE_URL}/lots/{lot_id}", headers=headers, timeout=TIMEOUT)

test_sales_pipeline()

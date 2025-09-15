import requests

BASE_URL = "http://localhost:3001"
AUTH_URL = f"{BASE_URL}/api/v1/auth/login"
CATTLE_PURCHASES_URL = f"{BASE_URL}/api/v1/cattle-purchases"
EMAIL = "carlosedufaraujo@outlook.com"
PASSWORD = "368308450Ce*"
TIMEOUT = 30

def test_cattle_purchase_management_api():
    # Authenticate and get JWT token
    auth_payload = {"email": EMAIL, "password": PASSWORD}
    auth_response = requests.post(AUTH_URL, json=auth_payload, timeout=TIMEOUT)
    assert auth_response.status_code == 200, f"Auth failed: {auth_response.text}"
    auth_data = auth_response.json()
    assert "token" in auth_data, "No token in auth response"
    token = auth_data["token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    purchase_id = None
    try:
        # 1. CREATE a new cattle purchase
        create_payload = {
            "animalId": 1,
            "purchaseDate": "2024-06-15",
            "price": 1500.75,
            "seller": "Fazenda Boa Vista",
            "notes": "Compra inicial para rebanho",
            "vendorId": "10",
            "payerAccountId": "5",
            "animalType": "MALE",
            "initialQuantity": 50,
            "purchaseWeight": 500.0,
            "carcassYield": 60.0,
            "pricePerArroba": 250.5,
            "paymentType": "CASH"
        }
        create_response = requests.post(CATTLE_PURCHASES_URL, json=create_payload, headers=headers, timeout=TIMEOUT)
        assert create_response.status_code == 201, f"Create failed: {create_response.text}"
        create_data = create_response.json()
        assert "id" in create_data, "Created purchase has no id"
        purchase_id = create_data["id"]

        # 2. READ (GET) the created cattle purchase by ID
        get_response = requests.get(f"{CATTLE_PURCHASES_URL}/{purchase_id}", headers=headers, timeout=TIMEOUT)
        assert get_response.status_code == 200, f"Get failed: {get_response.text}"
        get_data = get_response.json()
        assert get_data["id"] == purchase_id
        assert get_data["animalId"] == create_payload["animalId"]
        assert get_data["seller"] == create_payload["seller"]

        # 3. UPDATE the cattle purchase
        update_payload = {
            "price": 1600.00,
            "notes": "Preço atualizado após negociação"
        }
        update_response = requests.put(f"{CATTLE_PURCHASES_URL}/{purchase_id}", json=update_payload, headers=headers, timeout=TIMEOUT)
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        update_data = update_response.json()
        assert update_data["price"] == update_payload["price"]
        assert update_data["notes"] == update_payload["notes"]

        # 4. LIST all cattle purchases (pagination or filter can be tested as well)
        list_response = requests.get(CATTLE_PURCHASES_URL, headers=headers, timeout=TIMEOUT)
        assert list_response.status_code == 200, f"List failed: {list_response.text}"
        list_data = list_response.json()
        assert isinstance(list_data, list), "List response is not a list"
        assert any(p["id"] == purchase_id for p in list_data), "Created purchase not in list"

        # 5. DELETE the cattle purchase
        delete_response = requests.delete(f"{CATTLE_PURCHASES_URL}/{purchase_id}", headers=headers, timeout=TIMEOUT)
        assert delete_response.status_code == 204, f"Delete failed: {delete_response.text}"

        # 6. VERIFY deletion by GET returns 404
        get_after_delete_response = requests.get(f"{CATTLE_PURCHASES_URL}/{purchase_id}", headers=headers, timeout=TIMEOUT)
        assert get_after_delete_response.status_code == 404, "Deleted purchase still accessible"

        # 7. TEST error handling: create with invalid data (missing required field)
        invalid_payload = {
            "purchaseDate": "2024-06-15",
            "price": "invalid_price",
            "seller": ""
        }
        invalid_create_response = requests.post(CATTLE_PURCHASES_URL, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        assert invalid_create_response.status_code == 400, "Invalid create did not return 400"

        # 8. TEST error handling: unauthorized access
        unauth_response = requests.get(CATTLE_PURCHASES_URL, timeout=TIMEOUT)
        assert unauth_response.status_code == 401, "Unauthenticated request did not return 401"

    finally:
        if purchase_id:
            # Cleanup: Delete the purchase if it still exists (ignore errors)
            requests.delete(f"{CATTLE_PURCHASES_URL}/{purchase_id}", headers=headers, timeout=TIMEOUT)


test_cattle_purchase_management_api()

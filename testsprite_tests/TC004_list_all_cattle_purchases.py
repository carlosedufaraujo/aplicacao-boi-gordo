import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_list_all_cattle_purchases():
    url = f"{BASE_URL}/api/v1/cattle-purchases"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to list all cattle purchases failed: {e}"
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert isinstance(data, list), "Response JSON is not a list of cattle purchases"
    # Optionally check structure if list is not empty
    if data:
        purchase = data[0]
        expected_keys = {
            "vendorId", "payerAccountId", "purchaseDate", "animalType", "initialQuantity",
            "purchaseWeight", "carcassYield", "pricePerArroba", "paymentType"
        }
        # The API might return additional fields, ensure required keys exist and with correct types
        for key in expected_keys:
            assert key in purchase, f"Missing key '{key}' in cattle purchase item"
        assert isinstance(purchase.get("vendorId"), str), "vendorId should be a string"
        assert isinstance(purchase.get("payerAccountId"), str), "payerAccountId should be a string"
        assert isinstance(purchase.get("purchaseDate"), str), "purchaseDate should be a string"
        assert purchase.get("animalType") in {"MALE", "FEMALE", "MIXED"}, "Invalid animalType value"
        assert isinstance(purchase.get("initialQuantity"), int) and purchase.get("initialQuantity") >= 1, "initialQuantity should be integer >= 1"
        assert isinstance(purchase.get("purchaseWeight"), (int, float)) and purchase.get("purchaseWeight") >= 1, "purchaseWeight should be number >= 1"
        carcass_yield = purchase.get("carcassYield")
        assert isinstance(carcass_yield, (int, float)) and 0.01 <= carcass_yield <= 100, "carcassYield should be number between 0.01 and 100"
        price_per_arroba = purchase.get("pricePerArroba")
        assert isinstance(price_per_arroba, (int, float)) and price_per_arroba >= 0, "pricePerArroba should be number >= 0"
        assert purchase.get("paymentType") in {"CASH", "INSTALLMENT", "BARTER"}, "Invalid paymentType value"

test_list_all_cattle_purchases()
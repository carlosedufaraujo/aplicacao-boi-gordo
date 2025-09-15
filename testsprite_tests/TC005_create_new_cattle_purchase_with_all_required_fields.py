import requests
import datetime

BASE_URL = "http://localhost:3001"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_create_new_cattle_purchase_with_all_required_fields():
    # Helper function to create a partner
    def create_partner(name, ptype):
        payload = {"name": name, "type": ptype}
        resp = requests.post(f"{BASE_URL}/api/v1/partners", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json().get("id") or resp.json().get("partnerId") or resp.json().get("id") or resp.json().get("_id") or resp.json()

    # Create vendor and payerAccount partners (required IDs)
    vendor_id = None
    payer_account_id = None
    cattle_purchase_id = None

    try:
        vendor_id = create_partner("Test Vendor for TC005", "VENDOR")
        assert vendor_id is not None and isinstance(vendor_id, str), "vendorId must be a non-empty string"

        payer_account_id = create_partner("Test Payer Account for TC005", "BUYER")
        assert payer_account_id is not None and isinstance(payer_account_id, str), "payerAccountId must be a non-empty string"

        purchase_date = datetime.datetime.utcnow().isoformat() + "Z"

        # Compose payload with all required fields valid and matching schema constraints
        payload = {
            "vendorId": vendor_id,
            "payerAccountId": payer_account_id,
            "purchaseDate": purchase_date,
            "animalType": "MALE",
            "initialQuantity": 10,
            "purchaseWeight": 1500.5,
            "carcassYield": 55.25,
            "pricePerArroba": 200.0,
            "paymentType": "CASH"
        }

        response = requests.post(f"{BASE_URL}/api/v1/cattle-purchases", json=payload, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 201, f"Unexpected status code {response.status_code}, response: {response.text}"

        data = response.json()
        # Validate that a resource id or confirmation is returned
        cattle_purchase_id = data.get("id") or data.get("cattlePurchaseId") or data.get("purchaseId") or data.get("id") or data.get("_id")
        assert cattle_purchase_id is not None, "Response should contain the created cattle purchase ID"

        # Validate returned fields match input types and values (basic validation)
        for key in payload:
            assert key in data, f"Response missing expected key '{key}'"
            if isinstance(payload[key], float):
                assert abs(float(data[key]) - payload[key]) < 1e-4, f"Field {key} differs in response"
            else:
                assert data[key] == payload[key], f"Field {key} value mismatch in response"

    finally:
        # Cleanup: delete created cattle purchase and partners to keep environment clean
        if cattle_purchase_id:
            try:
                requests.delete(f"{BASE_URL}/api/v1/cattle-purchases/{cattle_purchase_id}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass
        if vendor_id:
            try:
                requests.delete(f"{BASE_URL}/api/v1/partners/{vendor_id}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass
        if payer_account_id:
            try:
                requests.delete(f"{BASE_URL}/api/v1/partners/{payer_account_id}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass

test_create_new_cattle_purchase_with_all_required_fields()
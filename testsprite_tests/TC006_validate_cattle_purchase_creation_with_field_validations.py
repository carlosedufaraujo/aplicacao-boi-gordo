import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime, timezone
import uuid

BASE_URL = "http://localhost:3001"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
PARTNERS_URL = f"{BASE_URL}/api/v1/partners"
CATTLE_PURCHASES_URL = f"{BASE_URL}/api/v1/cattle-purchases"

USERNAME = "carlosedufaraujo@outlook.com"
PASSWORD = "368308450Ce*"

def test_tc006_validate_cattle_purchase_creation_with_field_validations():
    # Helper function to get auth token via login
    def get_auth_token():
        payload = {"email": USERNAME, "password": PASSWORD}
        resp = requests.post(LOGIN_URL, json=payload, timeout=30)
        assert resp.status_code == 200, "Login failed"
        token = resp.json().get("token")
        assert token, "No token received"
        return token

    # Helper to create a vendor partner and return its id by querying after creation
    def create_vendor_partner(headers):
        unique_name = f"Vendor-{uuid.uuid4()}"
        vendor_data = {
            "name": unique_name,
            "type": "VENDOR",
            "cpfCnpj": "12345678901234",
            "phone": "5599999999999",
            "email": f"{unique_name}@example.com",
            "address": "Rua Teste, 123"
        }
        r = requests.post(PARTNERS_URL, json=vendor_data, headers=headers, timeout=30)
        assert r.status_code == 201, f"Failed to create vendor partner: {r.text}"
        # Query partner list to get ID
        params = {"type": "VENDOR", "page": 1, "limit": 50}
        list_resp = requests.get(PARTNERS_URL, headers=headers, params=params, timeout=30)
        assert list_resp.status_code == 200, f"Failed to list partners: {list_resp.text}"
        try:
            partners_list = list_resp.json()
        except Exception as ex:
            assert False, f"Failed to parse partner list response JSON: {ex}"

        if isinstance(partners_list, dict) and "data" in partners_list:
            partners = partners_list["data"]
        elif isinstance(partners_list, list):
            partners = partners_list
        else:
            assert False, "Partner list response format is not as expected"

        for partner in partners:
            if partner.get("name") == unique_name:
                return partner.get("id")
        assert False, "Created vendor partner not found in list"

    # Helper to create a payer account partner of type OTHER and return id similarly
    def create_payer_partner(headers):
        unique_name = f"Payer-{uuid.uuid4()}"
        payer_data = {
            "name": unique_name,
            "type": "OTHER",
            "cpfCnpj": "98765432100123",
            "phone": "5511888888888",
            "email": f"{unique_name}@example.com",
            "address": "Avenida Exemplo, 456"
        }
        r = requests.post(PARTNERS_URL, json=payer_data, headers=headers, timeout=30)
        assert r.status_code == 201, f"Failed to create payer partner: {r.text}"
        params = {"type": "OTHER", "page":1, "limit": 50}
        list_resp = requests.get(PARTNERS_URL, headers=headers, params=params, timeout=30)
        assert list_resp.status_code == 200, f"Failed to list partners: {list_resp.text}"
        try:
            partners_list = list_resp.json()
        except Exception as ex:
            assert False, f"Failed to parse partner list response JSON: {ex}"

        if isinstance(partners_list, dict) and "data" in partners_list:
            partners = partners_list["data"]
        elif isinstance(partners_list, list):
            partners = partners_list
        else:
            assert False, "Partner list response format is not as expected"

        for partner in partners:
            if partner.get("name") == unique_name:
                return partner.get("id")
        assert False, "Created payer partner not found in list"

    token = get_auth_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    vendor_id = None
    payer_id = None
    created_cattle_purchase_id = None

    try:
        # Create vendor and payer partners to use their IDs
        vendor_id = create_vendor_partner(headers)
        payer_id = create_payer_partner(headers)
        assert vendor_id, "Vendor partner ID not returned"
        assert payer_id, "Payer account partner ID not returned"

        # 1) Test success case: create cattle purchase with all valid required fields
        valid_payload = {
            "vendorId": vendor_id,
            "payerAccountId": payer_id,
            "purchaseDate": datetime.now(timezone.utc).isoformat(),
            "animalType": "MALE",
            "initialQuantity": 10,
            "purchaseWeight": 1500.5,
            "carcassYield": 55.5,
            "pricePerArroba": 300.0,
            "paymentType": "CASH"
        }
        resp = requests.post(CATTLE_PURCHASES_URL, json=valid_payload, headers=headers, timeout=30)
        assert resp.status_code == 201, f"Valid cattle purchase creation failed: {resp.text}"
        json_resp = resp.json()
        created_cattle_purchase_id = json_resp.get("id") or json_resp.get("cattlePurchaseId") or (json_resp.get("data") and json_resp["data"].get("id"))
        assert created_cattle_purchase_id, "Created cattle purchase ID not returned"

        # 2) Test 400 Bad Request: missing required field (e.g. no vendorId)
        invalid_payload_missing_vendor = valid_payload.copy()
        invalid_payload_missing_vendor.pop("vendorId")
        resp400 = requests.post(CATTLE_PURCHASES_URL, json=invalid_payload_missing_vendor, headers=headers, timeout=30)
        assert resp400.status_code == 400, f"Expected 400 on missing vendorId, got {resp400.status_code}"

        # 3) Test 400 Bad Request: invalid field value (e.g. carcassYield > 100)
        invalid_payload_bad_yield = valid_payload.copy()
        invalid_payload_bad_yield["carcassYield"] = 120.0
        resp400b = requests.post(CATTLE_PURCHASES_URL, json=invalid_payload_bad_yield, headers=headers, timeout=30)
        assert resp400b.status_code == 400, f"Expected 400 on invalid carcassYield, got {resp400b.status_code}"

        # 4) Test 401 Unauthorized: no auth header
        resp401 = requests.post(CATTLE_PURCHASES_URL, json=valid_payload, timeout=30)
        assert resp401.status_code == 401, f"Expected 401 unauthorized, got {resp401.status_code}"

    finally:
        # Cleanup: delete created cattle purchase if possible
        if created_cattle_purchase_id:
            try:
                del_resp = requests.delete(f"{CATTLE_PURCHASES_URL}/{created_cattle_purchase_id}", headers=headers, timeout=30)
                # deletion might not be implemented; just ignore failures here
            except Exception:
                pass
        # Cleanup vendor partner
        if vendor_id:
            try:
                requests.delete(f"{PARTNERS_URL}/{vendor_id}", headers=headers, timeout=30)
            except Exception:
                pass
        # Cleanup payer partner
        if payer_id:
            try:
                requests.delete(f"{PARTNERS_URL}/{payer_id}", headers=headers, timeout=30)
            except Exception:
                pass

test_tc006_validate_cattle_purchase_creation_with_field_validations()

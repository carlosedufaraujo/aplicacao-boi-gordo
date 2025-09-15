import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3001"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
PARTNERS_URL = f"{BASE_URL}/api/v1/partners"
TIMEOUT = 30

auth_username = "carlosedufaraujo@outlook.com"
auth_password = "368308450Ce*"


def test_validate_partner_creation_with_data_validation():
    # Step 1: Login to get JWT token
    login_payload = {
        "email": auth_username,
        "password": auth_password
    }
    login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, "Login failed with valid credentials"
    token = login_resp.json().get("token")
    assert token and isinstance(token, str), "JWT token not found in login response"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    created_partner_id = None

    try:
        # Step 2: Create partner with valid data
        valid_partner_data = {
            "name": "Valid Partner Ltd",
            "type": "VENDOR",
            "cpfCnpj": "12345678000199",
            "phone": "+5511999999999",
            "email": "validpartner@example.com",
            "address": "123 Fazenda Road"
        }
        create_resp = requests.post(PARTNERS_URL, json=valid_partner_data, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Expected 201 Created, got {create_resp.status_code}"
        create_resp_json = create_resp.json()
        # Confirm returned data contains at least the id or name or similar
        # Assuming API returns created partner data including a unique identifier "id"
        created_partner_id = create_resp_json.get("id") or create_resp_json.get("_id")
        assert created_partner_id is not None, "Created partner ID not returned"

        # Step 3: Create partner with invalid data (missing required 'name')
        invalid_partner_data = {
            "type": "VENDOR",
            "cpfCnpj": "invalid_cpf",
            "phone": "12345",
            "email": "not-an-email",
            "address": ""
        }
        invalid_resp = requests.post(PARTNERS_URL, json=invalid_partner_data, headers=headers, timeout=TIMEOUT)
        assert invalid_resp.status_code == 400, f"Expected 400 Bad Request for invalid data, got {invalid_resp.status_code}"

        # Step 4: Attempt to create partner without authorization header
        no_auth_resp = requests.post(PARTNERS_URL, json=valid_partner_data, timeout=TIMEOUT)
        assert no_auth_resp.status_code == 401, f"Expected 401 Unauthorized when no auth provided, got {no_auth_resp.status_code}"

    finally:
        # Cleanup: delete the created partner if possible to keep test environment clean
        if created_partner_id:
            try:
                delete_resp = requests.delete(f"{PARTNERS_URL}/{created_partner_id}", headers=headers, timeout=TIMEOUT)
                # Accepting both 200 and 204 as successful delete response codes
                assert delete_resp.status_code in (200, 204), f"Failed to delete partner with id {created_partner_id}"
            except Exception:
                pass


test_validate_partner_creation_with_data_validation()
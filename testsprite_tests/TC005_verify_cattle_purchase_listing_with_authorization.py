import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3001"
LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth/login"
CATTLE_PURCHASES_ENDPOINT = f"{BASE_URL}/api/v1/cattle-purchases"

USERNAME = "carlosedufaraujo@outlook.com"
PASSWORD = "368308450Ce*"

def test_verify_cattle_purchase_listing_with_authorization():
    timeout = 30
    # Step 1: Log in to obtain JWT token
    login_payload = {"email": USERNAME, "password": PASSWORD}
    headers = {"Content-Type": "application/json"}

    try:
        login_response = requests.post(
            LOGIN_ENDPOINT,
            json=login_payload,
            headers=headers,
            timeout=timeout
        )
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
    login_json = login_response.json()
    token = login_json.get("token")
    assert token and isinstance(token, str), "JWT token not found in login response"

    auth_headers = {
        "Authorization": f"Bearer {token}"
    }

    # Step 2: Authorized GET request to /api/v1/cattle-purchases
    try:
        auth_response = requests.get(
            CATTLE_PURCHASES_ENDPOINT,
            headers=auth_headers,
            timeout=timeout
        )
    except requests.RequestException as e:
        assert False, f"Authorized cattle purchases request failed: {e}"

    assert auth_response.status_code == 200, f"Authorized request failed with status {auth_response.status_code}"
    try:
        cattle_purchases = auth_response.json()
    except ValueError:
        assert False, "Authorized response is not valid JSON"

    assert isinstance(cattle_purchases, (list, dict)), "Authorized response is not a list or dict"

    # Step 3: Unauthorized GET request to /api/v1/cattle-purchases (no token)
    try:
        unauth_response = requests.get(
            CATTLE_PURCHASES_ENDPOINT,
            timeout=timeout
        )
    except requests.RequestException as e:
        assert False, f"Unauthorized cattle purchases request failed: {e}"

    assert unauth_response.status_code == 401, f"Unauthorized request should return 401 but returned {unauth_response.status_code}"

test_verify_cattle_purchase_listing_with_authorization()
import requests

BASE_URL = "http://localhost:3001"
LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth/login"
EXPENSES_ENDPOINT = f"{BASE_URL}/api/v1/expenses"
TIMEOUT = 30

LOGIN_PAYLOAD = {
    "email": "carlosedufaraujo@outlook.com",
    "password": "368308450Ce*"
}

def test_verify_expense_listing_with_authorization():
    # Step 1: Perform login to get JWT token
    try:
        login_response = requests.post(LOGIN_ENDPOINT, json=LOGIN_PAYLOAD, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"Login request failed with exception: {e}"

    assert login_response.status_code == 200, f"Expected status 200 for login, got {login_response.status_code}"
    try:
        login_data = login_response.json()
    except Exception:
        assert False, "Login response content is not valid JSON"

    assert "token" in login_data, "Login response JSON does not contain 'token'"
    token = login_data["token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Authorized request using Bearer token
    try:
        authorized_response = requests.get(EXPENSES_ENDPOINT, headers=headers, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"Authorized request failed with exception: {e}"

    assert authorized_response.status_code == 200, f"Expected status 200 for authorized request, got {authorized_response.status_code}"
    try:
        expenses_data = authorized_response.json()
    except Exception:
        assert False, "Response content is not valid JSON for authorized request"
    assert isinstance(expenses_data, dict), "Response JSON should be an object containing expense data"

    # Unauthorized request (no auth)
    try:
        unauthorized_response = requests.get(EXPENSES_ENDPOINT, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"Unauthorized request failed with exception: {e}"

    assert unauthorized_response.status_code == 401, f"Expected status 401 for unauthorized request, got {unauthorized_response.status_code}"


test_verify_expense_listing_with_authorization()

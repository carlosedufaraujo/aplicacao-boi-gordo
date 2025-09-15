import requests

BASE_URL = "http://localhost:3001"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
EXPENSES_URL = f"{BASE_URL}/api/v1/expenses"
REVENUES_URL = f"{BASE_URL}/api/v1/revenues"
CASH_FLOWS_URL = f"{BASE_URL}/api/v1/cash-flows"
TIMEOUT = 30

EMAIL = "carlosedufaraujo@outlook.com"
PASSWORD = "368308450Ce*"


def test_financial_data_apis():
    # Authenticate to get JWT token
    login_payload = {"email": EMAIL, "password": PASSWORD}
    try:
        login_response = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        login_data = login_response.json()
        assert "token" in login_data and isinstance(login_data["token"], str) and login_data["token"], "Token missing or invalid in login response"
        token = login_data["token"]
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Authentication failed: {e}")

    headers = {"Authorization": f"Bearer {token}"}

    # Define a helper to test GET with auth and validate response
    def get_and_validate(url, resource_name):
        try:
            resp = requests.get(url, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 200, f"{resource_name} GET failed with status {resp.status_code}"
            try:
                data = resp.json()
            except Exception:
                raise AssertionError(f"{resource_name} GET returned invalid JSON")
            assert isinstance(data, (list, dict)), f"{resource_name} response JSON expected to be list or dict"
            return data
        except requests.RequestException as e:
            raise AssertionError(f"{resource_name} GET request error: {e}")

    # Test /api/v1/expenses endpoint
    expenses_data = get_and_validate(EXPENSES_URL, "Expenses")

    # Test /api/v1/revenues endpoint
    revenues_data = get_and_validate(REVENUES_URL, "Revenues")

    # Test /api/v1/cash-flows endpoint
    cash_flows_data = get_and_validate(CASH_FLOWS_URL, "Cash Flows")

    # Test error response without auth header to validate 401 Unauthorized
    for url, name in [(EXPENSES_URL, "Expenses"), (REVENUES_URL, "Revenues"), (CASH_FLOWS_URL, "Cash Flows")]:
        try:
            resp = requests.get(url, timeout=TIMEOUT)
            assert resp.status_code == 401 or resp.status_code == 403, f"{name} GET without auth expected 401/403 but got {resp.status_code}"
        except requests.RequestException as e:
            raise AssertionError(f"{name} GET without auth request error: {e}")


test_financial_data_apis()
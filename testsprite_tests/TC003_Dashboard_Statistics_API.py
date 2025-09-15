import requests

BASE_URL = "http://localhost:3001"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
STATS_URL = f"{BASE_URL}/api/v1/stats"
TIMEOUT = 30

def test_dashboard_statistics_api():
    # Step 1: Authenticate to get JWT token
    credentials = {
        "email": "carlosedufaraujo@outlook.com",
        "password": "368308450Ce*"
    }
    try:
        res_login = requests.post(LOGIN_URL, json=credentials, timeout=TIMEOUT)
        assert res_login.status_code == 200, f"Login failed with status {res_login.status_code}"
        login_data = res_login.json()
        assert "token" in login_data and isinstance(login_data["token"], str) and login_data["token"], "JWT token missing or invalid"
        token = login_data["token"]
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Authentication step failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Step 2: Request dashboard stats with auth header
    try:
        res_stats = requests.get(STATS_URL, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"Request to /api/v1/stats failed: {e}")

    # Step 3: Validate response status
    assert res_stats.status_code == 200, f"Expected HTTP 200, got {res_stats.status_code}"

    # Step 4: Validate content type is JSON
    content_type = res_stats.headers.get("Content-Type", "")
    assert "application/json" in content_type.lower(), f"Unexpected Content-Type: {content_type}"

    # Step 5: Validate response JSON structure and types
    try:
        stats_data = res_stats.json()
    except ValueError:
        raise AssertionError("Response is not valid JSON")

    # Expected top-level keys (example typical dashboard metrics)
    expected_keys = {
        "totalCattle": int,
        "totalExpenses": (int, float),
        "totalRevenue": (int, float),
        "mortalityRate": (int, float),
        "averageWeight": (int, float),
        "financialSummary": dict
    }
    for key, typ in expected_keys.items():
        assert key in stats_data, f"Missing key in stats response: {key}"
        assert isinstance(stats_data[key], typ), f"Key '{key}' is not of type {typ}, got {type(stats_data[key])}"

    # Additional granular validations if dicts present
    if isinstance(stats_data.get("financialSummary"), dict):
        fin = stats_data["financialSummary"]
        for field in ["income", "expenses", "profit"]:
            assert field in fin, f"Missing field in financialSummary: {field}"
            assert isinstance(fin[field], (int, float)), f"financialSummary field {field} must be int or float"

test_dashboard_statistics_api()

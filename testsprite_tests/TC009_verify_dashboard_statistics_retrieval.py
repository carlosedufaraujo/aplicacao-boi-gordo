import requests

BASE_URL = "http://localhost:3001"
AUTH_CREDENTIALS = {
    "email": "carlosedufaraujo@outlook.com",
    "password": "368308450Ce*"
}
TIMEOUT = 30

def test_TC009_verify_dashboard_statistics_retrieval():
    # Step 1: Authenticate and obtain JWT token
    try:
        auth_response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"email": AUTH_CREDENTIALS["email"], "password": AUTH_CREDENTIALS["password"]},
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"
    assert auth_response.status_code == 200, f"Login failed with status code {auth_response.status_code}"
    auth_data = auth_response.json()
    assert "token" in auth_data and isinstance(auth_data["token"], str) and len(auth_data["token"]) > 0, "Token missing in login response"
    token = auth_data["token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Step 2: Request dashboard statistics
    try:
        stats_response = requests.get(f"{BASE_URL}/api/v1/stats", headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Dashboard stats request failed: {e}"
    assert stats_response.status_code == 200, f"Dashboard stats request failed with status code {stats_response.status_code}"

    stats = stats_response.json()

    # Validate presence and type of all expected fields
    expected_fields = {
        "totalCattle": (int, float),
        "activeLots": (int, float),
        "occupiedPens": (int, float),
        "totalRevenue": (int, float),
        "totalExpenses": (int, float),
        "netProfit": (int, float),
        "averageWeight": (int, float),
        "mortalityRate": (int, float),
        "dateRange": str,
        "cashFlow": dict,
        "performanceIndex": dict
    }

    for field, expected_type in expected_fields.items():
        assert field in stats, f"Missing field in stats response: {field}"
        value = stats[field]
        # If expected_type is a tuple, check if value is instance of any of them
        if isinstance(expected_type, tuple):
            assert isinstance(value, expected_type), f"Field '{field}' expected to be one of types {expected_type} but got {type(value)}"
        else:
            assert isinstance(value, expected_type), f"Field '{field}' expected type {expected_type} but got {type(value)}"

    # Additional sanity checks (values should be non-negative where applicable)
    numeric_fields = [
        "totalCattle",
        "activeLots",
        "occupiedPens",
        "totalRevenue",
        "totalExpenses",
        "netProfit",
        "averageWeight",
        "mortalityRate"
    ]
    for nf in numeric_fields:
        val = stats[nf]
        assert val >= 0, f"Field '{nf}' should be non-negative, got {val}"

test_TC009_verify_dashboard_statistics_retrieval()
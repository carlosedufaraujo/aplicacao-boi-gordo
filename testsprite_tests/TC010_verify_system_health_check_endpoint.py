import requests

def test_health_check_endpoint():
    base_url = "http://localhost:3001"
    url = f"{base_url}/health"
    auth_username = "carlosedufaraujo@outlook.com"
    auth_password = "368308450Ce*"
    headers = {
        "Authorization": f"Basic {requests.auth._basic_auth_str(auth_username, auth_password).split(' ')[1]}"
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        # The health endpoint may not require authentication; if 401 is received, test fails.
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        data = response.json()
        assert isinstance(data, dict), "Response is not a JSON object"
        expected_keys = {"status", "timestamp", "service", "version", "uptime", "database", "server"}
        missing_keys = expected_keys - data.keys()
        assert not missing_keys, f"Missing keys in response: {missing_keys}"
        assert isinstance(data["status"], str) and data["status"], "Invalid or missing 'status'"
        assert isinstance(data["timestamp"], str) and data["timestamp"], "Invalid or missing 'timestamp'"
        assert isinstance(data["service"], str) and data["service"], "Invalid or missing 'service'"
        assert isinstance(data["version"], str) and data["version"], "Invalid or missing 'version'"
        assert isinstance(data["uptime"], (int, float)), "Invalid or missing 'uptime'"
        assert isinstance(data["database"], dict), "'database' field is not an object"
        assert isinstance(data["server"], dict), "'server' field is not an object"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_health_check_endpoint()
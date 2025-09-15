import requests

def test_authentication_api_invalid_credentials():
    base_url = "http://localhost:3001"
    login_url = f"{base_url}/api/v1/auth/login"
    headers = {"Content-Type": "application/json"}
    invalid_payload = {
        "email": "invaliduser@example.com",
        "password": "wrongPassword123!"
    }

    try:
        response = requests.post(login_url, json=invalid_payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"

    try:
        response_json = response.json()
    except ValueError:
        assert False, "Response is not in JSON format"

    # Check for typical error response structure
    assert "error" in response_json or "message" in response_json, "Error message not found in response"

test_authentication_api_invalid_credentials()
import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Helper function to get JWT token
# For testing, we assume a default user with email and password exists
# This could be replaced with appropriate test credentials

def get_auth_token():
    login_url = f"{BASE_URL}/api/v1/auth/login"
    login_payload = {
        "email": "testuser@example.com",
        "password": "TestPassword123"
    }
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Authentication failed: {e}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Authentication response body is not valid JSON"
    # The PRD does not specify the exact login response format, but common is a token field
    token = data.get('token') or data.get('accessToken')
    assert token, "Authentication token not found in login response"
    return token


def test_list_all_revenues():
    token = get_auth_token()
    url = f"{BASE_URL}/api/v1/revenues"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}"
    }

    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to list all revenues failed: {e}"

    # Validate response status code
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Validate response content type
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type, f"Expected JSON response, got Content-Type: {content_type}"

    try:
        revenues = response.json()
    except ValueError:
        assert False, "Response body is not valid JSON"

    # Validate that the response is a dict according to actual response shape
    assert isinstance(revenues, dict), f"Expected response to be a dict, got {type(revenues)}"


test_list_all_revenues()

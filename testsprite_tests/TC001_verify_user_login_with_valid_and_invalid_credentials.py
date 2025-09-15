import requests

BASE_URL = "http://localhost:3001"
LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth/login"
TIMEOUT = 30

def test_verify_user_login_with_valid_and_invalid_credentials():
    headers = {"Content-Type": "application/json"}

    # Valid credentials (these should be replaced with valid test credentials)
    valid_payload = {
        "email": "validuser@example.com",
        "password": "ValidPassword123!"
    }

    # Invalid credentials
    invalid_payload = {
        "email": "invaliduser@example.com",
        "password": "WrongPassword!"
    }

    # Test login with valid credentials
    try:
        response = requests.post(LOGIN_ENDPOINT, json=valid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed for valid credentials: {e}"
    assert response.status_code == 200, f"Expected 200 for valid login, got {response.status_code}"
    try:
        response_json = response.json()
    except ValueError:
        assert False, "Response to valid login is not valid JSON"

    # Test login with invalid credentials
    try:
        response_invalid = requests.post(LOGIN_ENDPOINT, json=invalid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed for invalid credentials: {e}"
    # According to PRD, invalid creds should return 401
    assert response_invalid.status_code == 401, f"Expected 401 for invalid login, got {response_invalid.status_code}"
    try:
        response_invalid_json = response_invalid.json()
    except ValueError:
        assert False, "Response to invalid login is not valid JSON"


test_verify_user_login_with_valid_and_invalid_credentials()
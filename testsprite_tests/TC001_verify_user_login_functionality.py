import requests

def test_verify_user_login_functionality():
    base_url = "http://localhost:3001"
    login_endpoint = f"{base_url}/api/v1/auth/login"
    timeout = 30

    valid_credentials = {
        "email": "carlosedufaraujo@outlook.com",
        "password": "368308450Ce*"
    }
    invalid_credentials = {
        "email": "carlosedufaraujo@outlook.com",
        "password": "WrongPassword123!"
    }

    headers = {
        "Content-Type": "application/json"
    }

    # Test valid login - expect 200 and a token
    try:
        response = requests.post(login_endpoint, json=valid_credentials, headers=headers, timeout=timeout)
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}"
        json_response = response.json()
        assert "token" in json_response and isinstance(json_response["token"], str) and len(json_response["token"]) > 0, "JWT token missing or invalid"
        assert "status" in json_response and json_response["status"].lower() == "success", "Status not success"
        assert "user" in json_response and isinstance(json_response["user"], dict), "User info missing or invalid"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Test invalid login - expect 401 Unauthorized
    try:
        response = requests.post(login_endpoint, json=invalid_credentials, headers=headers, timeout=timeout)
        assert response.status_code == 401, f"Expected 401 but got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_verify_user_login_functionality()
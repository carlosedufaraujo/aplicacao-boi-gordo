import requests

def test_login_with_valid_credentials():
    base_url = "http://localhost:3001"
    login_url = f"{base_url}/api/v1/auth/login"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "email": "carlosedufaraujo@outlook.com",
        "password": "368308450Ce*"
    }
    try:
        response = requests.post(login_url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        data = response.json()
        # Validate JWT token presence
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0, "JWT token missing or invalid"
        # Validate user data presence
        assert "user" in data and isinstance(data["user"], dict), "User data missing or invalid"
        user = data["user"]
        # Basic checks on user object
        assert "email" in user and user["email"] == payload["email"], "Returned user email mismatch"
        assert "id" in user and isinstance(user["id"], (int, str)) and len(str(user["id"])) > 0, "User id missing or invalid"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_login_with_valid_credentials()
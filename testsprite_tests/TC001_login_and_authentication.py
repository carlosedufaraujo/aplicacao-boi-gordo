import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_login_and_authentication():
    login_url = f"{BASE_URL}/auth/login"
    # Example valid user credentials - adjust as needed if real ones are required
    credentials = {
        "email": "testuser@example.com",
        "password": "P@ssw0rd!"
    }
    headers = {
        "Content-Type": "application/json"
    }

    # Step 1: Attempt login with valid credentials
    try:
        resp = requests.post(login_url, json=credentials, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"
    assert resp.status_code == 200, f"Expected 200 OK, got {resp.status_code}"
    json_data = resp.json()
    assert "accessToken" in json_data, "accessToken not found in login response"
    assert "refreshToken" in json_data, "refreshToken not found in login response"
    access_token = json_data["accessToken"]

    # Step 2: Use JWT token to access a protected resource (e.g. user profile or permission check)
    profile_url = f"{BASE_URL}/auth/profile"
    auth_headers = {
        "Authorization": f"Bearer {access_token}"
    }
    try:
        profile_resp = requests.get(profile_url, headers=auth_headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Profile request failed: {e}"
    assert profile_resp.status_code == 200, f"Expected 200 OK on profile, got {profile_resp.status_code}"
    profile_json = profile_resp.json()
    assert "email" in profile_json and profile_json["email"] == credentials["email"], "Profile email mismatch or missing"
    assert "permissions" in profile_json, "Permissions info missing in user profile"
    assert isinstance(profile_json["permissions"], list), "Permissions should be a list"

    # Step 3: Attempt login with invalid credentials
    invalid_credentials = {
        "email": "testuser@example.com",
        "password": "WrongPassword123"
    }
    try:
        invalid_resp = requests.post(login_url, json=invalid_credentials, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Invalid login request failed: {e}"
    assert invalid_resp.status_code in [400, 401], f"Expected 400 or 401 on invalid login, got {invalid_resp.status_code}"

    # Step 4: Attempt access to protected resource with no token
    try:
        no_token_resp = requests.get(profile_url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"No token profile request failed: {e}"
    assert no_token_resp.status_code == 401, f"Expected 401 Unauthorized when no token provided, got {no_token_resp.status_code}"

    # Step 5: Attempt access to protected resource with invalid token
    invalid_token_headers = {
        "Authorization": "Bearer invalidtoken123456"
    }
    try:
        invalid_token_resp = requests.get(profile_url, headers=invalid_token_headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Invalid token profile request failed: {e}"
    assert invalid_token_resp.status_code == 401, f"Expected 401 Unauthorized with invalid token, got {invalid_token_resp.status_code}"

test_login_and_authentication()
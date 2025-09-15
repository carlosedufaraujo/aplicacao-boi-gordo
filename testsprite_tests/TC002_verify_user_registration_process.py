import requests
import uuid

BASE_URL = "http://localhost:3001"
REGISTER_ENDPOINT = "/api/v1/auth/register"
TIMEOUT = 30

# Basic token credentials for authType basic token (username, password)
AUTH_USERNAME = "carlosedufaraujo@outlook.com"
AUTH_PASSWORD = "368308450Ce*"

def get_basic_auth_header(username: str, password: str) -> dict:
    import base64
    token = base64.b64encode(f"{username}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}"}

def test_verify_user_registration_process():
    headers = {
        "Content-Type": "application/json",
        **get_basic_auth_header(AUTH_USERNAME, AUTH_PASSWORD),
    }

    # Generate unique email to avoid conflict at first register
    unique_email = f"testuser_{uuid.uuid4().hex}@example.com"
    payload = {
        "email": unique_email,
        "password": "ValidPass123",
        "name": "Test User"
    }

    # Register new user - expect 201 Created
    try:
        response = requests.post(
            BASE_URL + REGISTER_ENDPOINT,
            json=payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request exception during user registration: {e}"

    # Attempt registering the same email again - expect 409 Conflict
    try:
        response_duplicate = requests.post(
            BASE_URL + REGISTER_ENDPOINT,
            json=payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert response_duplicate.status_code == 409, f"Expected 409 on duplicate registration, got {response_duplicate.status_code}"
    except requests.RequestException as e:
        assert False, f"Request exception during duplicate user registration: {e}"

test_verify_user_registration_process()
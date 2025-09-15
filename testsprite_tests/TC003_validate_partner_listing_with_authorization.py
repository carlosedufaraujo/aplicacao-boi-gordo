import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3001"
LOGIN_ENDPOINT = f"{BASE_URL}/api/v1/auth/login"
PARTNERS_ENDPOINT = f"{BASE_URL}/api/v1/partners"
TIMEOUT = 30

USERNAME = "carlosedufaraujo@outlook.com"
PASSWORD = "368308450Ce*"


def test_validate_partner_listing_with_authorization():
    # Step 1: Authenticate to get JWT token
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        login_response = requests.post(
            LOGIN_ENDPOINT, json=login_payload, timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        login_data = login_response.json()
        token = login_data.get("token")
        assert token, "Token not found in login response"
    except Exception as e:
        assert False, f"Login request error: {str(e)}"

    headers_auth = {
        "Authorization": f"Bearer {token}"
    }

    # Step 2: Authorized GET request without filters (list all partners)
    try:
        response = requests.get(PARTNERS_ENDPOINT, headers=headers_auth, timeout=TIMEOUT)
        assert response.status_code == 200, f"Authorized request failed: {response.text}"
        partners_list = response.json()
        assert isinstance(partners_list, (list, dict)), "Partners response is not a list or dict"
    except Exception as e:
        assert False, f"Authorized GET request error: {str(e)}"

    # Step 3: Authorized GET request with pagination parameters
    params_pagination = {
        "page": 1,
        "limit": 5
    }
    try:
        response_page = requests.get(
            PARTNERS_ENDPOINT, headers=headers_auth, params=params_pagination, timeout=TIMEOUT
        )
        assert response_page.status_code == 200, f"Pagination request failed: {response_page.text}"
        data_page = response_page.json()
        assert isinstance(data_page, (list, dict)), "Pagination response is not a list or dict"
    except Exception as e:
        assert False, f"Pagination GET request error: {str(e)}"

    # Step 4: Authorized GET request with partner type filter
    filter_type = "VENDOR"
    params_filter = {
        "type": filter_type
    }
    try:
        response_filter = requests.get(
            PARTNERS_ENDPOINT, headers=headers_auth, params=params_filter, timeout=TIMEOUT
        )
        assert response_filter.status_code == 200, f"Filter request failed: {response_filter.text}"
        data_filter = response_filter.json()
        assert isinstance(data_filter, (list, dict)), "Filtered response is not a list or dict"
        # Additional check: If list of partners, verify partner types if present
        if isinstance(data_filter, list):
            for partner in data_filter:
                partner_type = partner.get("type")
                assert partner_type == filter_type, f"Partner type mismatch: expected {filter_type}, got {partner_type}"
    except Exception as e:
        assert False, f"Filter GET request error: {str(e)}"

    # Step 5: Unauthorized request must return 401
    try:
        response_unauth = requests.get(PARTNERS_ENDPOINT, timeout=TIMEOUT)
        assert response_unauth.status_code == 401, f"Unauthorized access did not return 401, returned {response_unauth.status_code}"
    except Exception as e:
        assert False, f"Unauthorized GET request error: {str(e)}"


test_validate_partner_listing_with_authorization()
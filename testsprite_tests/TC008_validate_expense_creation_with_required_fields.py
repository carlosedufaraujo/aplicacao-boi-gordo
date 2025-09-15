import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3001"
LOGIN_ENDPOINT = "/api/v1/auth/login"
EXPENSES_ENDPOINT = "/api/v1/expenses"

USERNAME = "carlosedufaraujo@outlook.com"
PASSWORD = "368308450Ce*"

def test_validate_expense_creation_with_required_fields():
    timeout = 30

    # Step 1: Authenticate user to get JWT token
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    login_resp = requests.post(
        BASE_URL + LOGIN_ENDPOINT,
        json=login_payload,
        timeout=timeout
    )
    assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"

    login_data = login_resp.json()
    token = login_data.get("token")
    assert token, "No token received after login"

    headers_auth = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Step 2: Prepare valid expense data with required fields
    due_date_iso = (datetime.utcnow() + timedelta(days=10)).isoformat() + "Z"
    expense_payload = {
        "category": "Miscellaneous",
        "description": "Vaccination for herd",
        "totalAmount": 350.75,
        "dueDate": due_date_iso
    }

    # Test 201 Created on authorized request
    resp = requests.post(
        BASE_URL + EXPENSES_ENDPOINT,
        json=expense_payload,
        headers=headers_auth,
        timeout=timeout
    )
    assert resp.status_code == 201, f"Expected 201 Created, got {resp.status_code}"

    # Test 401 Unauthorized on no token
    resp_unauth = requests.post(
        BASE_URL + EXPENSES_ENDPOINT,
        json=expense_payload,
        timeout=timeout
    )
    assert resp_unauth.status_code == 401, f"Expected 401 Unauthorized, got {resp_unauth.status_code}"

test_validate_expense_creation_with_required_fields()

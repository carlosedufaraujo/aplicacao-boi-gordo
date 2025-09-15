import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_dashboard_navigation():
    # Test user credentials for authentication (should be valid in the test environment)
    auth_payload = {
        "email": "testuser@bovicontrol.com",
        "password": "TestPassword123!"
    }
    headers = {
        "Content-Type": "application/json"
    }

    # Step 1: Authenticate and obtain JWT token
    auth_response = requests.post(f"{BASE_URL}/auth/login", json=auth_payload, headers=headers, timeout=TIMEOUT)
    assert auth_response.status_code == 200, f"Login failed: {auth_response.text}"
    data = auth_response.json()
    assert "token" in data, "JWT token not present in login response"
    token = data["token"]
    auth_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Step 2: Test main dashboard endpoints for navigation and access
    # The main features per instruction: autenticação (done), CRUD de lotes, gestão financeira, compras, vendas, parceiros, currais.

    # 2a. Test lots listing (GET /lotes)
    lots_response = requests.get(f"{BASE_URL}/lotes", headers=auth_headers, timeout=TIMEOUT)
    assert lots_response.status_code == 200, f"Failed to fetch lots: {lots_response.text}"
    lots_data = lots_response.json()
    assert isinstance(lots_data, list), "Lots response is not a list"

    # 2b. Test financial center overview (GET /financeiro/summary)
    finance_response = requests.get(f"{BASE_URL}/financeiro/summary", headers=auth_headers, timeout=TIMEOUT)
    assert finance_response.status_code == 200, f"Failed to fetch financial summary: {finance_response.text}"
    finance_data = finance_response.json()
    assert isinstance(finance_data, dict), "Finance response is not a dict"

    # 2c. Test purchase orders listing (GET /compras)
    purchase_response = requests.get(f"{BASE_URL}/compras", headers=auth_headers, timeout=TIMEOUT)
    assert purchase_response.status_code == 200, f"Failed to fetch purchase orders: {purchase_response.text}"
    purchase_data = purchase_response.json()
    assert isinstance(purchase_data, list), "Purchases response is not a list"

    # 2d. Test sales pipeline listing (GET /vendas)
    sales_response = requests.get(f"{BASE_URL}/vendas", headers=auth_headers, timeout=TIMEOUT)
    assert sales_response.status_code == 200, f"Failed to fetch sales pipeline: {sales_response.text}"
    sales_data = sales_response.json()
    assert isinstance(sales_data, list), "Sales response is not a list"

    # 2e. Test partners listing (GET /parceiros)
    partners_response = requests.get(f"{BASE_URL}/parceiros", headers=auth_headers, timeout=TIMEOUT)
    assert partners_response.status_code == 200, f"Failed to fetch partners: {partners_response.text}"
    partners_data = partners_response.json()
    assert isinstance(partners_data, list), "Partners response is not a list"

    # 2f. Test corrals listing (GET /currais)
    corrals_response = requests.get(f"{BASE_URL}/currais", headers=auth_headers, timeout=TIMEOUT)
    assert corrals_response.status_code == 200, f"Failed to fetch corrals: {corrals_response.text}"
    corrals_data = corrals_response.json()
    assert isinstance(corrals_data, list), "Corrals response is not a list"

    # Step 3: Negative tests - try access without token to one protected route
    no_auth_response = requests.get(f"{BASE_URL}/lotes", timeout=TIMEOUT)
    assert no_auth_response.status_code == 401, f"Unauthorized access should return 401, got {no_auth_response.status_code}"

    # Step 4: Validate common error response formats on a bad request - try invalid method on /lotes (POST without payload)
    bad_method_response = requests.post(f"{BASE_URL}/lotes", headers=auth_headers, timeout=TIMEOUT)
    assert bad_method_response.status_code in (400,422), f"Expected 400 or 422 for bad request, got {bad_method_response.status_code}"

test_dashboard_navigation()
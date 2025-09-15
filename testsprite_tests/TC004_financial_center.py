import requests
import pytest

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Credentials for authentication (should be replaced with valid test user)
AUTH_PAYLOAD = {
    "email": "testuser@example.com",
    "password": "TestPassword123!"
}

def authenticate():
    try:
        r = requests.post(f"{BASE_URL}/auth/login", json=AUTH_PAYLOAD, timeout=TIMEOUT)
        assert r.status_code == 200, f"Auth failed with status: {r.status_code}, response: {r.text}"
        token = r.json().get("token")
        assert token, "JWT token not found in response"
        return token
    except requests.RequestException as e:
        pytest.fail(f"Authentication request failed: {str(e)}")

def test_financial_center():
    token = authenticate()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Test revenue (receitas) creation
    revenue_payload = {
        "description": "Venda de gado",
        "amount": 5000.0,
        "category": "vendas",
        "date": "2024-06-01"
    }
    revenue_id = None
    try:
        r = requests.post(f"{BASE_URL}/financial/revenue", json=revenue_payload, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 201, f"Create revenue failed: {r.text}"
        revenue_id = r.json().get("id")
        assert revenue_id is not None, "Revenue ID not returned"

        # Test expense (despesas) creation
        expense_payload = {
            "description": "Compra de ração",
            "amount": 1200.0,
            "category": "insumos",
            "date": "2024-06-02"
        }
        expense_id = None
        try:
            r = requests.post(f"{BASE_URL}/financial/expense", json=expense_payload, headers=headers, timeout=TIMEOUT)
            assert r.status_code == 201, f"Create expense failed: {r.text}"
            expense_id = r.json().get("id")
            assert expense_id is not None, "Expense ID not returned"

            # Test real-time cash flow endpoint
            r = requests.get(f"{BASE_URL}/financial/cashflow?date=2024-06-02", headers=headers, timeout=TIMEOUT)
            assert r.status_code == 200, f"Cash flow fetch failed: {r.text}"
            cashflow_data = r.json()
            assert "balance" in cashflow_data, "Cash flow response missing balance"

            # Test automatic bank reconciliation endpoint
            r = requests.post(f"{BASE_URL}/financial/reconciliation/auto", headers=headers, timeout=TIMEOUT)
            assert r.status_code == 200, f"Bank reconciliation failed: {r.text}"
            reconciliation_result = r.json()
            assert reconciliation_result.get("status") == "success", "Reconciliation status not success"

            # Test income statement (DRE) generation
            r = requests.get(f"{BASE_URL}/financial/dre?year=2024&month=6", headers=headers, timeout=TIMEOUT)
            assert r.status_code == 200, f"DRE generation failed: {r.text}"
            dre_data = r.json()
            assert "totalRevenue" in dre_data and "totalExpenses" in dre_data, "DRE missing totals"

            # Test cost analysis by category
            r = requests.get(f"{BASE_URL}/financial/cost-analysis?month=6&year=2024", headers=headers, timeout=TIMEOUT)
            assert r.status_code == 200, f"Cost analysis fetch failed: {r.text}"
            cost_data = r.json()
            assert isinstance(cost_data, dict), "Cost analysis response not a dict"

            # Test financial projections
            r = requests.get(f"{BASE_URL}/financial/projections?months=6", headers=headers, timeout=TIMEOUT)
            assert r.status_code == 200, f"Financial projections failed: {r.text}"
            projections = r.json()
            assert "projectedRevenue" in projections and "projectedExpenses" in projections, "Projections missing data"

            # Negative tests: invalid data for revenue creation
            invalid_revenue = {
                "description": "",
                "amount": -100,
                "category": "invalid_category",
                "date": "not-a-date"
            }
            r = requests.post(f"{BASE_URL}/financial/revenue", json=invalid_revenue, headers=headers, timeout=TIMEOUT)
            assert r.status_code == 400, "Invalid revenue payload should return 400"

            # Negative tests: unauthorized access (missing token)
            r = requests.get(f"{BASE_URL}/financial/dre?year=2024&month=6", timeout=TIMEOUT)
            assert r.status_code == 401, "Unauthorized request should return 401"

        finally:
            # Cleanup expense if created
            if expense_id is not None:
                requests.delete(f"{BASE_URL}/financial/expense/{expense_id}", headers=headers, timeout=TIMEOUT)
    finally:
        # Cleanup revenue if created
        if revenue_id is not None:
            requests.delete(f"{BASE_URL}/financial/revenue/{revenue_id}", headers=headers, timeout=TIMEOUT)

test_financial_center()
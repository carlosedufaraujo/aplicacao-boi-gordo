import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_list_cash_flow_data():
    url = f"{BASE_URL}/api/v1/cash-flows"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to list cash flow data failed: {e}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate required keys exist
    required_keys = ["inflow", "outflow", "balance", "trend"]
    for key in required_keys:
        assert key in data, f"Key '{key}' missing from cash flow data"

    # Validate the types and plausibility of values
    assert isinstance(data["inflow"], (int, float)), "Inflow should be a number"
    assert isinstance(data["outflow"], (int, float)), "Outflow should be a number"
    assert isinstance(data["balance"], (int, float)), "Balance should be a number"
    assert isinstance(data["trend"], (int, float)), "Trend should be a number"

    # Additional logical checks: balance should be inflow - outflow (within some tolerance)
    calculated_balance = data["inflow"] - data["outflow"]
    assert abs(calculated_balance - data["balance"]) < 0.01, (
        f"Balance value inconsistent with inflow and outflow: "
        f"{data['balance']} vs calculated {calculated_balance}"
    )

test_list_cash_flow_data()
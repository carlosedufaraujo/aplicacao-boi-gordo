import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_get_dashboard_statistics():
    url = f"{BASE_URL}/api/v1/stats"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    data = response.json()

    # Validate required keys exist and types are correct
    expected_keys = [
        "totalCattle",
        "activeLots",
        "occupiedPens",
        "totalRevenue",
        "totalExpenses",
        "netProfit",
        "averageWeight",
        "mortalityRate",
        "dateRange",
        "cashFlow",
        "performanceIndex"
    ]
    for key in expected_keys:
        assert key in data, f"Missing key in response: {key}"

    # Numeric fields validation
    numeric_fields = [
        "totalCattle",
        "activeLots",
        "occupiedPens",
        "totalRevenue",
        "totalExpenses",
        "netProfit",
        "averageWeight",
        "mortalityRate"
    ]
    for field in numeric_fields:
        val = data[field]
        assert isinstance(val, (int, float)), f"Field {field} should be numeric, got {type(val)}"

    # dateRange string check
    assert isinstance(data["dateRange"], str), "dateRange should be a string"

    # cashFlow subobject and its numeric properties
    cash_flow = data["cashFlow"]
    assert isinstance(cash_flow, dict), "cashFlow should be an object"
    cash_flow_keys = ["inflow", "outflow", "balance", "trend"]
    for key in cash_flow_keys:
        assert key in cash_flow, f"Missing key in cashFlow: {key}"
        assert isinstance(cash_flow[key], (int, float)), f"cashFlow.{key} should be numeric"

    # performanceIndex subobject and its numeric properties
    performance_index = data["performanceIndex"]
    assert isinstance(performance_index, dict), "performanceIndex should be an object"
    performance_keys = ["overall", "efficiency", "profitability", "growth", "sustainability"]
    for key in performance_keys:
        assert key in performance_index, f"Missing key in performanceIndex: {key}"
        assert isinstance(performance_index[key], (int, float)), f"performanceIndex.{key} should be numeric"

test_get_dashboard_statistics()
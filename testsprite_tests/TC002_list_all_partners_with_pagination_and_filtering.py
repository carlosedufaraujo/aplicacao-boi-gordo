import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30
HEADERS = {
    "Accept": "application/json",
    "Authorization": "Bearer test-token"
}

def test_list_all_partners_with_pagination_and_filtering():
    # Test listing partners without query parameters (default pagination)
    try:
        response = requests.get(f"{BASE_URL}/api/v1/partners", headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        data = response.json()
        assert isinstance(data, dict) or isinstance(data, list), "Response is not a list or dict"
        # If pagination is implemented, data should be a dict with items or list directly.
        partners = data.get("items") if isinstance(data, dict) and "items" in data else data
        assert isinstance(partners, list), "Partners is not a list"
    except requests.RequestException as e:
        assert False, f"Request failed without query params: {e}"

    # Test listing partners with pagination parameters: page=1, limit=5
    params = {"page": 1, "limit": 5}
    try:
        response = requests.get(f"{BASE_URL}/api/v1/partners", headers=HEADERS, params=params, timeout=TIMEOUT)
        response.raise_for_status()
        data = response.json()
        partners = data.get("items") if isinstance(data, dict) and "items" in data else data
        assert isinstance(partners, list), "Partners is not a list with pagination"
        assert len(partners) <= 5, "Pagination limit exceeded"
    except requests.RequestException as e:
        assert False, f"Request failed with pagination params: {e}"

    # Test filtering partners by type with valid type 'VENDOR'
    params = {"type": "VENDOR", "page": 1, "limit": 10}
    try:
        response = requests.get(f"{BASE_URL}/api/v1/partners", headers=HEADERS, params=params, timeout=TIMEOUT)
        response.raise_for_status()
        data = response.json()
        partners = data.get("items") if isinstance(data, dict) and "items" in data else data
        assert isinstance(partners, list), "Partners is not a list with type filtering"
        for partner in partners:
            assert "type" in partner, "Partner missing 'type' field"
            assert partner["type"] == "VENDOR", f"Partner type mismatch: expected 'VENDOR', got {partner['type']}"
    except requests.RequestException as e:
        assert False, f"Request failed with filtering params: {e}"

    # Test filtering partners by invalid type to expect empty or controlled response
    params = {"type": "INVALID_TYPE"}
    try:
        response = requests.get(f"{BASE_URL}/api/v1/partners", headers=HEADERS, params=params, timeout=TIMEOUT)
        # Depending on implementation, it might return 400 or 200 with empty list
        if response.status_code == 400:
            # Expected validation failure for invalid enum
            return
        response.raise_for_status()
        data = response.json()
        partners = data.get("items") if isinstance(data, dict) and "items" in data else data
        assert isinstance(partners, list), "Partners is not a list with invalid type filtering"
        assert len(partners) == 0, "Expected no partners for invalid type filter"
    except requests.RequestException as e:
        # Accepting 400 error as a valid behavior; otherwise fail
        if hasattr(e.response, "status_code") and e.response.status_code == 400:
            pass
        else:
            assert False, f"Unexpected request failure with invalid type filter: {e}"


test_list_all_partners_with_pagination_and_filtering()

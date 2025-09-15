import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_create_new_expense_with_required_fields_validation():
    url = f"{BASE_URL}/api/v1/expenses"
    headers = {
        "Content-Type": "application/json"
    }
    # Prepare payload with all required fields
    payload = {
        "category": "Feed",
        "description": "Purchase of cattle feed",
        "totalAmount": 250.75,
        "dueDate": (datetime.utcnow() + timedelta(days=7)).isoformat() + "Z"
    }
    response = None
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        # Validate response status code is 201 Created
        assert response.status_code == 201, f"Expected status code 201 but got {response.status_code}"
        # Validate response content type is JSON
        assert response.headers.get("Content-Type", "").startswith("application/json"), "Response is not JSON"
        data = response.json()
        # Validate returned data contains the created expense with correct fields
        assert "category" in data and data["category"] == payload["category"], "Category mismatch in response"
        assert "description" in data and data["description"] == payload["description"], "Description mismatch in response"
        assert "totalAmount" in data and abs(data["totalAmount"] - payload["totalAmount"]) < 0.01, "TotalAmount mismatch in response"
        assert "dueDate" in data and data["dueDate"].startswith(payload["dueDate"][:10]), "DueDate mismatch in response"
        # Optionally assert presence of an ID for the created resource
        assert "id" in data and isinstance(data["id"], (int, str)), "Missing or invalid id in response"
    finally:
        # Cleanup: delete the created expense if it was created
        if response is not None and response.status_code == 201:
            try:
                expense_id = response.json().get("id")
                if expense_id:
                    del_response = requests.delete(f"{url}/{expense_id}", headers=headers, timeout=TIMEOUT)
                    assert del_response.status_code in (200, 204), f"Failed to clean up expense with id {expense_id}"
            except Exception:
                pass

test_create_new_expense_with_required_fields_validation()
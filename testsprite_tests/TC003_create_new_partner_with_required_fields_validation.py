import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3001"
TIMEOUT = 30
PARTNERS_ENDPOINT = f"{BASE_URL}/api/v1/partners"
HEADERS_JSON = {"Content-Type": "application/json"}

def test_create_partner_required_fields_validation():
    created_partner_id = None
    
    # Valid payload with required fields
    valid_payload = {
        "name": "Test Partner",
        "type": "VENDOR"
    }
    
    # Payload missing 'name'
    missing_name_payload = {
        "type": "VENDOR"
    }
    
    # Payload missing 'type'
    missing_type_payload = {
        "name": "Test Partner"
    }
    
    # Payload missing both 'name' and 'type'
    missing_both_payload = {}
    
    try:
        # Test creating partner with valid payload
        response = requests.post(PARTNERS_ENDPOINT, json=valid_payload, headers=HEADERS_JSON, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected status 201 but got {response.status_code}, response: {response.text}"
        json_resp = response.json()
        # Validate returned data contains at least 'id', 'name', and 'type' with correct values
        assert "id" in json_resp, "Response missing 'id'"
        assert json_resp.get("name") == valid_payload["name"], f"Expected name {valid_payload['name']}, got {json_resp.get('name')}"
        assert json_resp.get("type") == valid_payload["type"], f"Expected type {valid_payload['type']}, got {json_resp.get('type')}"
        created_partner_id = json_resp["id"]
        
        # Test creating partner missing 'name' field
        response = requests.post(PARTNERS_ENDPOINT, json=missing_name_payload, headers=HEADERS_JSON, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected status 400 for missing 'name', got {response.status_code}"
        error_response = response.json()
        assert ("name" in str(error_response).lower() or "name" in response.text.lower()), "Error message should indicate missing 'name'"
        
        # Test creating partner missing 'type' field
        response = requests.post(PARTNERS_ENDPOINT, json=missing_type_payload, headers=HEADERS_JSON, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected status 400 for missing 'type', got {response.status_code}"
        error_response = response.json()
        assert ("type" in str(error_response).lower() or "type" in response.text.lower()), "Error message should indicate missing 'type'"
        
        # Test creating partner missing both 'name' and 'type'
        response = requests.post(PARTNERS_ENDPOINT, json=missing_both_payload, headers=HEADERS_JSON, timeout=TIMEOUT)
        assert response.status_code == 400, f"Expected status 400 for missing both 'name' and 'type', got {response.status_code}"
        error_response = response.json()
        assert (("name" in str(error_response).lower() or "name" in response.text.lower()) and
                ("type" in str(error_response).lower() or "type" in response.text.lower())), "Error message should indicate missing 'name' and 'type'"
        
    except RequestException as e:
        assert False, f"Request failed: {e}"
    finally:
        # Cleanup: delete the created partner if any
        if created_partner_id:
            try:
                del_response = requests.delete(f"{PARTNERS_ENDPOINT}/{created_partner_id}", headers=HEADERS_JSON, timeout=TIMEOUT)
                # Accept 200 OK or 204 No Content for successful deletion
                assert del_response.status_code in (200, 204), f"Failed to clean up partner, status code {del_response.status_code}"
            except RequestException:
                pass

test_create_partner_required_fields_validation()
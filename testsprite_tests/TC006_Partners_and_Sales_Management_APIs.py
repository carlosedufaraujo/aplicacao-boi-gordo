import requests

BASE_URL = "http://localhost:3001/api/v1"
LOGIN_URL = f"{BASE_URL}/auth/login"
PARTNERS_URL = f"{BASE_URL}/partners"
SALE_RECORDS_URL = f"{BASE_URL}/sale-records"

EMAIL = "carlosedufaraujo@outlook.com"
PASSWORD = "368308450Ce*"
TIMEOUT = 30


def test_partners_and_sales_management_apis():
    token = None
    partner_id = None
    sale_record_id = None

    # Step 1: Authenticate and get JWT token
    try:
        login_payload = {"email": EMAIL, "password": PASSWORD}
        login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert "token" in login_data and isinstance(login_data["token"], str) and login_data["token"], "Token missing or empty in login response"
        token = login_data["token"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # Step 2: Create a partner (POST /partners)
        partner_payload = {
            "name": "Test Partner",
            "email": "testpartner@example.com",
            "phone": "5511999999999",
            "address": "Rua Teste, 123, São Paulo",
            "notes": "Partner created for automated testing",
            "type": "fornecedor"
        }
        resp_create_partner = requests.post(PARTNERS_URL, json=partner_payload, headers=headers, timeout=TIMEOUT)
        assert resp_create_partner.status_code == 201, f"Failed to create partner: {resp_create_partner.text}"
        partner = resp_create_partner.json()
        assert "id" in partner, "Partner creation response missing 'id'"
        partner_id = partner["id"]

        # Step 3: Get partner by ID (GET /partners/{id})
        resp_get_partner = requests.get(f"{PARTNERS_URL}/{partner_id}", headers=headers, timeout=TIMEOUT)
        assert resp_get_partner.status_code == 200, f"Failed to fetch partner by ID: {resp_get_partner.text}"
        fetched_partner = resp_get_partner.json()
        assert fetched_partner.get("id") == partner_id, "Fetched partner ID mismatch"
        assert fetched_partner.get("name") == partner_payload["name"], "Fetched partner name mismatch"

        # Step 4: Update partner (PUT /partners/{id})
        update_partner_payload = {"notes": "Updated notes for automated testing"}
        resp_update_partner = requests.put(f"{PARTNERS_URL}/{partner_id}", json=update_partner_payload, headers=headers, timeout=TIMEOUT)
        assert resp_update_partner.status_code == 200, f"Failed to update partner: {resp_update_partner.text}"
        updated_partner = resp_update_partner.json()
        assert updated_partner.get("notes") == update_partner_payload["notes"], "Partner notes not updated correctly"

        # Step 5: Create a sales record (POST /sale-records)
        sale_record_payload = {
            "partner_id": partner_id,
            "date": "2024-06-01",
            "description": "Venda de gado teste",
            "amount": 15000.00,
            "animal_count": 10,
            "notes": "Registro de venda criado para teste"
        }
        resp_create_sale = requests.post(SALE_RECORDS_URL, json=sale_record_payload, headers=headers, timeout=TIMEOUT)
        assert resp_create_sale.status_code == 201, f"Failed to create sale record: {resp_create_sale.text}"
        sale_record = resp_create_sale.json()
        assert "id" in sale_record, "Sale record creation response missing 'id'"
        sale_record_id = sale_record["id"]

        # Step 6: Get sale record by ID (GET /sale-records/{id})
        resp_get_sale = requests.get(f"{SALE_RECORDS_URL}/{sale_record_id}", headers=headers, timeout=TIMEOUT)
        assert resp_get_sale.status_code == 200, f"Failed to fetch sale record by ID: {resp_get_sale.text}"
        fetched_sale = resp_get_sale.json()
        assert fetched_sale.get("id") == sale_record_id, "Fetched sale record ID mismatch"
        assert fetched_sale.get("partner_id") == partner_id, "Fetched sale record partner_id mismatch"
        assert float(fetched_sale.get("amount", 0)) == sale_record_payload["amount"], "Fetched sale record amount mismatch"

        # Step 7: Update sale record (PUT /sale-records/{id})
        update_sale_payload = {"notes": "Notas atualizadas para teste"}
        resp_update_sale = requests.put(f"{SALE_RECORDS_URL}/{sale_record_id}", json=update_sale_payload, headers=headers, timeout=TIMEOUT)
        assert resp_update_sale.status_code == 200, f"Failed to update sale record: {resp_update_sale.text}"
        updated_sale = resp_update_sale.json()
        assert updated_sale.get("notes") == update_sale_payload["notes"], "Sale record notes not updated correctly"

        # Step 8: Delete sale record (DELETE /sale-records/{id})
        resp_delete_sale = requests.delete(f"{SALE_RECORDS_URL}/{sale_record_id}", headers=headers, timeout=TIMEOUT)
        assert resp_delete_sale.status_code == 204, f"Failed to delete sale record: {resp_delete_sale.text}"
        sale_record_id = None  # mark as deleted

        # Step 9: Delete partner (DELETE /partners/{id})
        resp_delete_partner = requests.delete(f"{PARTNERS_URL}/{partner_id}", headers=headers, timeout=TIMEOUT)
        assert resp_delete_partner.status_code == 204, f"Failed to delete partner: {resp_delete_partner.text}"
        partner_id = None  # mark as deleted

    finally:
        # Cleanup if something failed before delete
        headers_cleanup = {"Authorization": f"Bearer {token}"} if token else None
        if sale_record_id and headers_cleanup:
            try:
                requests.delete(f"{SALE_RECORDS_URL}/{sale_record_id}", headers=headers_cleanup, timeout=TIMEOUT)
            except Exception:
                pass
        if partner_id and headers_cleanup:
            try:
                requests.delete(f"{PARTNERS_URL}/{partner_id}", headers=headers_cleanup, timeout=TIMEOUT)
            except Exception:
                pass


test_partners_and_sales_management_apis()

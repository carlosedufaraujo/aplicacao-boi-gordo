import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_purchase_pipeline():
    try:
        # 1. Authenticate and get JWT token
        auth_data = {
            "username": "testuser",
            "password": "testpassword"
        }
        auth_resp = requests.post(f"{BASE_URL}/auth/login", json=auth_data, timeout=TIMEOUT)
        assert auth_resp.status_code == 200, f"Auth failed: {auth_resp.text}"
        token = auth_resp.json().get("token")
        assert token, "No token received"
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create a supplier (Fornecedor)
        supplier_payload = {
            "name": "Fornecedor Teste",
            "document": "12345678000100",
            "contact": "fornecedor@test.com",
            "phone": "5511999999999",
            "address": "Rua Teste, 123"
        }
        supplier_resp = requests.post(f"{BASE_URL}/suppliers", json=supplier_payload, headers=headers, timeout=TIMEOUT)
        assert supplier_resp.status_code == 201, f"Supplier creation failed: {supplier_resp.text}"
        supplier_id = supplier_resp.json().get("id")
        assert supplier_id, "Supplier ID missing"

        # 3. Create a confinement (Confinamento) - integration with lot management
        confinement_payload = {
            "name": "Confinamento Teste",
            "capacity": 50,
            "location": "Fazenda Teste"
        }
        confinement_resp = requests.post(f"{BASE_URL}/confinements", json=confinement_payload, headers=headers, timeout=TIMEOUT)
        assert confinement_resp.status_code == 201, f"Confinement creation failed: {confinement_resp.text}"
        confinement_id = confinement_resp.json().get("id")
        assert confinement_id, "Confinement ID missing"

        # 4. Create a purchase order (Ordem de Compra) linking supplier and confinement
        purchase_order_payload = {
            "supplierId": supplier_id,
            "confinementId": confinement_id,
            "orderDate": "2024-06-01",
            "expectedDeliveryDate": "2024-06-15",
            "items": [
                {
                    "description": "Bovino Nelore",
                    "quantity": 20,
                    "unitPrice": 1500.0
                }
            ],
            "status": "pending"
        }
        purchase_order_resp = requests.post(f"{BASE_URL}/purchase-orders", json=purchase_order_payload, headers=headers, timeout=TIMEOUT)
        assert purchase_order_resp.status_code == 201, f"Purchase order creation failed: {purchase_order_resp.text}"
        purchase_order_id = purchase_order_resp.json().get("id")
        assert purchase_order_id, "Purchase order ID missing"

        # 5. Validate payment for the purchase order
        payment_payload = {
            "purchaseOrderId": purchase_order_id,
            "paymentDate": "2024-06-02",
            "amount": 30000.0,
            "method": "bank_transfer",
            "status": "validated"
        }
        payment_resp = requests.post(f"{BASE_URL}/payments", json=payment_payload, headers=headers, timeout=TIMEOUT)
        assert payment_resp.status_code == 201, f"Payment validation failed: {payment_resp.text}"
        payment_id = payment_resp.json().get("id")
        assert payment_id, "Payment ID missing"

        # 6. Register reception control (Recepção)
        reception_payload = {
            "purchaseOrderId": purchase_order_id,
            "receptionDate": "2024-06-15",
            "receivedQuantity": 20,
            "status": "completed"
        }
        reception_resp = requests.post(f"{BASE_URL}/receptions", json=reception_payload, headers=headers, timeout=TIMEOUT)
        assert reception_resp.status_code == 201, f"Reception registration failed: {reception_resp.text}"
        reception_id = reception_resp.json().get("id")
        assert reception_id, "Reception ID missing"

        # 7. Get acquisition cost analysis for the purchase order
        cost_analysis_resp = requests.get(f"{BASE_URL}/purchase-orders/{purchase_order_id}/cost-analysis", headers=headers, timeout=TIMEOUT)
        assert cost_analysis_resp.status_code == 200, f"Cost analysis fetch failed: {cost_analysis_resp.text}"
        cost_data = cost_analysis_resp.json()
        assert "totalCost" in cost_data and isinstance(cost_data["totalCost"], (int, float)), "Invalid cost analysis data"

        # 8. Test supplier management: update supplier info
        updated_supplier_payload = {
            "contact": "novo.fornecedor@test.com",
            "phone": "5511988888888"
        }
        supplier_update_resp = requests.put(f"{BASE_URL}/suppliers/{supplier_id}", json=updated_supplier_payload, headers=headers, timeout=TIMEOUT)
        assert supplier_update_resp.status_code == 200, f"Supplier update failed: {supplier_update_resp.text}"

        # 9. Test error response: try to create purchase order with invalid supplierId
        invalid_purchase_order_payload = {
            "supplierId": "invalid-id",
            "confinementId": confinement_id,
            "orderDate": "2024-06-01",
            "expectedDeliveryDate": "2024-06-15",
            "items": [
                {"description": "Bovino Nelore", "quantity": 5, "unitPrice": 1500.0}
            ],
            "status": "pending"
        }
        invalid_po_resp = requests.post(f"{BASE_URL}/purchase-orders", json=invalid_purchase_order_payload, headers=headers, timeout=TIMEOUT)
        assert invalid_po_resp.status_code in (400, 404), f"Invalid supplier id should cause error: {invalid_po_resp.text}"

    finally:
        # Cleanup created resources
        # Delete purchase order
        if 'purchase_order_id' in locals():
            requests.delete(f"{BASE_URL}/purchase-orders/{purchase_order_id}", headers=headers, timeout=TIMEOUT)
        # Delete reception
        if 'reception_id' in locals():
            requests.delete(f"{BASE_URL}/receptions/{reception_id}", headers=headers, timeout=TIMEOUT)
        # Delete payment
        if 'payment_id' in locals():
            requests.delete(f"{BASE_URL}/payments/{payment_id}", headers=headers, timeout=TIMEOUT)
        # Delete confinement
        if 'confinement_id' in locals():
            requests.delete(f"{BASE_URL}/confinements/{confinement_id}", headers=headers, timeout=TIMEOUT)
        # Delete supplier
        if 'supplier_id' in locals():
            requests.delete(f"{BASE_URL}/suppliers/{supplier_id}", headers=headers, timeout=TIMEOUT)

test_purchase_pipeline()
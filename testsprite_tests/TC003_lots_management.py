import requests
import traceback

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Credentials for authentication - should be updated with valid test user credentials
AUTH_DATA = {
    "email": "testuser@bovicontrol.com",
    "password": "TestPass123!"
}

def test_lots_management():
    session = requests.Session()
    token = None
    try:
        # 1. Authenticate and obtain JWT token
        auth_resp = session.post(f"{BASE_URL}/login", json=AUTH_DATA, timeout=TIMEOUT)
        assert auth_resp.status_code == 200, f"Authentication failed: {auth_resp.text}"
        auth_json = auth_resp.json()
        assert "token" in auth_json, "No JWT token in authentication response"
        token = auth_json["token"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # 2. Create a new lot (lote)
        lot_payload = {
            "name": "Lote Teste API",
            "description": "Lote para testes automatizados",
            "initialWeight": 350.5,
            "penId": None,
            "expectedAnimals": 30
        }
        create_resp = session.post(f"{BASE_URL}/lots", json=lot_payload, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Erro ao criar lote: {create_resp.text}"
        lot = create_resp.json()
        lot_id = lot.get("id")
        assert lot_id is not None, "ID do lote não retornado na criação"

        # 3. Edit the lot's description and expectedAnimals
        edit_payload = {
            "description": "Atualizado pelo teste automatizado",
            "expectedAnimals": 35
        }
        edit_resp = session.put(f"{BASE_URL}/lots/{lot_id}", json=edit_payload, headers=headers, timeout=TIMEOUT)
        assert edit_resp.status_code == 200, f"Erro ao editar lote: {edit_resp.text}"
        edited_lot = edit_resp.json()
        assert edited_lot.get("description") == edit_payload["description"], "Descrição não atualizada"
        assert edited_lot.get("expectedAnimals") == edit_payload["expectedAnimals"], "Quantidade esperada não atualizada"

        # 4. Track weight - add weight record for the lot
        weight_payload = {
            "weight": 360.0,
            "date": "2024-06-01"
        }
        weight_resp = session.post(f"{BASE_URL}/lots/{lot_id}/weights", json=weight_payload, headers=headers, timeout=TIMEOUT)
        assert weight_resp.status_code == 201, f"Erro ao registrar peso: {weight_resp.text}"
        weight_record = weight_resp.json()
        assert weight_record.get("weight") == weight_payload["weight"], "Peso registrado incorretamente"

        # 5. Allocate pen (curral) to the lot
        # First, create a pen to allocate (since pen management is part of the backend)
        pen_payload = {
            "name": "Curral Teste API",
            "capacity": 50,
            "location": "Setor 1"
        }
        pen_resp = session.post(f"{BASE_URL}/pens", json=pen_payload, headers=headers, timeout=TIMEOUT)
        assert pen_resp.status_code == 201, f"Erro ao criar curral: {pen_resp.text}"
        pen = pen_resp.json()
        pen_id = pen.get("id")
        assert pen_id is not None, "ID do curral não retornado"

        alloc_payload = {"penId": pen_id}
        alloc_resp = session.put(f"{BASE_URL}/lots/{lot_id}/allocate", json=alloc_payload, headers=headers, timeout=TIMEOUT)
        assert alloc_resp.status_code == 200, f"Erro ao alocar curral: {alloc_resp.text}"
        alloc_result = alloc_resp.json()
        assert alloc_result.get("penId") == pen_id, "Curral não alocado corretamente"

        # 6. Retrieve movement history for the lot
        move_resp = session.get(f"{BASE_URL}/lots/{lot_id}/movements", headers=headers, timeout=TIMEOUT)
        assert move_resp.status_code == 200, f"Erro ao obter histórico de movimentações: {move_resp.text}"
        movements = move_resp.json()
        assert isinstance(movements, list), "Movimentações retornadas não são uma lista"

        # 7. Mortality control - add a mortality record
        mortality_payload = {
            "date": "2024-06-02",
            "quantity": 1,
            "cause": "Doença respiratória"
        }
        mort_resp = session.post(f"{BASE_URL}/lots/{lot_id}/mortalities", json=mortality_payload, headers=headers, timeout=TIMEOUT)
        assert mort_resp.status_code == 201, f"Erro ao registrar mortalidade: {mort_resp.text}"
        mortality_record = mort_resp.json()
        assert mortality_record.get("quantity") == mortality_payload["quantity"], "Mortalidade não registrada corretamente"

        # 8. Performance analysis - fetch performance data for the lot
        perf_resp = session.get(f"{BASE_URL}/lots/{lot_id}/performance", headers=headers, timeout=TIMEOUT)
        assert perf_resp.status_code == 200, f"Erro ao obter análise de performance: {perf_resp.text}"
        performance = perf_resp.json()
        assert "averageWeightGain" in performance, "Dados de performance incompletos"

    except Exception:
        traceback.print_exc()
        assert False, "Test failed due to exception"
    finally:
        # Cleanup: delete created lot and pen if exist
        if token is not None:
            headers_auth = {"Authorization": f"Bearer {token}"}
            if 'lot_id' in locals():
                session.delete(f"{BASE_URL}/lots/{lot_id}", headers=headers_auth, timeout=TIMEOUT)
            if 'pen_id' in locals():
                session.delete(f"{BASE_URL}/pens/{pen_id}", headers=headers_auth, timeout=TIMEOUT)

test_lots_management()

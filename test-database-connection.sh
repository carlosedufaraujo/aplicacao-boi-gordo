#!/bin/bash

echo "🔍 Testando Conexão com Banco de Dados Existente"
echo "================================================="
echo ""

API_URL="https://aplicacao-boi-gordo.vercel.app/api/v1"

echo "1️⃣ Verificando Cattle Purchases (deve ter 22 registros):"
curl -s "$API_URL/cattle-purchases" | python3 -c "
import json, sys
data = json.load(sys.stdin)
items = data.get('items', [])
print(f'   Total: {len(items)} registros')
if items:
    print(f'   Primeiro: {items[0].get(\"vendor\", \"?\")}')
    print(f'   Data: {items[0].get(\"purchaseDate\", \"?\")[:10]}')
"

echo ""
echo "2️⃣ Verificando Expenses (deve ter 44 registros):"
curl -s "$API_URL/expenses" | python3 -c "
import json, sys
data = json.load(sys.stdin)
expenses = data.get('data', [])
print(f'   Total: {len(expenses)} registros')
if expenses:
    total = sum(e.get('totalAmount', 0) for e in expenses)
    print(f'   Valor total: R$ {total:,.2f}')
"

echo ""
echo "3️⃣ Verificando Partners (deve ter 23 registros):"
curl -s "$API_URL/partners" | python3 -c "
import json, sys
data = json.load(sys.stdin)
partners = data.get('data', [])
print(f'   Total: {len(partners)} registros')
if partners:
    print(f'   Primeiro: {partners[0].get(\"name\", \"?\")}')
"

echo ""
echo "4️⃣ Verificando Users (TODOS - sem filtro):"
curl -s "$API_URL/list-users" | python3 -c "
import json, sys
data = json.load(sys.stdin)
users = data.get('data', [])
print(f'   Total: {len(users)} usuários')
print(f'   Fonte: {data.get(\"source\", \"?\")}')
print(f'   Mensagem: {data.get(\"message\", \"?\")}')
if users:
    for user in users[:3]:
        print(f'   - {user.get(\"email\", \"?\")} (Ativo: {user.get(\"is_active\", \"?\")})')
"

echo ""
echo "📊 RESUMO:"
echo "Se os números acima batem com o esperado, o banco está conectado."
echo "Se Users = 0, pode ser que:"
echo "  1. A tabela users está vazia"
echo "  2. Os usuários estão com is_active = false"
echo "  3. Problema de permissão na tabela users"

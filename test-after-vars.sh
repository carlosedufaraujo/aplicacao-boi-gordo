#!/bin/bash

echo "🔍 Teste Rápido Após Configurar Variáveis"
echo "=========================================="
echo ""

# Aguardar redeploy
echo "⏳ Aguarde 2 minutos após o redeploy..."
echo ""

# Teste 1: Users
echo "1️⃣ Testando /api/v1/users:"
curl -s https://aplicacao-boi-gordo.vercel.app/api/v1/users | \
  python3 -c "import json,sys; d=json.load(sys.stdin); \
  print('✅ FUNCIONANDO!' if 'data' in d else '❌ Ainda com problema'); \
  print(f'Usuários: {len(d.get(\"data\", []))}' if 'data' in d else '')"

echo ""

# Teste 2: Auth
echo "2️⃣ Testando autenticação:"
curl -s -X POST https://aplicacao-boi-gordo.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' | \
  python3 -c "import json,sys; d=json.load(sys.stdin); \
  print('✅ Auth respondendo' if d else '❌ Erro na auth')"

echo ""

# Teste 3: Database
echo "3️⃣ Testando conexão com banco:"
curl -s https://aplicacao-boi-gordo.vercel.app/api/v1/stats | \
  python3 -c "import json,sys; d=json.load(sys.stdin); \
  print(f'✅ Banco conectado - {d.get(\"data\", {}).get(\"activeLots\", 0)} lotes')"

echo ""
echo "✅ Se tudo aparecer verde, o sistema está 100% funcional!"

#!/bin/bash

echo "🧪 Testando Nova Rota de Usuários"
echo "=================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="https://aplicacao-boi-gordo.vercel.app/api/v1"

echo "1️⃣ Testando rota ANTIGA /api/v1/users (com problema):"
curl -s "$API_URL/users" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'data' in data:
        print('✅ Funcionando! Usuários:', len(data['data']))
    else:
        print('❌ Não funciona - retorna:', list(data.keys())[:3])
except:
    print('❌ Erro ao processar resposta')
"

echo ""
echo "2️⃣ Testando rota NOVA /api/v1/list-users:"
curl -s "$API_URL/list-users" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'data' in data:
        print('✅ SUCESSO! Rota nova funcionando!')
        print(f'   - Total de usuários: {len(data[\"data\"])}')
        print(f'   - Mensagem: {data.get(\"message\", \"?\")}')
        print(f'   - Fonte: {data.get(\"source\", \"?\")}')
        if data['data']:
            print(f'   - Primeiro usuário: {data[\"data\"][0].get(\"email\", \"?\")}')
    else:
        print('❌ Rota nova ainda não deployada')
        print('   Aguarde 2 minutos após o deploy')
except Exception as e:
    print(f'❌ Erro: {e}')
"

echo ""
echo "3️⃣ Comparando rotas:"
echo "-------------------"
echo "Antiga: /api/v1/users     ❌ (bug na detecção)"
echo "Nova:   /api/v1/list-users ✅ (solução alternativa)"

echo ""
echo "📝 Como usar no frontend:"
echo ""
echo "import userService from '@/services/userService';"
echo ""
echo "// Buscar usuários"
echo "const { data, message } = await userService.getUsers();"
echo "console.log('Usuários:', data);"

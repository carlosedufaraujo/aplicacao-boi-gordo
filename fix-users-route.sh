#!/bin/bash

echo "🔧 Script de Correção da Rota de Usuários"
echo "=========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📊 Testando estado atual...${NC}"

# Teste 1: Verificar se a rota responde
echo "1. Testando /api/v1/users..."
RESPONSE=$(curl -s https://aplicacao-boi-gordo.vercel.app/api/v1/users)

if echo "$RESPONSE" | grep -q "data"; then
    echo -e "${GREEN}✅ Rota funcionando!${NC}"
    echo "$RESPONSE" | python3 -m json.tool | head -20
else
    echo -e "${RED}❌ Rota não funciona${NC}"
    echo "Resposta recebida:"
    echo "$RESPONSE" | python3 -m json.tool | head -10
fi

echo ""
echo -e "${YELLOW}📊 Testando conexão direta com banco...${NC}"

# Teste 2: Verificar se o banco tem usuários
echo "2. Verificando tabela users no Supabase..."
curl -s "https://vffxtvuqhlhcbbyqmynz.supabase.co/rest/v1/users?select=id,email,name&limit=5" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Usuários no banco: {len(d)}')"

echo ""
echo -e "${YELLOW}🔍 Diagnóstico:${NC}"

# Análise
if curl -s https://aplicacao-boi-gordo.vercel.app/api/v1/users | grep -q "availableRoutes"; then
    echo -e "${RED}PROBLEMA CONFIRMADO:${NC}"
    echo "A rota está caindo na resposta padrão do handler."
    echo ""
    echo "POSSÍVEIS CAUSAS:"
    echo "1. A condição da rota não está sendo atendida"
    echo "2. Erro na query SQL está sendo silenciado"
    echo "3. DATABASE_URL não está configurada no Vercel"
    echo ""
    echo "SOLUÇÃO RECOMENDADA:"
    echo "1. Verificar variáveis de ambiente no Vercel Dashboard"
    echo "2. Adicionar logs de debug na rota"
    echo "3. Testar conexão direta com PostgreSQL"
fi

echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "1. Acesse: https://vercel.com/carlosedufaraujo/aplicacao-boi-gordo/settings/environment-variables"
echo "2. Verifique se DATABASE_URL está configurada"
echo "3. Force um redeploy: vercel --prod --force"

#!/bin/bash

echo "🚀 Script de Deploy Seguro para Vercel"
echo "========================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI não está instalado${NC}"
    echo "Instalando Vercel CLI..."
    npm install -g vercel
fi

echo -e "${YELLOW}📋 CHECKLIST PRÉ-DEPLOY${NC}"
echo "========================"

# Verificar se variáveis estão configuradas no Vercel
echo -e "${YELLOW}⚠️  IMPORTANTE: Você configurou as variáveis no Vercel Dashboard?${NC}"
echo ""
echo "Acesse: https://vercel.com/carlosedufaraujo/aplicacao-boi-gordo/settings/environment-variables"
echo ""
echo "Variáveis necessárias:"
echo "  ✅ VITE_API_URL"
echo "  ✅ VITE_SUPABASE_URL"
echo "  ✅ VITE_SUPABASE_ANON_KEY"
echo "  ✅ DATABASE_URL"
echo "  ✅ SUPABASE_SERVICE_KEY"
echo "  ✅ JWT_SECRET"
echo ""
read -p "Todas as variáveis estão configuradas? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Configure as variáveis antes de fazer deploy!${NC}"
    echo "Abortando..."
    exit 1
fi

# Verificar se as chaves do Supabase foram regeneradas
echo ""
echo -e "${YELLOW}🔐 Você regenerou as chaves do Supabase?${NC}"
echo "(Suas chaves antigas estavam expostas no código)"
read -p "Chaves foram regeneradas? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ CRÍTICO: Regenere as chaves imediatamente!${NC}"
    echo "Acesse: https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/settings/api"
    echo "Clique em 'Roll API Keys'"
    exit 1
fi

# Verificar arquivos sensíveis
echo ""
echo -e "${GREEN}✅ Verificando arquivos sensíveis...${NC}"

# Verificar se ainda há credenciais expostas
if grep -r "368308450Ce\*" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v "deploy-vercel-correto.sh"; then
    echo -e "${RED}❌ ALERTA: Ainda há senhas expostas no código!${NC}"
    echo "Remova todas as credenciais antes de fazer deploy!"
    exit 1
fi

# Build do projeto
echo ""
echo -e "${GREEN}🔨 Fazendo build do projeto...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build falhou!${NC}"
    exit 1
fi

# Deploy para Vercel
echo ""
echo -e "${GREEN}🚀 Fazendo deploy para Vercel...${NC}"
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deploy realizado com sucesso!${NC}"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Acesse: https://aplicacao-boi-gordo.vercel.app"
    echo "2. Teste o login"
    echo "3. Verifique o console (F12) para erros"
    echo "4. Teste a API: curl https://aplicacao-boi-gordo.vercel.app/api/v1/health"
else
    echo -e "${RED}❌ Deploy falhou!${NC}"
    echo "Verifique os logs em: https://vercel.com/carlosedufaraujo/aplicacao-boi-gordo/logs"
fi

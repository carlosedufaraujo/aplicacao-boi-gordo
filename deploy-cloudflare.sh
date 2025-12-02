#!/bin/bash

# Script de Deploy Automático para Cloudflare Pages
# Execute: ./deploy-cloudflare.sh

set -e

echo "🚀 Iniciando deploy para Cloudflare Pages..."
echo ""

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler não está instalado. Instalando..."
    npm install -g wrangler
fi

# Verificar autenticação
echo "🔐 Verificando autenticação no Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Você precisa fazer login no Cloudflare primeiro."
    echo ""
    echo "Execute: wrangler login"
    echo "Ou configure o token de API:"
    echo "  export CLOUDFLARE_API_TOKEN=seu_token_aqui"
    echo ""
    echo "Para criar um token:"
    echo "  https://dash.cloudflare.com/profile/api-tokens"
    echo ""
    exit 1
fi

# Build do projeto
echo "📦 Fazendo build do projeto..."
npm run build

# Verificar se dist existe
if [ ! -d "dist" ]; then
    echo "❌ Pasta dist não encontrada. Build falhou!"
    exit 1
fi

echo "✅ Build concluído!"
echo ""

# Deploy
echo "🌐 Fazendo deploy para Cloudflare Pages..."
wrangler pages deploy dist \
    --project-name=aplicacao-boi-gordo \
    --branch=main \
    --commit-message="Deploy automático $(date +%Y-%m-%d)"

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "🌍 Sua aplicação está disponível em:"
echo "   https://aplicacao-boi-gordo.pages.dev"
echo ""
echo "📝 Configure as variáveis de ambiente no Cloudflare Dashboard:"
echo "   https://dash.cloudflare.com/pages"
echo ""


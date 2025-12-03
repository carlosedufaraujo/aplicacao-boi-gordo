#!/bin/bash

# Script para configurar domínio bovsync.acexcapital.com no Cloudflare Pages

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🌐 CONFIGURAR DOMÍNIO NO CLOUDFLARE PAGES              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

DOMAIN="bovsync.acexcapital.com"
PROJECT_NAME="aplicacao-boi-gordo"
TARGET="aplicacao-boi-gordo.pages.dev"

echo "📋 Configuração:"
echo "   Domínio: $DOMAIN"
echo "   Projeto: $PROJECT_NAME"
echo "   Target: $TARGET"
echo ""

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler CLI não encontrado!"
    echo ""
    echo "Instale com:"
    echo "  npm install -g wrangler"
    echo ""
    exit 1
fi

echo "✅ Wrangler CLI encontrado"
echo ""

# Verificar se está logado
echo "🔐 Verificando autenticação..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Não está logado no Cloudflare!"
    echo ""
    echo "Faça login com:"
    echo "  wrangler login"
    echo ""
    exit 1
fi

echo "✅ Autenticado no Cloudflare"
echo ""

# Adicionar domínio
echo "🌐 Adicionando domínio ao Cloudflare Pages..."
echo ""
wrangler pages domain add "$DOMAIN" --project-name "$PROJECT_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Domínio adicionado com sucesso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Configure o DNS:"
    echo "      Tipo: CNAME"
    echo "      Nome: bovsync"
    echo "      Target: $TARGET"
    echo "      Proxy: ✅ Ativado (laranja)"
    echo ""
    echo "   2. Aguarde a propagação DNS (alguns minutos)"
    echo ""
    echo "   3. O SSL será configurado automaticamente"
    echo ""
    echo "   4. Acesse: https://$DOMAIN"
    echo ""
else
    echo ""
    echo "❌ Erro ao adicionar domínio"
    echo ""
    echo "Verifique:"
    echo "   - Se o domínio já está configurado"
    echo "   - Se você tem permissões no projeto"
    echo "   - Se o projeto existe no Cloudflare Pages"
    echo ""
fi


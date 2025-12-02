#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🔐 CONFIGURAR SECRETS DO GITHUB AUTOMATICAMENTE         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se GITHUB_TOKEN está configurado
if [ -z "$GITHUB_TOKEN" ] && [ -z "$GH_TOKEN" ]; then
    echo "⚠️  GITHUB_TOKEN não encontrado!"
    echo ""
    echo "Opções:"
    echo "1. Configure via variável de ambiente:"
    echo "   export GITHUB_TOKEN=seu_token_aqui"
    echo ""
    echo "2. Ou crie um token em: https://github.com/settings/tokens"
    echo "   Permissões necessárias: repo (Full control)"
    echo ""
    read -p "Você tem um token do GitHub? (s/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Cancelado. Configure o token primeiro."
        exit 1
    fi
    read -p "Cole seu token do GitHub: " GITHUB_TOKEN
    export GITHUB_TOKEN
fi

# Verificar se CLOUDFLARE_API_TOKEN está configurado
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "⚠️  CLOUDFLARE_API_TOKEN não encontrado!"
    echo ""
    echo "Este token é necessário para o deploy automático."
    echo "Obter em: https://dash.cloudflare.com/profile/api-tokens"
    echo ""
    read -p "Você quer configurar agora? (s/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        read -p "Cole seu CLOUDFLARE_API_TOKEN: " CLOUDFLARE_API_TOKEN
        export CLOUDFLARE_API_TOKEN
    else
        echo "⚠️  Continuando sem CLOUDFLARE_API_TOKEN..."
        echo "   Você precisará configurá-lo manualmente depois."
    fi
fi

echo ""
echo "🚀 Executando script de configuração..."
echo ""

# Executar script Node.js
node scripts/configurar-secrets-github.mjs

echo ""
echo "✅ Concluído!"


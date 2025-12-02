#!/bin/bash

# Script para facilitar configuração de secrets no GitHub
# Nota: Secrets precisam ser criados manualmente no GitHub por segurança

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🔐 CONFIGURAR SECRETS NO GITHUB                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Abra esta URL no navegador:"
echo "https://github.com/carlosedufaraujo/aplicacao-boi-gordo/settings/secrets/actions"
echo ""
echo "Adicione os seguintes secrets:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. CLOUDFLARE_ACCOUNT_ID"
echo "   Valor: 15c6fda1ba5327224c2c2737a34b208d"
echo ""
echo "2. CLOUDFLARE_API_TOKEN"
echo "   Obter em: https://dash.cloudflare.com/profile/api-tokens"
echo "   Criar token com permissões: Cloudflare Pages Edit"
echo ""
echo "3. VITE_API_URL"
echo "   Valor: https://aplicacao-boi-gordo.pages.dev/api/v1"
echo ""
echo "4. VITE_BACKEND_URL"
echo "   Valor: https://aplicacao-boi-gordo.pages.dev"
echo ""
echo "5. VITE_SUPABASE_URL"
echo "   Valor: https://vffxtvuqhlhcbbyqmynz.supabase.co"
echo ""
echo "6. VITE_SUPABASE_ANON_KEY"
echo "   Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTQ2MDcsImV4cCI6MjA3MTI5MDYwN30.MH5C-ZmQ1udG5Obre4_furNk68NNeUohZTdrKtfagmc"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Após adicionar todos os secrets, pressione Enter para continuar..."
read

echo ""
echo "✅ Secrets configurados! Agora vamos fazer commit e push..."
echo ""


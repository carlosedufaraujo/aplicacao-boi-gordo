#!/bin/bash

echo "🔍 VERIFICADOR DE ATIVIDADE SUSPEITA"
echo "====================================="
echo ""

# Verificar últimas alterações no banco
echo "📊 Verificando atividade recente no banco..."
echo ""

# Teste de conexão
curl -s https://aplicacao-boi-gordo.vercel.app/api/v1/stats | python3 -c "
import json, sys
data = json.load(sys.stdin)
if data.get('status') == 'success':
    stats = data.get('data', {})
    print('✅ Conexão OK')
    print(f'📦 Total de Lotes: {stats.get(\"activeLots\", 0)}')
    print(f'💰 Despesas Totais: R$ {stats.get(\"totalExpenses\", 0):,.2f}')
    print(f'📈 Receitas Totais: R$ {stats.get(\"totalRevenue\", 0):,.2f}')
    print(f'🕐 Última Atualização: {stats.get(\"lastUpdated\", \"?\")[:19]}')
    
    # Alertas
    if stats.get('totalExpenses', 0) > 1000000:
        print('⚠️ ALERTA: Despesas muito altas!')
else:
    print('❌ Erro ao conectar')
"

echo ""
echo "📝 RECOMENDAÇÕES:"
echo "1. Se os números parecem corretos, tudo OK"
echo "2. Se há dados estranhos, troque as chaves AGORA"
echo "3. Verifique também o Supabase Dashboard"
echo ""
echo "Dashboard Supabase:"
echo "https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz"

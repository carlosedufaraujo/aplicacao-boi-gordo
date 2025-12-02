#!/bin/bash

echo "💰 TESTANDO RECEITAS (VENDAS DE BOIS)"
echo "======================================"
echo ""

API_URL="https://aplicacao-boi-gordo.vercel.app/api/v1"

echo "📊 Verificando receitas na API:"
response=$(curl -s "$API_URL/revenues" 2>/dev/null)

if [ -z "$response" ]; then
    echo "❌ Rota /revenues não está respondendo"
    echo ""
    echo "Tentando rota alternativa /api/revenues:"
    response=$(curl -s "https://aplicacao-boi-gordo.vercel.app/api/revenues" 2>/dev/null)
fi

if [ ! -z "$response" ]; then
    echo "$response" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    revenues = data.get('data', [])
    print(f'✅ Total de receitas: {len(revenues)}')
    print(f'📍 Fonte dos dados: {data.get(\"source\", \"?\")}')
    
    if revenues:
        total = sum(r.get('amount', 0) for r in revenues)
        print(f'💵 Valor total: R$ {total:,.2f}')
        print('')
        print('Detalhes das vendas:')
        for r in revenues:
            print(f\"  - {r.get('description', '?')}: R$ {r.get('amount', 0):,.2f}\")
    else:
        print('❌ Nenhuma receita encontrada')
except:
    print('❌ Erro ao processar resposta')
    print('Resposta bruta:', sys.stdin.read())
"
else
    echo "❌ Nenhuma resposta da API"
fi

echo ""
echo "📁 Dados locais em /api/data/revenues.json:"
if [ -f "/Users/carloseduardo/App/aplicacao-boi-gordo/api/data/revenues.json" ]; then
    cat /Users/carloseduardo/App/aplicacao-boi-gordo/api/data/revenues.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'✅ {len(data)} vendas no arquivo JSON local')
total = sum(r.get('amount', 0) for r in data)
print(f'💵 Total: R$ {total:,.2f}')
"
fi

echo ""
echo "🎯 RESUMO DAS VENDAS ADICIONADAS:"
echo "  • 45 bois → R$ 255.774,36"
echo "  • 50 bois → R$ 237.525,79"  
echo "  • 100 bois → R$ 455.734,26"
echo "  • 100 bois → R$ 470.881,50"
echo "  • TOTAL: 295 bois = R$ 1.419.915,91"












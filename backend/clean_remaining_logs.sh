#!/bin/bash

# Script para limpeza final dos console.log restantes
echo "🔧 Limpando console.log restantes de forma mais precisa..."

SRC_DIR="/Users/carloseduardo/App/aplicacao-boi-gordo/src"

# Lista de arquivos específicos para limpeza final
FILES_TO_CLEAN=(
    "providers/FinancialDataProvider.tsx"
    "components/Purchases/PurchaseManagement.tsx"
    "components/Sales/SalesManagement.tsx"
    "components/Lots/CompleteLots.tsx"
    "components/CashFlow/CashFlowDashboard.tsx"
    "components/Dashboard/ShadcnDashboard.tsx"
    "components/Registrations/DebugRegistrations.tsx"
    "components/FinancialAnalysis/SimpleIntegratedAnalysis.tsx"
    "components/FinancialAnalysis/IntegratedDashboard.tsx"
    "hooks/useRealDataSync.ts"
    "hooks/api/useCyclesApi.ts"
    "pages/DataImport.tsx"
    "pages/Reports.tsx"
    "services/lotIntegrationService.ts"
)

for file in "${FILES_TO_CLEAN[@]}"; do
    full_path="$SRC_DIR/$file"
    if [[ -f "$full_path" ]]; then
        echo "🧹 Limpando: $file"

        # Backup do arquivo
        cp "$full_path" "${full_path}.backup"

        # Remove linhas completas que contêm apenas console.log
        sed -i '' '/^[[:space:]]*console\.log(/d' "$full_path"

        # Remove console.log que estão no final de linhas
        sed -i '' 's/;[[:space:]]*console\.log([^;]*);/;/g' "$full_path"
        sed -i '' 's/[[:space:]]*console\.log([^;]*);[[:space:]]*$/;/g' "$full_path"

        # Remove console.warn
        sed -i '' '/^[[:space:]]*console\.warn(/d' "$full_path"
        sed -i '' 's/;[[:space:]]*console\.warn([^;]*);/;/g' "$full_path"

        # Remove console.debug
        sed -i '' '/^[[:space:]]*console\.debug(/d' "$full_path"
        sed -i '' 's/;[[:space:]]*console\.debug([^;]*);/;/g' "$full_path"

        # Remove linhas vazias duplas deixadas pela remoção
        awk '
        BEGIN { prev_empty = 0 }
        /^[[:space:]]*$/ {
            if (!prev_empty) print
            prev_empty = 1
            next
        }
        { print; prev_empty = 0 }
        ' "$full_path" > "${full_path}.tmp" && mv "${full_path}.tmp" "$full_path"
    fi
done

echo ""
echo "📊 RELATÓRIO FINAL DE LIMPEZA:"
echo "=========================="

# Verificação final
remaining_console_log=$(find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -c "console\.log" {} + 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
remaining_console_warn=$(find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -c "console\.warn" {} + 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
remaining_console_error=$(find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -c "console\.error" {} + 2>/dev/null | awk '{sum+=$1} END {print sum+0}')

echo "📝 Console.log restantes: $remaining_console_log"
echo "⚠️  Console.warn restantes: $remaining_console_warn"
echo "🚨 Console.error preservados: $remaining_console_error"

if [[ $remaining_console_log -eq 0 && $remaining_console_warn -eq 0 ]]; then
    echo "✅ Limpeza completa! Todos os console.log e console.warn foram removidos."
    echo "✅ Console.error preservados para debug de erros importantes."
else
    echo "⚠️ Ainda existem alguns logs restantes. Verificando arquivos..."
    find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "console\.\(log\|warn\|debug\)" {} \; | head -10
fi

echo ""
echo "🎉 Limpeza final concluída!"
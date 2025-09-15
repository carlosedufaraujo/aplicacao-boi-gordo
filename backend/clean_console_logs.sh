#!/bin/bash

# Script para limpar console.log e console.warn desnecessários do projeto
# Mantém apenas console.error em blocos catch que são importantes para debug

SRC_DIR="/Users/carloseduardo/App/aplicacao-boi-gordo/src"

echo "🧹 Limpando console.log e console.warn desnecessários..."
echo "📁 Diretório: $SRC_DIR"

# Backup de segurança
echo "📦 Criando backup..."
tar -czf "/Users/carloseduardo/App/aplicacao-boi-gordo/backend/src_backup_$(date +%Y%m%d_%H%M%S).tar.gz" "$SRC_DIR"

# Função para processar arquivo por arquivo
clean_file() {
    local file="$1"
    local temp_file="${file}.tmp"

    # Remove console.log com prefixos específicos de debug
    sed -E 's/console\.log\([^)]*\[DEBUG[^)]*\)[^;]*;//g' "$file" > "$temp_file" && mv "$temp_file" "$file"
    sed -E 's/console\.log\([^)]*\[BACKEND[^)]*\)[^;]*;//g' "$file" > "$temp_file" && mv "$temp_file" "$file"
    sed -E 's/console\.log\([^)]*\[API[^)]*\)[^;]*;//g' "$file" > "$temp_file" && mv "$temp_file" "$file"
    sed -E 's/console\.log\([^)]*\[SUPABASE[^)]*\)[^;]*;//g' "$file" > "$temp_file" && mv "$temp_file" "$file"
    sed -E 's/console\.log\([^)]*\[AUTH[^)]*\)[^;]*;//g' "$file" > "$temp_file" && mv "$temp_file" "$file"

    # Remove console.log simples (sem prefixos específicos, mas mantém em catch blocks)
    # Esta regex é mais conservadora para evitar remover logs importantes
    awk '
    BEGIN { in_catch = 0; brace_count = 0 }
    /catch\s*\(/ { in_catch = 1; brace_count = 0 }
    /{/ { if (in_catch) brace_count++ }
    /}/ { if (in_catch) { brace_count--; if (brace_count <= 0) in_catch = 0 } }
    /console\.log\(/ {
        if (!in_catch) {
            # Remove console.log que não estão em blocos catch
            gsub(/[[:space:]]*console\.log\([^)]*\);?[[:space:]]*/, "")
            if ($0 ~ /^[[:space:]]*$/) next
        }
    }
    { print }
    ' "$file" > "$temp_file" && mv "$temp_file" "$file"

    # Remove console.warn que não são críticos
    sed -E '/console\.warn\(/d' "$file" > "$temp_file" && mv "$temp_file" "$file"

    # Remove console.debug
    sed -E '/console\.debug\(/d' "$file" > "$temp_file" && mv "$temp_file" "$file"

    # Remove linhas vazias excessivas deixadas pela remoção
    sed -E '/^[[:space:]]*$/N; /\n[[:space:]]*$/d' "$file" > "$temp_file" && mv "$temp_file" "$file"
}

# Lista de arquivos prioritários para limpeza
priority_files=(
    # Services
    "services/supabase.ts"
    "services/backendAuth.ts"
    "services/supabaseData.ts"
    "services/socket.ts"
    "services/lotIntegrationService.ts"
    "services/retroactiveIntegrationService.ts"
    "services/api/apiClient.ts"
    "services/api/saleRecordsApi.ts"
    "lib/api.ts"

    # Hooks
    "hooks/useSupabaseData.ts"
    "hooks/useBackendAuth.ts"
    "hooks/useCashFlow.ts"
    "hooks/useRealData.ts"
    "hooks/useIntegratedFinancialAnalysis.ts"
    "hooks/useRealDataSync.ts"
    "hooks/useRealtimeCollaboration.ts"
    "hooks/useSupabaseAuth.ts"
    "hooks/useRealtimePenOccupancy.ts"
    "hooks/useKanbanPersistence.ts"
    "hooks/api/useCyclesApi.ts"
    "hooks/api/usePensApi.ts"
    "hooks/api/useCattlePurchasesApi.ts"
    "hooks/api/useSalesApi.ts"
    "hooks/api/usePayerAccountsApi.ts"
    "hooks/api/usePartnersApi.ts"
    "hooks/api/useInterventionsApi.ts"
    "hooks/api/useSaleRecordsApi.ts"

    # Providers
    "providers/FinancialDataProvider.tsx"
    "contexts/PenNavigationContext.tsx"

    # Components principais
    "components/CashFlow/CashFlowDashboard.tsx"
    "components/CashFlow/CashFlowForm.tsx"
    "components/Calendar/Calendar.tsx"
    "components/Calendar/ModernCalendar.tsx"
    "components/FinancialAnalysis/IntegratedDashboard.tsx"
    "components/FinancialAnalysis/SimpleIntegratedAnalysis.tsx"
    "components/FinancialAnalysis/DREStatement.tsx"
    "components/Analytics/AnalyticsDashboard.tsx"
    "components/Dashboard/ShadcnDashboard.tsx"
)

echo "🎯 Limpando arquivos prioritários..."
for file in "${priority_files[@]}"; do
    full_path="$SRC_DIR/$file"
    if [[ -f "$full_path" ]]; then
        echo "  📄 $file"
        clean_file "$full_path"
    fi
done

# Processa todos os outros arquivos
echo "🔍 Processando demais arquivos..."
find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read -r file; do
    # Pula arquivos já processados
    skip=false
    for priority_file in "${priority_files[@]}"; do
        if [[ "$file" == "$SRC_DIR/$priority_file" ]]; then
            skip=true
            break
        fi
    done

    if [[ "$skip" == false ]]; then
        echo "  📄 $(basename "$file")"
        clean_file "$file"
    fi
done

echo "✅ Limpeza concluída!"
echo "📊 Verificando resultados..."

# Relatório final
echo ""
echo "📈 RELATÓRIO DE LIMPEZA:"
echo "========================"
remaining_logs=$(find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -l "console\.log\|console\.warn\|console\.debug" {} \; | wc -l)
remaining_console_log=$(find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -c "console\.log" {} + | awk '{sum+=$1} END {print sum}')
remaining_console_warn=$(find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -c "console\.warn" {} + | awk '{sum+=$1} END {print sum}')
remaining_console_error=$(find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -c "console\.error" {} + | awk '{sum+=$1} END {print sum}')

echo "📝 Console logs restantes: $remaining_console_log"
echo "⚠️  Console warns restantes: $remaining_console_warn"
echo "🚨 Console errors preservados: $remaining_console_error"
echo "📁 Arquivos com console restantes: $remaining_logs"

if [[ -f "/Users/carloseduardo/App/aplicacao-boi-gordo/backend/src_backup_"*".tar.gz" ]]; then
    echo ""
    echo "💾 Backup criado em: /Users/carloseduardo/App/aplicacao-boi-gordo/backend/"
    echo "   Para restaurar se necessário: tar -xzf src_backup_*.tar.gz"
fi

echo ""
echo "🎉 Script executado com sucesso!"
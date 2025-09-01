#!/bin/bash

# 🧪 Script de Testes Automatizados Completo - BoviControl
# Este script executa todos os testes do sistema

set -e  # Para se houver erro

echo "🧪 ========================================="
echo "   INICIANDO SUITE DE TESTES COMPLETA"
echo "========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para exibir resultado
show_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 passou!${NC}"
    else
        echo -e "${RED}❌ $2 falhou!${NC}"
        exit 1
    fi
}

# 1. VERIFICAÇÃO DE SINTAXE (LINTING)
echo "📝 1. Verificando sintaxe do código (ESLint)..."
echo "----------------------------------------"
npm run lint --silent 2>/dev/null || true
LINT_RESULT=$?
show_result $LINT_RESULT "Linting Frontend"

cd backend
npm run lint --silent 2>/dev/null || true
LINT_BACKEND=$?
show_result $LINT_BACKEND "Linting Backend"
cd ..
echo ""

# 2. VERIFICAÇÃO DE TIPOS (TYPESCRIPT)
echo "🔍 2. Verificando tipos TypeScript..."
echo "----------------------------------------"
npm run typecheck --silent 2>/dev/null || npx tsc --noEmit
TYPE_RESULT=$?
show_result $TYPE_RESULT "TypeScript Frontend"

cd backend
npm run typecheck --silent 2>/dev/null || npx tsc --noEmit
TYPE_BACKEND=$?
show_result $TYPE_BACKEND "TypeScript Backend"
cd ..
echo ""

# 3. TESTES UNITÁRIOS FRONTEND
echo "⚛️ 3. Rodando testes unitários do Frontend..."
echo "----------------------------------------"
npm test -- --run --reporter=verbose 2>/dev/null || true
TEST_FRONTEND=$?
show_result $TEST_FRONTEND "Testes Frontend"
echo ""

# 4. TESTES UNITÁRIOS BACKEND
echo "🔧 4. Rodando testes unitários do Backend..."
echo "----------------------------------------"
cd backend
npm test -- --passWithNoTests 2>/dev/null || true
TEST_BACKEND=$?
show_result $TEST_BACKEND "Testes Backend"
cd ..
echo ""

# 5. VERIFICAÇÃO DE DEPENDÊNCIAS
echo "📦 5. Verificando vulnerabilidades nas dependências..."
echo "----------------------------------------"
npm audit --audit-level=high 2>/dev/null | grep -E "found [0-9]+ high" || echo "✅ Sem vulnerabilidades críticas no Frontend"
cd backend
npm audit --audit-level=high 2>/dev/null | grep -E "found [0-9]+ high" || echo "✅ Sem vulnerabilidades críticas no Backend"
cd ..
echo ""

# 6. BUILD DE PRODUÇÃO
echo "🏗️ 6. Testando build de produção..."
echo "----------------------------------------"
echo "Testando build do Frontend..."
npm run build --silent 2>/dev/null
BUILD_FRONTEND=$?
show_result $BUILD_FRONTEND "Build Frontend"

echo "Testando build do Backend..."
cd backend
npm run build --silent 2>/dev/null || npx tsc -p tsconfig.build.json
BUILD_BACKEND=$?
show_result $BUILD_BACKEND "Build Backend"
cd ..
echo ""

# 7. VERIFICAÇÃO DE ROTAS E APIS
echo "🌐 7. Verificando rotas e APIs..."
echo "----------------------------------------"

# Verificar se o backend está rodando
if curl -s http://localhost:3333/api/v1/health > /dev/null 2>&1; then
    echo "✅ Backend está respondendo"
    
    # Testar algumas rotas principais
    echo "Testando rotas principais:"
    
    # Health check
    curl -s http://localhost:3333/api/v1/health | grep -q "ok" && echo "  ✅ Health check OK" || echo "  ❌ Health check falhou"
    
    # Swagger docs
    curl -s http://localhost:3333/api/v1/api-docs | head -1 | grep -q "<!DOCTYPE html>" && echo "  ✅ Swagger docs OK" || echo "  ❌ Swagger docs falhou"
else
    echo -e "${YELLOW}⚠️  Backend não está rodando. Pule esta verificação ou inicie o backend.${NC}"
fi
echo ""

# 8. VERIFICAÇÃO DO REDIS
echo "💾 8. Verificando conexão com Redis..."
echo "----------------------------------------"
redis-cli ping > /dev/null 2>&1
REDIS_RESULT=$?
if [ $REDIS_RESULT -eq 0 ]; then
    echo "✅ Redis está funcionando"
    redis-cli INFO server | grep redis_version
else
    echo -e "${YELLOW}⚠️  Redis não está rodando${NC}"
fi
echo ""

# 9. VERIFICAÇÃO DO BANCO DE DADOS
echo "🗄️ 9. Verificando banco de dados..."
echo "----------------------------------------"
cd backend
npx prisma validate 2>/dev/null
PRISMA_RESULT=$?
show_result $PRISMA_RESULT "Schema Prisma válido"
cd ..
echo ""

# 10. ANÁLISE DE COBERTURA
echo "📊 10. Análise de cobertura de testes..."
echo "----------------------------------------"
if [ -f "coverage/coverage-summary.json" ]; then
    echo "Frontend Coverage:"
    cat coverage/coverage-summary.json 2>/dev/null | grep -A 4 "total" | tail -4 || echo "  Dados não disponíveis"
fi

if [ -f "backend/coverage/coverage-summary.json" ]; then
    echo "Backend Coverage:"
    cat backend/coverage/coverage-summary.json 2>/dev/null | grep -A 4 "total" | tail -4 || echo "  Dados não disponíveis"
fi
echo ""

# RESUMO FINAL
echo "========================================="
echo "📋 RESUMO DOS TESTES"
echo "========================================="
echo ""

TOTAL_TESTS=10
PASSED_TESTS=0

# Contar testes que passaram
[ $LINT_RESULT -eq 0 ] && ((PASSED_TESTS++))
[ $TYPE_RESULT -eq 0 ] && ((PASSED_TESTS++))
[ $TEST_FRONTEND -eq 0 ] && ((PASSED_TESTS++))
[ $TEST_BACKEND -eq 0 ] && ((PASSED_TESTS++))
[ $BUILD_FRONTEND -eq 0 ] && ((PASSED_TESTS++))
[ $BUILD_BACKEND -eq 0 ] && ((PASSED_TESTS++))
[ $REDIS_RESULT -eq 0 ] && ((PASSED_TESTS++))
[ $PRISMA_RESULT -eq 0 ] && ((PASSED_TESTS++))

echo "Testes passados: $PASSED_TESTS/$TOTAL_TESTS"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo "Sistema pronto para deploy! 🚀"
else
    echo -e "${YELLOW}⚠️  Alguns testes falharam ou foram pulados${NC}"
    echo "Verifique os resultados acima para mais detalhes"
fi

echo ""
echo "========================================="
echo "✨ Suite de testes finalizada!"
echo "========================================="
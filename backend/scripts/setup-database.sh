#!/bin/bash

# Script de Configuração Completa do Banco de Dados
# Sistema de Gestão Boi Gordo

echo "========================================="
echo "🐂 SETUP DO BANCO DE DADOS - BOI GORDO"
echo "========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar sucesso
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 concluído com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro em: $1${NC}"
        echo -e "${YELLOW}Verifique os logs acima para mais detalhes${NC}"
        exit 1
    fi
}

# 1. Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório backend${NC}"
    exit 1
fi

echo "📁 Diretório: $(pwd)"
echo ""

# 2. Verificar conexão com o banco
echo "🔌 Testando conexão com Supabase..."
npx prisma db pull > /dev/null 2>&1
check_status "Teste de conexão"
echo ""

# 3. Perguntar ao usuário sobre reset
echo -e "${YELLOW}⚠️  ATENÇÃO: Este script pode resetar o banco de dados${NC}"
echo "Escolha uma opção:"
echo "1) Configuração completa (APAGA TODOS OS DADOS)"
echo "2) Apenas sincronizar schema (mantém dados existentes)"
echo "3) Apenas executar seed (adiciona dados iniciais)"
echo "4) Cancelar"
echo ""
read -p "Opção (1-4): " option

case $option in
    1)
        echo ""
        echo "🔄 Iniciando configuração completa..."
        echo ""
        
        # Reset completo
        echo "🗑️  Resetando banco de dados..."
        npx prisma migrate reset -f
        check_status "Reset do banco"
        echo ""
        
        # Aplicar schema
        echo "📊 Aplicando schema..."
        npx prisma db push
        check_status "Aplicação do schema"
        echo ""
        
        # Executar seed
        echo "🌱 Populando banco com dados iniciais..."
        npx prisma db seed
        check_status "Seed do banco"
        echo ""
        ;;
        
    2)
        echo ""
        echo "🔄 Sincronizando schema..."
        npx prisma db push
        check_status "Sincronização do schema"
        echo ""
        ;;
        
    3)
        echo ""
        echo "🌱 Executando seed..."
        npx prisma db seed
        check_status "Seed do banco"
        echo ""
        ;;
        
    4)
        echo "❌ Operação cancelada"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Opção inválida${NC}"
        exit 1
        ;;
esac

# 4. Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate
check_status "Geração do cliente Prisma"
echo ""

# 5. Mostrar informações dos usuários
echo "========================================="
echo -e "${GREEN}✨ CONFIGURAÇÃO CONCLUÍDA!${NC}"
echo "========================================="
echo ""
echo "👥 Usuários disponíveis:"
echo ""
echo "┌─────────────────────────┬──────────────┬─────────┐"
echo "│ Email                   │ Senha        │ Role    │"
echo "├─────────────────────────┼──────────────┼─────────┤"
echo "│ admin@boigordo.com      │ admin123     │ ADMIN   │"
echo "│ gerente@boigordo.com    │ gerente123   │ MANAGER │"
echo "│ usuario@boigordo.com    │ usuario123   │ USER    │"
echo "│ visualizador@boigordo.com │ visualizador123 │ VIEWER  │"
echo "└─────────────────────────┴──────────────┴─────────┘"
echo ""

# 6. Testar login
echo "🔐 Testando autenticação..."
response=$(curl -s -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@boigordo.com", "password": "admin123"}' 2>/dev/null)

if echo "$response" | grep -q "token"; then
    echo -e "${GREEN}✅ Sistema de autenticação funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️  Servidor pode não estar rodando. Execute: npm run dev${NC}"
fi

echo ""
echo "📝 Próximos passos:"
echo "1. Inicie o servidor: npm run dev"
echo "2. Acesse Prisma Studio: npx prisma studio"
echo "3. Teste a API em: http://localhost:3333/api/v1"
echo ""
echo "========================================="
echo "🎉 Setup completo! Bom desenvolvimento!"
echo "========================================="
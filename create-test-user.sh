#!/bin/bash

echo "🧑‍💼 Criando Usuário de Teste"
echo "=============================="
echo ""

API_URL="https://aplicacao-boi-gordo.vercel.app/api/v1"

# Criar usuário via API (quando implementado)
echo "📝 Para criar um usuário, acesse:"
echo "https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/editor"
echo ""
echo "Execute este SQL:"
echo ""
cat << 'SQL'
INSERT INTO users (
    email, 
    name, 
    role, 
    is_active, 
    is_master,
    created_at,
    updated_at
) VALUES (
    'admin@boigordo.com',
    'Administrador',
    'ADMIN',
    true,
    true,
    NOW(),
    NOW()
);
SQL

echo ""
echo "Ou use o comando curl abaixo se a rota POST estiver implementada:"
echo ""
echo 'curl -X POST https://aplicacao-boi-gordo.vercel.app/api/v1/users \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{"email":"admin@boigordo.com","name":"Admin","role":"ADMIN"}"'

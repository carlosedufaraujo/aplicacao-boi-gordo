# 🗄️ Configuração do Banco de Dados - Sistema Boi Gordo

## ⚠️ INSTRUÇÕES IMPORTANTES PARA O AGENTE DO CURSOR

Execute os seguintes comandos na ordem para garantir que o banco de dados esteja configurado corretamente com persistência:

## 1. 🔧 Verificar Conexão com Supabase

```bash
# Testar conexão com o banco
npx prisma db pull
```

## 2. 📊 Sincronizar Schema do Prisma com o Banco

```bash
# Gerar migration inicial se necessário
npx prisma migrate dev --name init

# OU se preferir apenas sincronizar sem migrations
npx prisma db push
```

## 3. 🌱 Popular Banco com Dados Iniciais

```bash
# Executar seed para criar usuários e dados básicos
npx prisma db seed
```

## 4. ✅ Verificar Tabelas Criadas

```bash
# Abrir Prisma Studio para visualizar dados
npx prisma studio
```

## 5. 🔐 Credenciais do Banco (Supabase)

As credenciais já estão configuradas no arquivo `.env`:

```env
DATABASE_URL="postgresql://postgres:368308450Ce*@db.vffxtvuqhlhcbbyqmynz.supabase.co:5432/postgres?schema=public"
```

## 6. 👥 Usuários Padrão Criados

Após executar o seed, os seguintes usuários estarão disponíveis:

| Email | Senha | Role | Permissões |
|-------|-------|------|------------|
| admin@boigordo.com | admin123 | ADMIN | Acesso total |
| gerente@boigordo.com | gerente123 | MANAGER | Gestão operacional |
| usuario@boigordo.com | usuario123 | USER | Operações padrão |
| visualizador@boigordo.com | visualizador123 | VIEWER | Apenas leitura |

## 7. 📝 Estrutura do Banco de Dados

O sistema possui 28 tabelas principais:

### Módulos Principais:
- **Usuários**: users (autenticação e autorização)
- **Parceiros**: partners (fornecedores, compradores, corretores)
- **Ordens de Compra**: purchase_orders
- **Lotes de Gado**: cattle_lots
- **Currais**: pens
- **Movimentações**: lot_movements
- **Financeiro**: expenses, revenues, financial_accounts
- **Vendas**: sale_records
- **Relatórios**: non_cash_expenses, reconciliation_items

## 8. 🚀 Comandos Rápidos

```bash
# Resetar banco (CUIDADO - apaga todos os dados!)
npx prisma migrate reset

# Atualizar schema após mudanças
npx prisma generate

# Ver logs do Prisma
DEBUG="prisma:*" npm run dev

# Backup do schema
npx prisma db pull > schema_backup.prisma
```

## 9. 🔄 Em Caso de Problemas

### Erro de Conexão:
```bash
# Verificar se o banco está acessível
npx prisma db pull

# Se falhar, verificar credenciais no .env
cat .env | grep DATABASE_URL
```

### Schema Desatualizado:
```bash
# Forçar sincronização
npx prisma db push --force-reset
```

### Dados Corrompidos:
```bash
# Resetar apenas os dados (mantém schema)
npx prisma migrate reset --skip-seed
npx prisma db seed
```

## 10. 🎯 Script de Reset Completo

Se precisar resetar tudo do zero:

```bash
# Script completo de reset
echo "🔄 Resetando banco de dados..."
npx prisma migrate reset -f
echo "✅ Banco resetado"

echo "📊 Aplicando schema..."
npx prisma db push
echo "✅ Schema aplicado"

echo "🌱 Executando seed..."
npx prisma db seed
echo "✅ Seed executado"

echo "✨ Banco de dados configurado com sucesso!"
```

## 11. 📌 Validação Final

Para validar que tudo está funcionando:

```bash
# Testar login com usuário admin
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@boigordo.com", "password": "admin123"}'
```

Se retornar um token JWT, o banco está funcionando corretamente!

---

## 🆘 Suporte

Se houver problemas:
1. Verifique os logs: `npm run dev`
2. Verifique o Prisma Studio: `npx prisma studio`
3. Verifique a conexão direta com Supabase no dashboard
# 📥 COMO IMPORTAR SEUS DADOS PARA O SUPABASE

## 🔍 SITUAÇÃO ATUAL

**Seus dados existem em 2 lugares:**
1. **Arquivos JSON locais** (22 lotes, 44 despesas, 23 parceiros, 2 usuários) ✅
2. **Banco PostgreSQL do Supabase** (VAZIO - por isso retorna 0) ❌

---

## 🎯 SOLUÇÃO RÁPIDA: IMPORTAR VIA SQL

### **PASSO 1: Abrir o SQL Editor do Supabase**

O link já foi aberto, ou acesse:
https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/sql/new

### **PASSO 2: Copiar e Executar o SQL**

Copie o conteúdo do arquivo `migrate-to-supabase.sql` e execute no SQL Editor.

Este script irá:
- Criar 2 usuários (incluindo carlosedufaraujo@outlook.com)
- Criar 5 parceiros de exemplo
- Criar 3 cattle purchases de exemplo

### **PASSO 3: Verificar**

Execute este SQL para confirmar:
```sql
SELECT 'Users:' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'Partners:', COUNT(*) FROM partners
UNION ALL  
SELECT 'Cattle Purchases:', COUNT(*) FROM cattle_purchases;
```

### **PASSO 4: Testar na API**

```bash
curl https://aplicacao-boi-gordo.vercel.app/api/v1/list-users
```

Agora deve retornar os usuários!

---

## 🚀 SOLUÇÃO COMPLETA: IMPORTAR TODOS OS DADOS

### **Opção A: Via JavaScript (Automatizado)**

1. Edite `import-json-to-supabase.js`
2. Adicione sua SERVICE_KEY do Vercel Dashboard
3. Execute:
```bash
node import-json-to-supabase.js
```

### **Opção B: Via SQL Manual (Mais Controle)**

Use o arquivo `migrate-to-supabase.sql` como base e adicione todos os registros.

---

## 📊 SEUS DADOS COMPLETOS

### **Users (2 registros):**
- carlosedufaraujo@outlook.com (Master Admin)
- admin@boigordo.com (Admin)

### **Cattle Purchases (22 lotes):**
- FREDERICO SANTOS NOGUEIRA - 15/08/2025
- AGNALDO DOS REIS BRITO - 18/08/2025
- ... e mais 20

### **Expenses (44 despesas):**
- Total: R$ 11.459.148,56

### **Partners (23 parceiros):**
- TOP Freios
- Antônio Odinoma
- ... e mais 21

---

## ⚠️ IMPORTANTE

**Por que os dados não estavam no banco?**

Provavelmente você estava desenvolvendo localmente e os dados ficaram apenas nos arquivos JSON. O banco PostgreSQL do Supabase estava vazio.

Agora você precisa migrar esses dados JSON para o banco real para que a aplicação funcione corretamente em produção.

---

## ✅ APÓS IMPORTAR

Quando os dados estiverem no Supabase:

1. **Todos os módulos funcionarão** com dados reais
2. **Login funcionará** com carlosedufaraujo@outlook.com
3. **Dashboards mostrarão** os 22 lotes e 44 despesas
4. **Sistema estará** 100% operacional

---

**Precisa de ajuda?** Os arquivos JSON estão em `/api/data/`

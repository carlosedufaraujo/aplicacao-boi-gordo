# 📋 VARIÁVEIS DE AMBIENTE - CONFIGURAÇÃO COMPLETA VERCEL

**Dashboard:** https://vercel.com/carlosedufaraujo/aplicacao-boi-gordo/settings/environment-variables

---

## ✅ VARIÁVEIS JÁ CONFIGURADAS

1. **DATABASE_URL** ✅
   - Você já adicionou!

---

## 🔴 VARIÁVEIS QUE FALTAM ADICIONAR

### 1. **SUPABASE_SERVICE_KEY** (OBRIGATÓRIA)

**Onde encontrar:**
1. Acesse: https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/settings/api
2. Na seção **"Project API keys"**
3. Copie a chave **"service_role"** (NÃO a "anon")
4. Ela é longa e começa com: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**No Vercel:**
```
Name: SUPABASE_SERVICE_KEY
Value: [COLE A SERVICE_ROLE KEY AQUI]
Environment: ✅ Production ✅ Preview ✅ Development
```

---

### 2. **JWT_SECRET** (OBRIGATÓRIA)

**Como gerar:**
Use uma das opções abaixo para gerar uma string segura:

**Opção A - Use este valor gerado:**
```
JWT_SECRET = a7f3b8c9d2e1f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9
```

**Opção B - Gere o seu próprio:**
```bash
# No terminal:
openssl rand -hex 64

# Ou use Node.js:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**No Vercel:**
```
Name: JWT_SECRET
Value: [COLE O VALOR GERADO]
Environment: ✅ Production ✅ Preview ✅ Development
```

---

### 3. **SUPABASE_URL** (Verificar se existe)

```
Name: SUPABASE_URL
Value: https://vffxtvuqhlhcbbyqmynz.supabase.co
Environment: ✅ Production ✅ Preview ✅ Development
```

---

### 4. **SUPABASE_ANON_KEY** (Verificar se existe)

**Onde encontrar:**
- Mesma página do Supabase (settings/api)
- Copie a chave **"anon"** (public)
- É diferente da service_role!

```
Name: SUPABASE_ANON_KEY
Value: [COLE A ANON KEY]
Environment: ✅ Production ✅ Preview ✅ Development
```

---

## 📊 LISTA COMPLETA DE VARIÁVEIS NECESSÁRIAS

### Backend (Obrigatórias):
- [x] DATABASE_URL 
- [ ] SUPABASE_SERVICE_KEY
- [ ] JWT_SECRET
- [ ] SUPABASE_URL
- [ ] SUPABASE_ANON_KEY
- [ ] NODE_ENV = production

### Frontend (Obrigatórias):
- [ ] VITE_API_URL = https://aplicacao-boi-gordo.vercel.app/api/v1
- [ ] VITE_SUPABASE_URL = https://vffxtvuqhlhcbbyqmynz.supabase.co
- [ ] VITE_SUPABASE_ANON_KEY = [mesma anon key do backend]

---

## 🚀 APÓS ADICIONAR TODAS AS VARIÁVEIS

1. **Clique em "Save"** no Vercel Dashboard
2. **Faça Redeploy:**
   - Vá em "Deployments"
   - Clique nos 3 pontos do último deploy
   - Selecione "Redeploy"
   - Desmarque "Use existing Build Cache"

3. **Teste:**
```bash
# Aguarde 2 minutos e teste:
curl https://aplicacao-boi-gordo.vercel.app/api/v1/users
```

---

## ⚠️ DICAS IMPORTANTES

1. **Service Key vs Anon Key:**
   - `service_role`: Acesso total (backend)
   - `anon`: Acesso público limitado (frontend)
   - NUNCA exponha a service_role no frontend!

2. **JWT_SECRET:**
   - Deve ser uma string aleatória longa
   - Não use senhas simples
   - Guarde em local seguro

3. **Verificação:**
   - Após configurar, use o script:
   ```bash
   ./fix-users-route.sh
   ```

---

**Última atualização:** 03/10/2025

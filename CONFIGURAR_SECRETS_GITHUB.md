# 🔐 Como Configurar Secrets no GitHub

## 📍 URL Direta

Acesse: https://github.com/carlosedufaraujo/aplicacao-boi-gordo/settings/secrets/actions

## 📋 Secrets Necessários

### 1. CLOUDFLARE_API_TOKEN

**Como obter:**
1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em **"Create Token"**
3. Use o template **"Edit Cloudflare Workers"** ou crie custom:
   - **Permissions:**
     - Account → Cloudflare Pages → Edit
     - Account → Workers Scripts → Edit
   - **Account Resources:** Selecione sua conta
4. Clique em **"Continue to summary"** → **"Create Token"**
5. **Copie o token** (você só verá ele uma vez!)

**Valor:** Cole o token completo

---

### 2. CLOUDFLARE_ACCOUNT_ID

**Como obter:**
1. Acesse: https://dash.cloudflare.com/
2. Selecione sua conta
3. No sidebar direito, você verá **"Account ID"**
4. Copie o ID

**Valor:** `15c6fda1ba5327224c2c2737a34b208d` (já identificado)

---

### 3. VITE_API_URL

**Valor:** `https://aplicacao-boi-gordo.pages.dev/api/v1`

---

### 4. VITE_BACKEND_URL

**Valor:** `https://aplicacao-boi-gordo.pages.dev`

---

### 5. VITE_SUPABASE_URL

**Valor:** `https://vffxtvuqhlhcbbyqmynz.supabase.co`

---

### 6. VITE_SUPABASE_ANON_KEY

**Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTQ2MDcsImV4cCI6MjA3MTI5MDYwN30.MH5C-ZmQ1udG5Obre4_furNk68NNeUohZTdrKtfagmc`

---

## 🔧 Como Adicionar Secrets

1. Acesse: https://github.com/carlosedufaraujo/aplicacao-boi-gordo/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Digite o **Name** (ex: `CLOUDFLARE_API_TOKEN`)
4. Cole o **Value**
5. Clique em **"Add secret"**
6. Repita para cada secret acima

---

## ✅ Verificar se Funcionou

Após adicionar os secrets:

1. Faça um commit e push:
   ```bash
   git add .
   git commit -m "chore: adicionar workflow de deploy"
   git push origin main
   ```

2. Verifique o workflow em:
   https://github.com/carlosedufaraujo/aplicacao-boi-gordo/actions

3. O deploy deve iniciar automaticamente!

---

## 🆘 Troubleshooting

### Erro: "Invalid API Token"
- Verifique se o token está correto
- Verifique se o token tem as permissões corretas
- Tente criar um novo token

### Erro: "Invalid Account ID"
- Verifique se o Account ID está correto
- Certifique-se de que está usando o ID da conta correta

### Deploy não inicia
- Verifique se o workflow está na branch `main`
- Verifique se todos os secrets estão configurados
- Veja os logs em: https://github.com/carlosedufaraujo/aplicacao-boi-gordo/actions


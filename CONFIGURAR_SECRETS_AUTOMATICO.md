# 🔐 Configurar Secrets do GitHub Automaticamente

## 🚀 Método Automático (Recomendado)

### Opção 1: Usar GitHub CLI (se configurado)

```bash
# Se você já tem GitHub CLI configurado
./configurar-secrets-automatico.sh
```

### Opção 2: Usar Token Manualmente

```bash
# 1. Obter token do GitHub
# Acesse: https://github.com/settings/tokens
# Crie um token com permissão: repo (Full control)

# 2. Configurar token
export GITHUB_TOKEN=seu_token_aqui

# 3. (Opcional) Configurar Cloudflare token
export CLOUDFLARE_API_TOKEN=seu_token_cloudflare

# 4. Executar script
node scripts/configurar-secrets-github.mjs
```

### Opção 3: Script Interativo

```bash
./configurar-secrets-automatico.sh
```

O script vai perguntar pelos tokens se não estiverem configurados.

---

## 📋 Secrets que serão configurados

1. ✅ `CLOUDFLARE_ACCOUNT_ID` = `15c6fda1ba5327224c2c2737a34b208d`
2. ⚠️  `CLOUDFLARE_API_TOKEN` = (fornecido por você)
3. ✅ `VITE_API_URL` = `https://aplicacao-boi-gordo.pages.dev/api/v1`
4. ✅ `VITE_BACKEND_URL` = `https://aplicacao-boi-gordo.pages.dev`
5. ✅ `VITE_SUPABASE_URL` = `https://vffxtvuqhlhcbbyqmynz.supabase.co`
6. ✅ `VITE_SUPABASE_ANON_KEY` = (já configurado)

---

## 🔑 Como obter tokens

### GitHub Token
1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Configure:
   - **Note:** `GitHub Actions Secrets`
   - **Expiration:** No expiration (ou 1 year)
   - **Scopes:** ✅ `repo` (Full control of private repositories)
4. Clique em **"Generate token"**
5. **Copie o token** (você só verá ele uma vez!)

### Cloudflare Token
1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em **"Create Token"**
3. Use o template **"Edit Cloudflare Workers"**:
   - **Permissions:**
     - Account → Cloudflare Pages → Edit
     - Account → Workers Scripts → Edit
   - **Account Resources:** Selecione sua conta
4. Clique em **"Continue to summary"** → **"Create Token"**
5. **Copie o token**

---

## ✅ Verificar se funcionou

Após executar o script:

1. Acesse: https://github.com/carlosedufaraujo/aplicacao-boi-gordo/settings/secrets/actions
2. Verifique se todos os secrets aparecem na lista
3. Faça commit e push:
   ```bash
   git add .
   git commit -m "chore: adicionar workflow de deploy automático"
   git push origin main
   ```
4. Verifique o deploy em: https://github.com/carlosedufaraujo/aplicacao-boi-gordo/actions

---

## 🆘 Troubleshooting

### Erro: "GITHUB_TOKEN não encontrado"
- Configure o token: `export GITHUB_TOKEN=seu_token`
- Ou use o script interativo: `./configurar-secrets-automatico.sh`

### Erro: "Permission denied"
- Verifique se o token tem permissão `repo`
- Tente criar um novo token

### Erro: "Repository not found"
- Verifique se o repositório existe
- Verifique se o token tem acesso ao repositório

---

**Última atualização:** 02/12/2025


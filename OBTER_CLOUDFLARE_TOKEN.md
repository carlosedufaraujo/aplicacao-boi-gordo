# 🔑 Como Obter e Configurar CLOUDFLARE_API_TOKEN

## ⚠️ Importante

O token do Cloudflare **precisa ser criado manualmente** no dashboard por questões de segurança. Não é possível criar tokens via API.

## 📋 Passo a Passo

### 1. Criar Token no Cloudflare

1. **Acesse:** https://dash.cloudflare.com/profile/api-tokens
2. **Clique em:** "Create Token"
3. **Use o template:** "Edit Cloudflare Workers" ou configure manualmente:
   - **Permissions:**
     - ✅ Account → Cloudflare Pages → Edit
     - ✅ Account → Workers Scripts → Edit
   - **Account Resources:** Selecione sua conta
   - **Zone Resources:** Deixe em branco (não necessário para Pages)
4. **Clique em:** "Continue to summary" → "Create Token"
5. **COPIE O TOKEN** (você só verá ele uma vez!)

### 2. Configurar no GitHub Automaticamente

Depois de obter o token, execute:

```bash
export CLOUDFLARE_API_TOKEN=seu_token_aqui
export GITHUB_TOKEN=seu_token_github_aqui
node scripts/configurar-cloudflare-token-github.mjs
```

Ou use o script interativo:

```bash
export GITHUB_TOKEN=seu_token_github_aqui
export CLOUDFLARE_API_TOKEN=seu_token_aqui
node scripts/configurar-cloudflare-token-github.mjs
```

### 3. Verificar

Após configurar, verifique em:
https://github.com/carlosedufaraujo/aplicacao-boi-gordo/settings/secrets/actions

O secret `CLOUDFLARE_API_TOKEN` deve aparecer na lista.

---

**Nota:** O token OAuth do wrangler não pode ser usado diretamente no GitHub Actions. Você precisa criar um token de API específico.


# 🚀 Próximos Passos - Guia Completo

## ✅ Status Atual

- ✅ Aplicação funcionando em: https://aplicacao-boi-gordo.pages.dev/
- ✅ Frontend deployado
- ✅ Backend (Pages Functions) funcionando
- ✅ Banco de dados conectado
- ✅ CI/CD básico configurado

## 📋 Próximos Passos

### 1️⃣ Secret Key do Supabase (Acesso Completo)

**Objetivo:** Criar uma secret key para bypass de RLS e acesso completo ao banco.

#### Passo a Passo:

1. **Acesse o Dashboard do Supabase:**
   - URL: https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz
   - Vá em **Settings** → **API** → **API Keys**

2. **Criar Nova Secret Key:**
   - Clique em **"Create new API Keys"**
   - Escolha **"Secret key"**
   - Copie a chave gerada (formato: `sb_secret_...`)

3. **Configurar no Cloudflare Pages:**
   ```bash
   # Via terminal (já autenticado)
   echo "sua_nova_secret_key_aqui" | wrangler pages secret put SUPABASE_SECRET_KEY --project-name=aplicacao-boi-gordo
   ```

4. **Ou via Dashboard:**
   - Acesse: https://dash.cloudflare.com/
   - Vá em **Pages** → **aplicacao-boi-gordo** → **Settings** → **Environment variables**
   - Adicione: `SUPABASE_SECRET_KEY` = `sua_nova_secret_key`

5. **Fazer Redeploy:**
   ```bash
   npm run build
   wrangler pages deploy dist --project-name=aplicacao-boi-gordo
   ```

**Benefícios:**
- ✅ Acesso completo ao banco (bypass RLS)
- ✅ Operações administrativas
- ✅ Melhor performance

---

### 2️⃣ Domínio Personalizado

**Objetivo:** Configurar um domínio personalizado (ex: `app.boigordo.com.br`)

#### Passo a Passo:

1. **No Cloudflare Dashboard:**
   - Acesse: https://dash.cloudflare.com/
   - Vá em **Pages** → **aplicacao-boi-gordo** → **Custom domains**
   - Clique em **"Set up a custom domain"**

2. **Adicionar Domínio:**
   - Digite seu domínio (ex: `app.boigordo.com.br`)
   - O Cloudflare vai verificar automaticamente

3. **Configurar DNS:**
   - Se o domínio já está no Cloudflare:
     - Adicione um registro CNAME:
       - **Name:** `app` (ou `@` para domínio raiz)
       - **Target:** `aplicacao-boi-gordo.pages.dev`
       - **Proxy:** ✅ Proxied (laranja)
   
   - Se o domínio está em outro provedor:
     - Adicione um registro CNAME apontando para `aplicacao-boi-gordo.pages.dev`
     - Aguarde propagação DNS (pode levar até 24h)

4. **SSL Automático:**
   - O Cloudflare configura SSL automaticamente
   - Aguarde alguns minutos para ativação

**Benefícios:**
- ✅ URL personalizada e profissional
- ✅ SSL/HTTPS automático
- ✅ Melhor SEO e branding

---

### 3️⃣ CI/CD Automático via GitHub Actions

**Objetivo:** Deploy automático a cada push na branch `main`

#### Passo a Passo:

1. **Obter Token do Cloudflare:**
   - Acesse: https://dash.cloudflare.com/profile/api-tokens
   - Clique em **"Create Token"**
   - Use o template **"Edit Cloudflare Workers"**:
     - **Permissions:**
       - Account → Cloudflare Pages → Edit
       - Account → Workers Scripts → Edit
     - **Account Resources:** Selecione sua conta
   - Clique em **"Continue to summary"** → **"Create Token"**
   - **Copie o token** (você só verá ele uma vez!)

2. **Obter Account ID:**
   - Acesse: https://dash.cloudflare.com/
   - Selecione sua conta
   - No sidebar direito, copie o **"Account ID"**

3. **Configurar Secrets no GitHub:**
   - Acesse: https://github.com/carlosedufaraujo/aplicacao-boi-gordo/settings/secrets/actions
   - Clique em **"New repository secret"**
   - Adicione os seguintes secrets:
     - `CLOUDFLARE_API_TOKEN` = token criado no passo 1
     - `CLOUDFLARE_ACCOUNT_ID` = Account ID do passo 2
     - `VITE_API_URL` = `https://aplicacao-boi-gordo.pages.dev/api/v1`
     - `VITE_BACKEND_URL` = `https://aplicacao-boi-gordo.pages.dev`
     - `VITE_SUPABASE_URL` = `https://vffxtvuqhlhcbbyqmynz.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = sua anon key do Supabase

4. **Workflow já Criado:**
   - O arquivo `.github/workflows/deploy-cloudflare.yml` já foi criado
   - Ele fará deploy automático a cada push na branch `main`

5. **Testar:**
   ```bash
   # Fazer uma mudança pequena
   echo "# Teste CI/CD" >> README.md
   git add .
   git commit -m "test: CI/CD automático"
   git push origin main
   ```
   - O deploy deve iniciar automaticamente
   - Veja o progresso em: https://github.com/carlosedufaraujo/aplicacao-boi-gordo/actions

**Benefícios:**
- ✅ Deploy automático a cada push
- ✅ Histórico de deploys no GitHub
- ✅ Rollback fácil
- ✅ Preview deployments para PRs

---

## 🔧 Comandos Úteis

### Verificar Status do Deploy
```bash
wrangler pages deployment list aplicacao-boi-gordo
```

### Ver Variáveis de Ambiente
```bash
wrangler pages secret list --project-name=aplicacao-boi-gordo
```

### Fazer Deploy Manual
```bash
npm run build
wrangler pages deploy dist --project-name=aplicacao-boi-gordo
```

### Ver Logs
```bash
wrangler pages deployment tail aplicacao-boi-gordo
```

---

## 📊 Checklist

- [ ] Secret Key do Supabase criada e configurada
- [ ] Domínio personalizado configurado (opcional)
- [ ] CI/CD automático configurado e testado
- [ ] Secrets do GitHub configurados
- [ ] Primeiro deploy automático realizado com sucesso

---

## 🆘 Suporte

Se precisar de ajuda em qualquer passo:
1. Verifique os logs do Cloudflare Pages
2. Verifique os logs do GitHub Actions
3. Teste localmente antes de fazer deploy

---

**Última atualização:** 02/12/2025


# 🔑 Como Criar Secret Key no Supabase

## 🎯 Objetivo

Criar uma secret key (`sb_secret_...`) para acesso completo ao banco de dados, permitindo bypass de Row Level Security (RLS).

## 📋 Passo a Passo

### 1. Acessar o Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz
2. Faça login se necessário

### 2. Navegar para API Keys

1. No menu lateral, clique em **Settings** (⚙️)
2. Clique em **API** no submenu
3. Role até a seção **API Keys**

### 3. Criar Nova Secret Key

1. Na seção **API Keys**, procure por **"Create new API Keys"** ou botão similar
2. Clique para criar uma nova chave
3. Escolha o tipo **"Secret key"** (não publishable)
4. Dê um nome descritivo (ex: "Cloudflare Pages Backend")
5. Clique em **"Create"** ou **"Generate"**

### 4. Copiar a Chave

1. **IMPORTANTE:** Copie a chave imediatamente
2. Ela será mostrada apenas uma vez!
3. Formato esperado: `sb_secret_...` (começa com `sb_secret_`)

### 5. Configurar no Cloudflare Pages

**Opção A - Via Terminal:**
```bash
echo "sua_secret_key_aqui" | wrangler pages secret put SUPABASE_SECRET_KEY --project-name=aplicacao-boi-gordo
```

**Opção B - Via Dashboard:**
1. Acesse: https://dash.cloudflare.com/
2. Vá em **Pages** → **aplicacao-boi-gordo** → **Settings** → **Environment variables**
3. Clique em **"Add variable"**
4. **Name:** `SUPABASE_SECRET_KEY`
5. **Value:** Cole a secret key criada
6. Clique em **"Save"**

### 6. Fazer Redeploy

```bash
npm run build
wrangler pages deploy dist --project-name=aplicacao-boi-gordo
```

Ou aguarde o próximo deploy automático via GitHub Actions.

## ✅ Verificar se Funcionou

1. Aguarde 1-2 minutos após o deploy
2. Acesse: https://aplicacao-boi-gordo.pages.dev/api/v1/debug
3. Verifique se `hasSecretKey: true` e `secretPrefix: "sb_secret_"`

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- A secret key dá acesso COMPLETO ao banco de dados
- Nunca compartilhe ou exponha essa chave
- Não adicione em código público
- Use apenas em ambientes seguros (backend/server)

## 📝 Notas

- A secret key permite bypass de RLS
- Útil para operações administrativas
- Melhora performance em algumas operações
- Não é necessária para operações básicas (anon key funciona)

## 🆘 Problemas Comuns

### "Unregistered API key"
- Verifique se a chave está no formato correto (`sb_secret_...`)
- Verifique se a chave foi criada no projeto correto
- Tente criar uma nova chave

### Chave não aparece no dashboard
- Algumas chaves podem estar ocultas por segurança
- Verifique se você tem permissões de admin no projeto
- Tente criar uma nova chave

---

**Última atualização:** 02/12/2025


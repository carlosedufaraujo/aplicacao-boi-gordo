# 🎯 Guia Passo a Passo - Deploy no Cloudflare

## 📋 Passo 1: Verificar Pré-requisitos

### 1.1 Verificar se tem conta Cloudflare
- ✅ Se não tem: Crie em https://dash.cloudflare.com/sign-up (grátis)

### 1.2 Verificar Wrangler instalado
Execute no terminal:
```bash
wrangler --version
```

Se não estiver instalado:
```bash
npm install -g wrangler
```

---

## 🔐 Passo 2: Autenticar no Cloudflare

### 2.1 Executar Login
No terminal, execute:
```bash
wrangler login
```

### 2.2 O que vai acontecer:
1. ✅ Vai abrir o navegador automaticamente
2. ✅ Você vai ver uma página do Cloudflare pedindo autorização
3. ✅ Clique em **"Allow"** ou **"Permitir"**
4. ✅ Volte ao terminal - deve mostrar "Successfully logged in"

### 2.3 Verificar se funcionou:
```bash
wrangler whoami
```

Deve mostrar seu email do Cloudflare.

**❌ Problema?** 
- Se não abrir o navegador, copie o link que aparece no terminal
- Ou use token de API (veja `SETUP_CLOUDFLARE_TOKEN.md`)

---

## 📦 Passo 3: Preparar Build

### 3.1 Fazer Build do Projeto
```bash
npm run build
```

### 3.2 Verificar se funcionou:
```bash
ls -la dist
```

Deve mostrar arquivos como `index.html`, pasta `assets/`, etc.

**⏱️ Tempo:** ~30 segundos a 2 minutos

---

## 🚀 Passo 4: Fazer Deploy

### Opção A: Script Automático (Mais Fácil) ⭐

```bash
# Tornar executável (só precisa fazer uma vez)
chmod +x deploy-cloudflare.sh

# Executar deploy
./deploy-cloudflare.sh
```

O script vai:
- ✅ Verificar autenticação
- ✅ Fazer build (se necessário)
- ✅ Fazer deploy
- ✅ Mostrar URL da aplicação

### Opção B: Deploy Manual

```bash
# Criar projeto (só na primeira vez)
wrangler pages project create aplicacao-boi-gordo

# Fazer deploy
wrangler pages deploy dist --project-name=aplicacao-boi-gordo
```

**⏱️ Tempo:** ~1-3 minutos

---

## ⚙️ Passo 5: Configurar Variáveis de Ambiente

### 5.1 Acessar Dashboard
1. Abra: https://dash.cloudflare.com/pages
2. Clique no projeto **"aplicacao-boi-gordo"**

### 5.2 Adicionar Variáveis
1. Vá em **Settings** (no menu lateral)
2. Clique em **Environment variables**
3. Clique em **Add variable**

### 5.3 Adicionar cada variável:

#### Variável 1:
- **Variable name:** `VITE_API_URL`
- **Value:** `https://seu-backend.railway.app/api/v1` (ou URL do seu backend)
- **Environment:** Production ✅

#### Variável 2:
- **Variable name:** `VITE_BACKEND_URL`
- **Value:** `https://seu-backend.railway.app` (ou URL do seu backend)
- **Environment:** Production ✅

#### Variável 3:
- **Variable name:** `VITE_SUPABASE_URL`
- **Value:** `https://vffxtvuqhlhcbbyqmynz.supabase.co`
- **Environment:** Production ✅

#### Variável 4:
- **Variable name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** Sua chave anon do Supabase
- **Environment:** Production ✅

### 5.4 Salvar
- Clique em **Save**
- Vá em **Deployments**
- Clique nos **3 pontos** do último deployment
- Clique em **Retry deployment** (para aplicar as variáveis)

---

## ✅ Passo 6: Verificar se Funcionou

### 6.1 Acessar Aplicação
Abra no navegador:
```
https://aplicacao-boi-gordo.pages.dev
```

### 6.2 Testar
- ✅ Página carrega?
- ✅ Login funciona?
- ✅ API conecta?

### 6.3 Ver Logs (se houver erro)
1. Cloudflare Dashboard → Pages → Seu projeto
2. **Functions** → **Logs**
3. Veja se há erros

---

## 🐛 Problemas Comuns

### ❌ "Failed to fetch auth token"
**Solução:**
```bash
wrangler logout
wrangler login
```

### ❌ "Project not found"
**Solução:**
```bash
wrangler pages project create aplicacao-boi-gordo
```

### ❌ "Build failed"
**Solução:**
```bash
# Limpar e rebuildar
rm -rf dist node_modules/.vite
npm run build
```

### ❌ "CORS error"
**Solução:**
- Verifique se `_headers` está na pasta `dist`
- Verifique variáveis de ambiente no Cloudflare

### ❌ "API não conecta"
**Solução:**
- Verifique se `VITE_API_URL` está configurada corretamente
- Verifique se o backend está rodando e acessível
- Veja logs no Cloudflare Dashboard

---

## 📞 Próximos Passos

1. ✅ Deploy concluído
2. ✅ Variáveis configuradas
3. ✅ Aplicação funcionando

**Agora você pode:**
- Configurar domínio customizado (opcional)
- Configurar CI/CD automático (deploy a cada push)
- Monitorar performance no Cloudflare Dashboard

---

## 🎉 Pronto!

Sua aplicação está no ar em:
**https://aplicacao-boi-gordo.pages.dev**

Precisa de ajuda? Me avise qual passo está travado!


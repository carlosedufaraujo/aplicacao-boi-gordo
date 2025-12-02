# 🔑 Como Encontrar a Secret Key do Supabase

## 📍 Passo a Passo Detalhado

### Passo 1: Acessar o Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **vffxtvuqhlhcbbyqmynz**

### Passo 2: Ir para Configurações de API

**Opção A: Via Menu Lateral**
1. No menu lateral esquerdo, clique em **⚙️ Settings** (Configurações)
2. Clique em **API**

**Opção B: Link Direto**
Acesse diretamente:
```
https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/settings/api
```

### Passo 3: Encontrar as Chaves

Na página de API Settings, você verá uma seção chamada:

**"Project API keys"** ou **"Chaves da API do Projeto"**

Você verá duas chaves:

#### 1. 🔓 **Publishable key** (Chave Pública)
- Esta é a chave que você já tem como `VITE_SUPABASE_ANON_KEY`
- Pode ser usada no frontend (pública)
- Começa geralmente com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 2. 🔐 **Secret key** (Chave Secreta) ⭐ **ESTA É A QUE VOCÊ PRECISA!**
- Esta é a chave privada para backend
- **NÃO** deve ser exposta no frontend
- Tem permissões completas no banco de dados
- Geralmente começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (similar, mas diferente)
- Pode ter um botão **👁️ "Reveal"** ou **"Mostrar"** para revelar

### Passo 4: Copiar a Secret Key

1. Clique no botão **👁️ "Reveal"** ou **"Mostrar"** ao lado da Secret key
2. A chave será revelada
3. Clique no ícone de **📋 copiar** ao lado da chave
4. **COPIE A CHAVE COMPLETA** (é longa!)

## ⚠️ Importante

- ✅ A **Secret key** é diferente da **Publishable key**
- ✅ A Secret key tem permissões completas (pode ler/escrever tudo)
- ✅ **NUNCA** exponha a Secret key no frontend
- ✅ Use apenas no Cloudflare como variável de ambiente

## 📋 Onde Adicionar no Cloudflare

1. Acesse: https://dash.cloudflare.com/pages
2. Clique no projeto **aplicacao-boi-gordo**
3. Vá em **Settings** → **Environment variables**
4. Clique em **Add variable**
5. Configure:
   - **Variable name:** `SUPABASE_SECRET_KEY`
   - **Value:** [cole a Secret key que você copiou]
   - ✅ Marque **Production**
6. Clique em **Save**

## 🔍 Se Não Encontrar

Se você não ver a seção "Project API keys", pode ser que:

1. **As chaves estejam em outro lugar:**
   - Tente: Settings → General → API Settings
   - Ou: Project Settings → API

2. **Você precisa de permissões:**
   - Certifique-se de que está logado como owner/admin do projeto

3. **As chaves foram desabilitadas:**
   - Veja se há uma mensagem sobre chaves legacy desabilitadas
   - Nesse caso, você precisa reabilitar ou criar novas chaves

## 💡 Dica

A Secret key geralmente é mais longa que a Publishable key e tem permissões administrativas completas.

---

**Depois de copiar, adicione no Cloudflare como `SUPABASE_SECRET_KEY`!** 🔐


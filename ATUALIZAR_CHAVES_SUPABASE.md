# 🔑 Atualizar Chaves do Supabase

## ⚠️ Problema Identificado

O Supabase desabilitou as chaves legacy (anon, service_role) em 28/08/2025.

Agora você precisa usar as **novas chaves**:
- **Publishable Key** (substitui anon key)
- **Secret Key** (substitui service_role key)

## 📋 Como Obter as Novas Chaves

1. Acesse: https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/settings/api

2. Role até **"Project API keys"**

3. Você verá duas chaves:
   - **Publishable key** (pública, pode usar no frontend)
   - **Secret key** (privada, só para backend)

4. **Copie ambas as chaves**

## 🔧 Adicionar no Cloudflare

No Cloudflare Dashboard → Pages → aplicacao-boi-gordo → Settings → Environment variables:

### 1. SUPABASE_PUBLISHABLE_KEY (Nova)
```
Nome: SUPABASE_PUBLISHABLE_KEY
Valor: [cole a publishable key]
Environment: Production ✅
```

### 2. SUPABASE_SECRET_KEY (Nova)
```
Nome: SUPABASE_SECRET_KEY
Valor: [cole a secret key]
Environment: Production ✅
```

### 3. Manter as antigas (para compatibilidade)
Você pode manter `SUPABASE_SERVICE_KEY` e `VITE_SUPABASE_ANON_KEY` também, o código vai usar as novas se disponíveis.

## 🔄 Depois de Adicionar

1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deployment
3. Clique em **Retry deployment**

## ✅ O Que Foi Atualizado

O código agora:
- ✅ Usa `SUPABASE_PUBLISHABLE_KEY` para autenticação
- ✅ Usa `SUPABASE_SECRET_KEY` para acesso ao banco
- ✅ Mantém compatibilidade com chaves antigas (fallback)

---

**Adicione as novas chaves e faça retry do deployment!** 🚀


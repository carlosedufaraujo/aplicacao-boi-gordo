# 🔐 Variáveis de Ambiente - Cloudflare Pages

## ✅ Variáveis Obrigatórias

Configure estas variáveis no Cloudflare Dashboard:

### 1. URL da API Backend
```
Nome: VITE_API_URL
Valor: https://seu-backend.railway.app/api/v1
```
**OU** se você ainda não tem backend deployado:
```
Valor: https://aplicacao-boi-gordo.pages.dev/api/v1
```
*(Isso vai usar o Pages Functions que criamos)*

### 2. URL do Backend (sem /api/v1)
```
Nome: VITE_BACKEND_URL
Valor: https://seu-backend.railway.app
```
**OU**:
```
Valor: https://aplicacao-boi-gordo.pages.dev
```

### 3. URL do Supabase
```
Nome: VITE_SUPABASE_URL
Valor: https://vffxtvuqhlhcbbyqmynz.supabase.co
```

### 4. Chave Anônima do Supabase
```
Nome: VITE_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI
```

## 📋 Como Adicionar no Cloudflare

1. Acesse: https://dash.cloudflare.com/pages
2. Clique no projeto **"aplicacao-boi-gordo"**
3. Vá em **Settings** → **Environment variables**
4. Clique em **Add variable**
5. Adicione cada variável acima
6. **IMPORTANTE:** Marque ✅ **Production**
7. Clique em **Save**

## ⚠️ Importante

- Todas as variáveis devem ter o prefixo `VITE_` (isso é obrigatório do Vite)
- Marque todas como **Production**
- Após adicionar, vá em **Deployments** → Clique nos **3 pontos** → **Retry deployment**

## 🔍 Verificar se Funcionou

Após configurar, acesse:
```
https://aplicacao-boi-gordo.pages.dev
```

Se aparecer erros no console do navegador (F12), verifique:
- Se todas as variáveis foram adicionadas
- Se os valores estão corretos (sem espaços extras)
- Se marcou como Production

## 💡 Dica

Se você ainda não tem backend deployado, use:
- `VITE_API_URL`: `https://aplicacao-boi-gordo.pages.dev/api/v1`
- `VITE_BACKEND_URL`: `https://aplicacao-boi-gordo.pages.dev`

Isso vai usar o Pages Functions que criamos (limitado, mas funciona para testes).


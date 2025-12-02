# 🔍 Verificar se as Variáveis Estão Configuradas Corretamente

## ⚠️ Problema: Supabase Rejeitando Chaves

Se você ainda vê o erro "Legacy API keys are disabled", significa que:

1. **As novas chaves não estão sendo usadas** OU
2. **As variáveis não foram aplicadas no deployment**

## ✅ Verificação Passo a Passo

### 1. Verificar Variáveis no Cloudflare

1. Acesse: https://dash.cloudflare.com/pages
2. Clique no projeto **aplicacao-boi-gordo**
3. Vá em **Settings** → **Environment variables**
4. Verifique se estas variáveis existem:

**OBRIGATÓRIAS:**
- ✅ `SUPABASE_PUBLISHABLE_KEY` (deve ter valor)
- ✅ `SUPABASE_SECRET_KEY` (deve ter valor)
- ✅ `VITE_SUPABASE_URL` (deve ter valor)
- ✅ `VITE_API_URL` (deve ter valor)

**OPCIONAIS (podem ajudar):**
- `SUPABASE_URL` (se diferente de VITE_SUPABASE_URL)
- `VITE_BACKEND_URL`
- `VITE_SUPABASE_ANON_KEY` (pode ser a mesma que PUBLISHABLE_KEY)

### 2. Verificar se Estão Marcadas como Production

- Todas devem ter ✅ **Production** marcado
- Se tiver Preview ou Development, marque também

### 3. IMPORTANTE: Fazer Retry do Deployment

**As variáveis só são aplicadas em novos deployments!**

1. Vá em **Deployments**
2. Clique nos **3 pontos** (⋯) do último deployment
3. Clique em **Retry deployment**
4. Aguarde 1-2 minutos

### 4. Verificar Logs

Após o retry, verifique os logs:

1. Vá em **Functions** → **Logs**
2. Veja se há erros sobre chaves não configuradas
3. Procure por mensagens como:
   - "SUPABASE_PUBLISHABLE_KEY não configurada"
   - "Chaves do Supabase não configuradas"

## 🔧 Se Ainda Não Funcionar

### Opção 1: Reabilitar Chaves Legacy no Supabase

Se você preferir usar as chaves antigas:

1. Acesse: https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/settings/api
2. Procure por "Legacy API keys"
3. Clique em "Re-enable" ou "Reabilitar"
4. Use `SUPABASE_SERVICE_KEY` e `VITE_SUPABASE_ANON_KEY` como antes

### Opção 2: Usar Backend Separado (Recomendado)

A melhor solução é usar um backend real (Railway, Render, etc.) em vez de Pages Functions:

1. Deploy backend no Railway
2. Configure `VITE_API_URL` apontando para o Railway
3. O backend Express completo vai funcionar perfeitamente

## 📝 Checklist de Troubleshooting

- [ ] Variáveis adicionadas no Cloudflare
- [ ] Todas marcadas como Production
- [ ] Retry do deployment feito
- [ ] Aguardou 1-2 minutos após retry
- [ ] Verificou logs no Cloudflare
- [ ] Testou endpoints diretamente

---

**Me diga o que aparece nos logs do Cloudflare após o retry!** 🔍


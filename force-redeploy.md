# 🚀 COMO FORÇAR REDEPLOY NO VERCEL

## OPÇÃO 1: Via Dashboard (RECOMENDADO)

1. Acesse: https://vercel.com/carlosedufaraujo/aplicacao-boi-gordo

2. Vá em **"Deployments"**

3. Clique nos **3 pontos** do último deployment

4. Selecione **"Redeploy"**

5. **IMPORTANTE:** 
   - ❌ **DESMARQUE** "Use existing Build Cache"
   - ✅ Isso força rebuild completo com as novas variáveis

6. Clique em **"Redeploy"**

---

## OPÇÃO 2: Fazer um commit vazio

```bash
git commit --allow-empty -m "Force redeploy with new env vars"
git push origin main
```

---

## VERIFICAÇÃO APÓS REDEPLOY

Aguarde 2-3 minutos e execute:

```bash
# Teste rápido
curl https://aplicacao-boi-gordo.vercel.app/api/v1/users

# Teste completo
./test-after-vars.sh
```

---

## ⚠️ IMPORTANTE

Se você regenerou as chaves do Supabase, certifique-se que:

1. **SUPABASE_SERVICE_KEY** = Nova service_role key
2. **SUPABASE_ANON_KEY** = Nova anon key  
3. **VITE_SUPABASE_ANON_KEY** = Mesma nova anon key

Todas devem ser as chaves **NOVAS** geradas após regenerar!

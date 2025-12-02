# ⚡ Deploy Rápido - 3 Passos

## 🎯 Execute estes comandos no terminal:

### Passo 1: Autenticar no Cloudflare
```bash
wrangler login
```
Isso vai abrir o navegador para você fazer login com sua conta Cloudflare.

### Passo 2: Executar Deploy Automático
```bash
./deploy-cloudflare.sh
```

### Passo 3: Configurar Variáveis de Ambiente

1. Acesse: https://dash.cloudflare.com/pages
2. Clique no projeto `aplicacao-boi-gordo`
3. Settings → Environment variables
4. Adicione:
   - `VITE_API_URL` = URL do seu backend
   - `VITE_BACKEND_URL` = URL do seu backend  
   - `VITE_SUPABASE_URL` = https://vffxtvuqhlhcbbyqmynz.supabase.co
   - `VITE_SUPABASE_ANON_KEY` = sua chave

## ✅ Pronto!

Sua aplicação estará em: `https://aplicacao-boi-gordo.pages.dev`

---

**Precisa de ajuda?** Leia `DEPLOY_AUTOMATICO.md` para mais detalhes.


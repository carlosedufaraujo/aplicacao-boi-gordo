# Configuração Cloudflare Pages

## 📋 Checklist de Deploy

### 1. Frontend (Cloudflare Pages)

1. **Conectar repositório no Cloudflare Dashboard**
   - Vá em Pages → Create a project
   - Conecte seu repositório GitHub/GitLab
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (raiz do projeto)

2. **Variáveis de Ambiente no Cloudflare Pages**
   ```
   VITE_API_URL=https://seu-worker.workers.dev/api/v1
   VITE_BACKEND_URL=https://seu-worker.workers.dev
   VITE_SUPABASE_URL=https://vffxtvuqhlhcbbyqmynz.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_aqui
   NODE_VERSION=18
   ```

### 2. Backend (Cloudflare Workers)

1. **Instalar Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Fazer login no Cloudflare**
   ```bash
   wrangler login
   ```

3. **Configurar Secrets (variáveis sensíveis)**
   ```bash
   wrangler secret put DATABASE_URL
   wrangler secret put JWT_SECRET
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_KEY
   ```

4. **Deploy do Worker**
   ```bash
   wrangler deploy
   ```

### 3. Configuração de Domínio

1. **No Cloudflare Dashboard:**
   - Workers → Seu Worker → Settings → Triggers
   - Adicione um Custom Domain ou Route

2. **Exemplo de Route:**
   ```
   api.seu-dominio.com/*
   ```

### 4. CORS Configuration

O backend já está configurado para aceitar requisições do frontend.

## 🔧 Comandos Úteis

```bash
# Deploy frontend (via Git push ou manual)
git push origin main

# Deploy backend
cd backend
wrangler deploy

# Ver logs do Worker
wrangler tail

# Testar localmente
wrangler dev
```

## 📝 Notas Importantes

1. **Banco de Dados**: O Supabase já está configurado e funcionando
2. **Autenticação**: JWT está configurado
3. **CORS**: Já configurado para aceitar requisições do frontend
4. **Limites**: Cloudflare Workers tem limites de CPU (50ms no free tier)


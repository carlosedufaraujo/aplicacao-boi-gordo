# 🚀 Deploy Automático no Cloudflare

## ⚡ Método Rápido

### 1. Configurar Autenticação

**Opção A: Login Interativo (Mais Fácil)**
```bash
wrangler login
```
Isso vai abrir o navegador para você fazer login.

**Opção B: Token de API**
```bash
# Criar token em: https://dash.cloudflare.com/profile/api-tokens
export CLOUDFLARE_API_TOKEN=seu_token_aqui
```

### 2. Executar Deploy

```bash
# Tornar script executável (só uma vez)
chmod +x deploy-cloudflare.sh

# Executar deploy
./deploy-cloudflare.sh
```

O script vai:
- ✅ Verificar autenticação
- ✅ Fazer build do projeto
- ✅ Fazer deploy para Cloudflare Pages
- ✅ Mostrar URL da aplicação

### 3. Configurar Variáveis de Ambiente

Após o deploy, configure no Cloudflare Dashboard:

1. Acesse: https://dash.cloudflare.com/pages
2. Clique no projeto `aplicacao-boi-gordo`
3. Vá em **Settings** → **Environment variables**
4. Adicione:

```
VITE_API_URL=https://seu-backend.railway.app/api/v1
VITE_BACKEND_URL=https://seu-backend.railway.app
VITE_SUPABASE_URL=https://vffxtvuqhlhcbbyqmynz.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

5. Clique em **Save**
6. Vá em **Deployments** → Clique nos 3 pontos → **Retry deployment**

## 📝 Deploy Manual

Se preferir fazer manualmente:

```bash
# 1. Build
npm run build

# 2. Deploy
wrangler pages deploy dist --project-name=aplicacao-boi-gordo

# 3. Ou criar projeto primeiro
wrangler pages project create aplicacao-boi-gordo
wrangler pages deploy dist --project-name=aplicacao-boi-gordo
```

## 🔍 Verificar Deploy

```bash
# Listar projetos
wrangler pages project list

# Ver deployments
wrangler pages deployment list --project-name=aplicacao-boi-gordo
```

## 🌐 URLs

Após o deploy, sua aplicação estará em:
- **Produção**: `https://aplicacao-boi-gordo.pages.dev`
- **Preview**: URLs geradas automaticamente para cada commit

## 🐛 Troubleshooting

### Erro: "Failed to fetch auth token"
```bash
# Refazer login
wrangler logout
wrangler login
```

### Erro: "Project not found"
```bash
# Criar projeto primeiro
wrangler pages project create aplicacao-boi-gordo
```

### Erro: "Build failed"
```bash
# Testar build localmente primeiro
npm run build
ls -la dist
```

## ✅ Checklist

- [ ] Wrangler instalado (`wrangler --version`)
- [ ] Autenticado (`wrangler whoami`)
- [ ] Build funcionando (`npm run build`)
- [ ] Deploy executado (`./deploy-cloudflare.sh`)
- [ ] Variáveis de ambiente configuradas
- [ ] Aplicação funcionando no ar

---

**Pronto!** Sua aplicação está no Cloudflare! 🎉


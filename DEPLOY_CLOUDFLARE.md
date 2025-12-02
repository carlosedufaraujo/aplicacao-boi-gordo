# 🚀 Guia Completo de Deploy no Cloudflare

Este guia vai te ajudar a publicar sua aplicação completa (frontend + backend) no Cloudflare Pages.

## 📋 Pré-requisitos

1. Conta no Cloudflare (gratuita)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. Node.js instalado localmente (para testes)

## 🎯 Estrutura da Solução

- **Frontend**: Cloudflare Pages (build do Vite)
- **Backend**: Cloudflare Pages Functions (serverless)
- **Banco de Dados**: Supabase (já configurado)

## 📦 Passo 1: Preparar o Repositório

1. Certifique-se de que todos os arquivos estão commitados:
```bash
git add .
git commit -m "Preparar para deploy Cloudflare"
git push
```

## 🌐 Passo 2: Configurar Cloudflare Pages

### 2.1 Criar Projeto no Cloudflare

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **Pages** → **Create a project**
3. Conecte seu repositório Git
4. Configure o projeto:
   - **Project name**: `aplicacao-boi-gordo`
   - **Framework preset**: **Vite**
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (raiz)

### 2.2 Configurar Variáveis de Ambiente

No Cloudflare Pages Dashboard, vá em **Settings** → **Environment variables** e adicione:

#### Production:
```
VITE_API_URL=https://seu-projeto.pages.dev/api/v1
VITE_BACKEND_URL=https://seu-projeto.pages.dev
VITE_SUPABASE_URL=https://vffxtvuqhlhcbbyqmynz.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
NODE_VERSION=18
```

#### Secrets (variáveis sensíveis):
No Cloudflare Dashboard → Pages → Settings → Environment variables → **Add variable** → **Encrypt**

Adicione como **secrets**:
```
DATABASE_URL=postgresql://...
JWT_SECRET=seu_jwt_secret_aqui
SUPABASE_URL=https://vffxtvuqhlhcbbyqmynz.supabase.co
SUPABASE_SERVICE_KEY=sua_service_key_aqui
SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## 🔧 Passo 3: Configurar Build

O Cloudflare Pages vai:
1. Instalar dependências (`npm install`)
2. Executar build (`npm run build`)
3. Servir arquivos da pasta `dist`
4. Processar rotas `/api/*` através de Pages Functions

## 📝 Passo 4: Estrutura de Arquivos

Certifique-se de que os seguintes arquivos existem:

```
/
├── functions/
│   └── api/
│       └── [[path]].ts    # Handler para todas as rotas /api/*
├── _headers                # Headers de segurança
├── _redirects              # Redirects para SPA
├── vite.config.ts          # Config do Vite
├── package.json            # Dependências
└── dist/                   # Build output (gerado)
```

## 🚀 Passo 5: Deploy

### Opção A: Deploy Automático (Recomendado)

1. Faça push para a branch `main`:
```bash
git push origin main
```

2. O Cloudflare Pages vai detectar automaticamente e fazer o deploy

3. Acompanhe o progresso no Dashboard do Cloudflare

### Opção B: Deploy Manual via Wrangler CLI

1. Instale o Wrangler:
```bash
npm install -g wrangler
```

2. Faça login:
```bash
wrangler login
```

3. Configure o projeto:
```bash
wrangler pages project create aplicacao-boi-gordo
```

4. Faça o deploy:
```bash
npm run build
wrangler pages deploy dist
```

## 🔍 Passo 6: Verificar Deploy

Após o deploy, você terá uma URL como:
- `https://aplicacao-boi-gordo.pages.dev`

Teste os endpoints:
- Frontend: `https://aplicacao-boi-gordo.pages.dev`
- Health: `https://aplicacao-boi-gordo.pages.dev/api/v1/health`
- Login: `https://aplicacao-boi-gordo.pages.dev/api/v1/auth/login`

## 🌍 Passo 7: Configurar Domínio Customizado (Opcional)

1. No Cloudflare Pages → **Custom domains**
2. Adicione seu domínio (ex: `app.seu-dominio.com`)
3. Configure DNS no Cloudflare:
   - Tipo: `CNAME`
   - Nome: `app` (ou `api`)
   - Conteúdo: `seu-projeto.pages.dev`

## 🐛 Troubleshooting

### Erro: "Cannot find module"
- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que o build está gerando os arquivos corretos

### Erro: "Function timeout"
- Cloudflare Pages Functions tem limite de 30s (free tier)
- Otimize queries ao banco de dados
- Use cache quando possível

### Erro: "CORS"
- Verifique se `_headers` está configurado corretamente
- Certifique-se de que o backend está retornando headers CORS

### Erro: "Database connection"
- Verifique se `DATABASE_URL` está configurada como secret
- Teste a conexão localmente primeiro

## 📊 Monitoramento

1. **Logs**: Cloudflare Dashboard → Pages → Seu projeto → **Functions** → **Logs**
2. **Analytics**: Cloudflare Dashboard → Analytics → **Web Analytics**
3. **Performance**: Cloudflare Dashboard → Speed → **Insights**

## 🔐 Segurança

- ✅ Variáveis sensíveis como secrets
- ✅ HTTPS automático
- ✅ Headers de segurança configurados (`_headers`)
- ✅ CORS configurado
- ✅ Rate limiting (via Cloudflare)

## 📚 Recursos Adicionais

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## ✅ Checklist Final

- [ ] Repositório conectado ao Cloudflare
- [ ] Variáveis de ambiente configuradas
- [ ] Secrets configurados
- [ ] Build funcionando localmente
- [ ] Deploy realizado com sucesso
- [ ] Endpoints testados
- [ ] Domínio customizado configurado (opcional)
- [ ] Monitoramento ativado

---

**Pronto!** Sua aplicação está no ar! 🎉

Se precisar de ajuda, verifique os logs no Cloudflare Dashboard ou entre em contato.


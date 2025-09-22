# 🔐 GitHub Secrets - Configuração

Este documento lista todos os secrets necessários para o deploy automático via GitHub Actions + Vercel.

## 📋 Secrets Necessários no GitHub

Acesse: **Settings → Secrets and variables → Actions** no seu repositório GitHub.

### 🚀 Vercel Secrets

| Secret | Descrição | Como obter |
|--------|-----------|------------|
| `VERCEL_TOKEN` | Token de autenticação do Vercel | [Vercel Dashboard → Account Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | ID da organização no Vercel | Encontrado em `.vercel/project.json` após primeiro deploy |
| `VERCEL_PROJECT_ID` | ID do projeto no Vercel | Encontrado em `.vercel/project.json` após primeiro deploy |

### 🌐 Frontend Secrets

| Secret | Descrição | Valor Exemplo |
|--------|-----------|---------------|
| `VITE_API_URL` | URL da API Backend | `https://aplicacao-boi-gordo-backend.vercel.app/api/v1` |
| `VITE_SUPABASE_URL` | URL do Supabase | `https://vffxtvuqhlhcbbyqmynz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave pública do Supabase | `eyJ...` (sua chave anon) |

### 🔧 Backend Secrets

| Secret | Descrição | Valor Exemplo |
|--------|-----------|---------------|
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret para tokens JWT (min 32 chars) | Gerar com: `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | Tempo de expiração do JWT | `7d` |
| `SUPABASE_URL` | URL do Supabase (backend) | `https://vffxtvuqhlhcbbyqmynz.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service key do Supabase | `eyJ...` (service_role key) |
| `FRONTEND_URL` | URL do frontend para CORS | `https://aplicacao-boi-gordo.vercel.app` |

## 🔄 Como configurar os Secrets

### 1. Obter tokens do Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Fazer primeiro deploy manual para obter IDs
vercel

# Após deploy, verificar arquivo criado
cat .vercel/project.json
```

### 2. Adicionar Secrets no GitHub

1. Vá para **Settings** do repositório
2. Clique em **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret listado acima

### 3. Exemplo de configuração

```bash
# Gerar JWT_SECRET seguro
openssl rand -base64 32

# Resultado exemplo:
# 7K3Hs9Xp2Nm5Qw8RtYuIoP1AsDfGhJkL4ZxCvBnM6=
```

## ✅ Checklist de Configuração

- [ ] `VERCEL_TOKEN` configurado
- [ ] `VERCEL_ORG_ID` configurado
- [ ] `VERCEL_PROJECT_ID` configurado
- [ ] `VITE_API_URL` configurado
- [ ] `VITE_SUPABASE_URL` configurado
- [ ] `VITE_SUPABASE_ANON_KEY` configurado
- [ ] `DATABASE_URL` configurado
- [ ] `JWT_SECRET` configurado (32+ caracteres)
- [ ] `JWT_EXPIRES_IN` configurado
- [ ] `SUPABASE_SERVICE_KEY` configurado
- [ ] `FRONTEND_URL` configurado

## 🧪 Testar Configuração

Após configurar todos os secrets:

1. Faça um push para a branch `main`
2. Vá para a aba **Actions** do GitHub
3. Verifique se o workflow "Deploy to Vercel" está rodando
4. Acompanhe os logs para verificar erros

## 🔍 Troubleshooting

### Erro: "Error: No token found"
→ Verificar se `VERCEL_TOKEN` está configurado corretamente

### Erro: "Error: Invalid project ID"
→ Verificar `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`

### Erro: "Module not found"
→ Verificar se `npm ci` está rodando corretamente

### Build falhou
→ Verificar se todas as variáveis VITE_* estão configuradas

## 📚 Links Úteis

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Supabase Keys](https://supabase.com/dashboard/project/_/settings/api)

---

*Se os secrets já estão configurados, o deploy deve funcionar automaticamente a cada push na branch main!*
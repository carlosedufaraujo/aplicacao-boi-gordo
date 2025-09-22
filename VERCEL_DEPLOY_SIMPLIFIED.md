# 🚀 Deploy Simplificado no Vercel (Método Recomendado)

## ✨ Método Mais Simples: Integração Direta GitHub-Vercel

Baseado na documentação oficial do Vercel, **NÃO É NECESSÁRIO** configurar VERCEL_TOKEN manualmente para deploy automático. O Vercel oferece integração direta com GitHub!

## 📋 Passo a Passo Simplificado

### 1️⃣ Conectar GitHub ao Vercel

1. Acesse: https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Autorize o Vercel a acessar seu GitHub
4. Selecione o repositório: `aplicacao-boi-gordo`

### 2️⃣ Configurar o Projeto

Durante a importação, o Vercel vai detectar automaticamente:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3️⃣ Adicionar Variáveis de Ambiente

Na tela de configuração, adicione as variáveis:

```env
VITE_API_URL=https://aplicacao-boi-gordo-backend.vercel.app/api/v1
VITE_SUPABASE_URL=https://vffxtvuqhlhcbbyqmynz.supabase.co
VITE_SUPABASE_ANON_KEY=seu_supabase_anon_key
VITE_APP_ENV=production
```

### 4️⃣ Deploy Automático

Clique em **"Deploy"** e pronto!

A partir de agora:
- ✅ Cada push na branch `main` = deploy automático
- ✅ Cada PR = preview environment
- ✅ Sem necessidade de VERCEL_TOKEN
- ✅ Sem necessidade de GitHub Actions para deploy

## 🔄 Como Funciona

```mermaid
graph LR
    A[Push no GitHub] --> B[Vercel detecta mudança]
    B --> C[Build automático]
    C --> D[Deploy em produção]
```

## 🎯 Para o Backend (Projeto Separado)

Repita o mesmo processo para o backend:

1. Crie um novo projeto no Vercel
2. Importe a pasta `/backend` como projeto separado
3. Configure as variáveis:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=seu_jwt_secret
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://vffxtvuqhlhcbbyqmynz.supabase.co
SUPABASE_SERVICE_KEY=seu_service_key
FRONTEND_URL=https://aplicacao-boi-gordo.vercel.app
NODE_ENV=production
```

## ❌ Remover GitHub Actions (Opcional)

Como o Vercel já faz deploy automático, você pode:

1. Deletar `.github/workflows/deploy.yml`
2. Usar GitHub Actions apenas para testes/linting

OU manter para outros processos como:
- Testes automatizados
- Linting
- Build checks

## ✅ Vantagens da Integração Direta

- **Mais simples**: Sem configuração de tokens
- **Mais rápido**: Deploy direto do Vercel
- **Preview automático**: Para cada PR
- **Rollback fácil**: Via dashboard Vercel
- **Logs detalhados**: No dashboard Vercel
- **Métricas**: Analytics incluído

## 🔍 Verificar Deploy

1. Dashboard: https://vercel.com/dashboard
2. Ver deploys do projeto
3. Checar logs em tempo real
4. Acessar URL de produção

## 📝 Resumo

**Método Atual (GitHub Actions)**:
- Complexo
- Requer VERCEL_TOKEN
- Mais configurações

**Método Recomendado (Integração Direta)**:
- Simples
- Automático
- Sem tokens manuais
- Funciona imediatamente

## 🚀 Ação Recomendada

1. Vá para https://vercel.com/new
2. Importe o repositório
3. Configure variáveis
4. Deploy!

**Em menos de 5 minutos você terá deploy automático funcionando!**

---

*Este é o método oficial recomendado pelo Vercel e é muito mais simples que configurar GitHub Actions.*
# 🔧 Como Corrigir o Erro: VERCEL_TOKEN

## ❌ Erro Encontrado
```
Error: No existing credentials found. Please run `vercel login` or pass "--token"
```

## ✅ Solução: Adicionar VERCEL_TOKEN nos Secrets do GitHub

### Passo 1: Obter o Token do Vercel

1. Acesse: https://vercel.com/account/tokens
2. Clique em **"Create Token"**
3. Configure:
   - **Name**: `GitHub Actions Deploy`
   - **Scope**: Full Account
   - **Expiration**: Never (ou 1 year)
4. Clique em **"Create"**
5. **COPIE O TOKEN** (ele só aparece uma vez!)

### Passo 2: Adicionar o Token no GitHub

1. Vá para o repositório: https://github.com/carlosedufaraujo/aplicacao-boi-gordo
2. Clique em **Settings** (⚙️)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **"New repository secret"**
5. Adicione:
   - **Name**: `VERCEL_TOKEN`
   - **Secret**: Cole o token que você copiou do Vercel
6. Clique em **"Add secret"**

### Passo 3: Obter IDs do Projeto (Se necessário)

Se você ainda não tem `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`:

1. Faça o primeiro deploy manual:
```bash
npm i -g vercel
vercel login
vercel
```

2. Após o deploy, verifique o arquivo criado:
```bash
cat .vercel/project.json
```

3. Você verá algo como:
```json
{
  "projectId": "prj_xxxxxxxxxxxxx",
  "orgId": "team_xxxxxxxxxxxxx"
}
```

4. Adicione esses valores como secrets no GitHub:
   - `VERCEL_ORG_ID` = valor de "orgId"
   - `VERCEL_PROJECT_ID` = valor de "projectId"

### Passo 4: Verificar Todos os Secrets

Certifique-se de que TODOS estes secrets estão configurados no GitHub:

#### Secrets Obrigatórios do Vercel:
- [ ] `VERCEL_TOKEN` - Token de autenticação
- [ ] `VERCEL_ORG_ID` - ID da organização/conta
- [ ] `VERCEL_PROJECT_ID` - ID do projeto

#### Secrets do Frontend:
- [ ] `VITE_API_URL` - URL da API (ex: https://seu-backend.vercel.app/api/v1)
- [ ] `VITE_SUPABASE_URL` - URL do Supabase
- [ ] `VITE_SUPABASE_ANON_KEY` - Chave pública do Supabase

#### Secrets do Backend (se deployar separado):
- [ ] `DATABASE_URL` - String de conexão do banco
- [ ] `JWT_SECRET` - Secret para tokens JWT
- [ ] `SUPABASE_SERVICE_KEY` - Service key do Supabase

### Passo 5: Re-executar o Deploy

Após adicionar o `VERCEL_TOKEN`:

1. Faça qualquer pequena alteração ou:
```bash
git commit --allow-empty -m "fix: Trigger deploy with VERCEL_TOKEN"
git push
```

2. Verifique o GitHub Actions: https://github.com/carlosedufaraujo/aplicacao-boi-gordo/actions

## 🎯 Alternativa: Deploy Manual

Se preferir fazer o deploy manualmente por enquanto:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Responda as perguntas:
# - Link to existing project? Yes
# - What's the name of your existing project? aplicacao-boi-gordo
```

## 📝 Checklist Final

- [ ] Token Vercel criado em https://vercel.com/account/tokens
- [ ] `VERCEL_TOKEN` adicionado nos secrets do GitHub
- [ ] `VERCEL_ORG_ID` adicionado nos secrets
- [ ] `VERCEL_PROJECT_ID` adicionado nos secrets
- [ ] Todos os outros secrets necessários configurados
- [ ] Push feito para trigger novo deploy

## 🚀 Resultado Esperado

Após configurar o `VERCEL_TOKEN`, o GitHub Actions deve:
1. ✅ Fazer build do projeto
2. ✅ Autenticar com Vercel usando o token
3. ✅ Fazer deploy automático
4. ✅ Aplicação disponível em produção

---

**Após adicionar o VERCEL_TOKEN, o deploy automático funcionará!**
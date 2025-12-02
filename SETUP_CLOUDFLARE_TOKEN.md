# 🔐 Configurar Token do Cloudflare

Para fazer o deploy automático, você precisa de um token de API do Cloudflare.

## 📋 Passo a Passo

### 1. Criar Token de API

1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em **"Create Token"**
3. Use o template **"Edit Cloudflare Workers"** ou configure manualmente:
   - **Permissions:**
     - Account → Cloudflare Pages → Edit
     - Account → Account Settings → Read
   - **Account Resources:** Selecione sua conta
   - **Zone Resources:** Deixe em branco (não necessário para Pages)
4. Clique em **"Continue to summary"**
5. Clique em **"Create Token"**
6. **COPIE O TOKEN** (você só verá ele uma vez!)

### 2. Configurar Token Localmente

#### Opção A: Variável de Ambiente (Recomendado)

```bash
# No terminal
export CLOUDFLARE_API_TOKEN=seu_token_aqui

# Para tornar permanente (macOS/Linux)
echo 'export CLOUDFLARE_API_TOKEN=seu_token_aqui' >> ~/.zshrc
source ~/.zshrc
```

#### Opção B: Login Interativo

```bash
wrangler login
```

Isso vai abrir o navegador para autenticação.

### 3. Verificar Autenticação

```bash
wrangler whoami
```

Se mostrar seu email, está autenticado! ✅

### 4. Fazer Deploy

```bash
# Tornar o script executável
chmod +x deploy-cloudflare.sh

# Executar deploy
./deploy-cloudflare.sh
```

Ou manualmente:

```bash
npm run build
wrangler pages deploy dist --project-name=aplicacao-boi-gordo
```

## 🔒 Segurança

⚠️ **NUNCA** commite o token no Git!

O token deve ficar apenas como variável de ambiente local.

## ✅ Próximos Passos

Após configurar o token:

1. Execute `./deploy-cloudflare.sh`
2. Configure variáveis de ambiente no Cloudflare Dashboard
3. Sua aplicação estará no ar! 🎉


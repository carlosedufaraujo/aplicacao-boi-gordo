# 🌐 Configurar Domínio bovsync.acexcapital.com

## 📋 Resumo

Este guia mostra como configurar o domínio personalizado `bovsync.acexcapital.com` no Cloudflare Pages para acessar a plataforma.

## ✅ O que já foi configurado

- ✅ Configuração do domínio na aplicação (`src/utils/domainConfig.ts`)
- ✅ Personalização da página de login para `bovsync.acexcapital.com`
- ✅ Branding personalizado (BovSync / Acex Capital)

## 🚀 Passo a Passo - Configurar no Cloudflare

### 1. Acessar Cloudflare Dashboard

1. Acesse: https://dash.cloudflare.com/
2. Faça login na sua conta Cloudflare
3. Navegue até: **Pages** → **aplicacao-boi-gordo**

### 2. Adicionar Domínio Personalizado

1. No projeto `aplicacao-boi-gordo`, clique em **"Custom domains"**
2. Clique em **"Set up a custom domain"**
3. Digite: `bovsync.acexcapital.com`
4. Clique em **"Continue"**

### 3. Configurar DNS

#### Opção A: Domínio já está no Cloudflare

Se o domínio `acexcapital.com` já está gerenciado pelo Cloudflare:

1. **No Cloudflare DNS:**
   - Vá em **DNS** → **Records**
   - Clique em **"Add record"**
   - Configure:
     - **Type:** `CNAME`
     - **Name:** `bovsync`
     - **Target:** `aplicacao-boi-gordo.pages.dev`
     - **Proxy status:** ✅ Proxied (laranja)
     - **TTL:** Auto
   - Clique em **"Save"**

2. **Aguardar SSL:**
   - O Cloudflare configura SSL automaticamente
   - Pode levar alguns minutos
   - Você verá um certificado SSL válido

#### Opção B: Domínio está em outro provedor DNS

Se o domínio `acexcapital.com` está em outro provedor (GoDaddy, Registro.br, etc.):

1. **No seu provedor DNS:**
   - Acesse o painel de DNS do seu provedor
   - Adicione um registro CNAME:
     - **Nome/Host:** `bovsync`
     - **Valor/Alvo:** `aplicacao-boi-gordo.pages.dev`
     - **TTL:** 3600 (ou padrão)

2. **No Cloudflare Pages:**
   - Após adicionar o domínio, o Cloudflare vai aguardar a propagação DNS
   - Pode levar até 24h, mas geralmente leva alguns minutos

3. **Aguardar SSL:**
   - Após propagação DNS, o Cloudflare configura SSL automaticamente
   - Aguarde alguns minutos

### 4. Verificar Configuração

#### Verificar DNS

```bash
# No terminal, execute:
dig bovsync.acexcapital.com

# Ou:
nslookup bovsync.acexcapital.com

# Deve retornar algo como:
# bovsync.acexcapital.com -> aplicacao-boi-gordo.pages.dev
```

#### Verificar SSL

1. Acesse: https://bovsync.acexcapital.com
2. Verifique se o certificado SSL está válido (cadeado verde)
3. Teste a página de login

#### Testar Aplicação

1. Acesse: https://bovsync.acexcapital.com/login
2. A página deve mostrar:
   - Nome: **BovSync**
   - Subtítulo: **Sistema de Gestão Completa para Pecuária de Corte**
   - Domínio: **bovsync.acexcapital.com**
   - Suporte: **suporte@acexcapital.com**

## 🔧 Configuração via Wrangler CLI (Alternativa)

Se preferir usar a linha de comando:

```bash
# 1. Fazer login no Cloudflare
wrangler login

# 2. Adicionar domínio ao projeto Pages
wrangler pages domain add bovsync.acexcapital.com --project-name aplicacao-boi-gordo

# 3. Verificar domínios configurados
wrangler pages domain list --project-name aplicacao-boi-gordo
```

## 📝 Checklist

- [ ] Domínio `acexcapital.com` registrado
- [ ] Acesso ao DNS do domínio
- [ ] CNAME configurado no DNS (`bovsync` → `aplicacao-boi-gordo.pages.dev`)
- [ ] Domínio adicionado no Cloudflare Pages
- [ ] SSL configurado automaticamente
- [ ] Aplicação acessível via `https://bovsync.acexcapital.com`
- [ ] Página de login personalizada funcionando

## 🎨 Personalização Aplicada

Quando acessar `bovsync.acexcapital.com`, a aplicação mostrará:

- **Nome da Organização:** BovSync
- **Subtítulo:** Sistema de Gestão Completa para Pecuária de Corte
- **Logo:** `/fazenda-ceac.jpg` (pode ser personalizado)
- **Imagem de Fundo:** `/fazenda-ceac.jpg` (pode ser personalizado)
- **Email de Suporte:** suporte@acexcapital.com
- **Empresa:** Acex Capital
- **Tagline:** Controle total do seu rebanho, desde a compra até a venda

## 🖼️ Personalizar Logo e Imagens

Para personalizar o logo e imagens:

1. **Adicione os arquivos na pasta `public/`:**
   ```bash
   public/
   ├── logo-bovsync.png      # Logo da BovSync
   └── background-bovsync.jpg # Imagem de fundo personalizada
   ```

2. **Atualize `src/utils/domainConfig.ts`:**
   ```typescript
   'bovsync.acexcapital.com': {
     // ...
     logo: '/logo-bovsync.png',
     backgroundImage: '/background-bovsync.jpg',
     // ...
   },
   ```

3. **Faça commit e push:**
   ```bash
   git add public/logo-bovsync.png public/background-bovsync.jpg
   git add src/utils/domainConfig.ts
   git commit -m "Personalizar logo e imagens para bovsync.acexcapital.com"
   git push origin main
   ```

## 🆘 Troubleshooting

### DNS não resolve

- Aguarde até 24h para propagação completa
- Verifique se o CNAME está correto
- Use ferramentas como `dig` ou `nslookup`
- Verifique se o domínio está no Cloudflare (se aplicável)

### SSL não funciona

- Aguarde alguns minutos após DNS propagar
- Verifique se o domínio está adicionado no Cloudflare Pages
- Tente remover e readicionar o domínio
- Verifique se o proxy está ativado (laranja) no Cloudflare DNS

### Erro 404

- Verifique se o domínio está apontando para o projeto correto
- Verifique se o deploy foi feito com sucesso
- Limpe o cache do navegador
- Verifique se o domínio está ativo no Cloudflare Pages

### Página não mostra personalização

- Verifique se o domínio está correto em `domainConfig.ts`
- Limpe o cache do navegador
- Verifique se o deploy mais recente foi aplicado
- Verifique o console do navegador para erros

## 📞 Suporte

Se precisar de ajuda:
- Email: suporte@acexcapital.com
- Documentação Cloudflare: https://developers.cloudflare.com/pages/platform/custom-domains/

---

**Última atualização:** 15/01/2025


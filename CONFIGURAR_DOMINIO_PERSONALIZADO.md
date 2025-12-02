# 🌐 Como Configurar Domínio Personalizado no Cloudflare Pages

## 🎯 Objetivo

Configurar um domínio personalizado (ex: `app.boigordo.com.br`) para sua aplicação.

## 📋 Passo a Passo

### 1. Preparação

**Você precisa:**
- Um domínio registrado (ex: `boigordo.com.br`)
- Acesso ao DNS do domínio (pode ser Cloudflare ou outro provedor)

### 2. Configurar no Cloudflare Pages

#### Opção A: Domínio já está no Cloudflare

1. **Acesse o Dashboard:**
   - URL: https://dash.cloudflare.com/
   - Vá em **Pages** → **aplicacao-boi-gordo** → **Custom domains**

2. **Adicionar Domínio:**
   - Clique em **"Set up a custom domain"**
   - Digite seu domínio (ex: `app.boigordo.com.br`)
   - Clique em **"Continue"**

3. **Configurar DNS:**
   - O Cloudflare vai mostrar as instruções
   - Adicione um registro CNAME:
     - **Name:** `app` (ou `@` para domínio raiz)
     - **Target:** `aplicacao-boi-gordo.pages.dev`
     - **Proxy:** ✅ Proxied (laranja)
   - Clique em **"Save"**

4. **Aguardar SSL:**
   - O Cloudflare configura SSL automaticamente
   - Pode levar alguns minutos
   - Você verá um certificado SSL válido

#### Opção B: Domínio está em outro provedor

1. **No Cloudflare Pages:**
   - Acesse: https://dash.cloudflare.com/
   - Vá em **Pages** → **aplicacao-boi-gordo** → **Custom domains**
   - Clique em **"Set up a custom domain"**
   - Digite seu domínio
   - Clique em **"Continue"**

2. **No seu provedor DNS:**
   - Adicione um registro CNAME:
     - **Name:** `app` (ou `@` se suportar)
     - **Target:** `aplicacao-boi-gordo.pages.dev`
     - **TTL:** 3600 (ou padrão)

3. **Aguardar Propagação:**
   - DNS pode levar até 24h para propagar
   - Geralmente leva alguns minutos
   - Verifique com: `dig app.boigordo.com.br` ou `nslookup app.boigordo.com.br`

4. **SSL no Cloudflare:**
   - Após propagação DNS, o Cloudflare configura SSL automaticamente
   - Aguarde alguns minutos

### 3. Verificar Configuração

1. **Verificar DNS:**
   ```bash
   dig app.boigordo.com.br
   # Deve retornar: aplicacao-boi-gordo.pages.dev
   ```

2. **Verificar SSL:**
   - Acesse: https://app.boigordo.com.br
   - Deve mostrar certificado válido

3. **Testar Aplicação:**
   - Acesse: https://app.boigordo.com.br
   - Deve funcionar igual a: https://aplicacao-boi-gordo.pages.dev

## 🔧 Configurações Avançadas

### Domínio Raiz (ex: `boigordo.com.br`)

Alguns provedores DNS não permitem CNAME no domínio raiz. Nesse caso:

1. **Use Cloudflare DNS:**
   - Transfira o DNS para Cloudflare
   - Use o recurso "CNAME Flattening" do Cloudflare

2. **Ou use A Record:**
   - Cloudflare Pages fornece IPs estáticos
   - Configure A records apontando para esses IPs
   - Consulte: https://developers.cloudflare.com/pages/platform/custom-domains/

### Subdomínio (ex: `app.boigordo.com.br`)

Mais simples e recomendado:
- Use CNAME apontando para `aplicacao-boi-gordo.pages.dev`
- Funciona em qualquer provedor DNS

## 📝 Checklist

- [ ] Domínio registrado
- [ ] CNAME configurado no DNS
- [ ] Domínio adicionado no Cloudflare Pages
- [ ] SSL configurado automaticamente
- [ ] Aplicação acessível via domínio personalizado

## 🆘 Troubleshooting

### DNS não resolve
- Aguarde até 24h para propagação completa
- Verifique se o CNAME está correto
- Use ferramentas como `dig` ou `nslookup`

### SSL não funciona
- Aguarde alguns minutos após DNS propagar
- Verifique se o domínio está no Cloudflare Pages
- Tente remover e readicionar o domínio

### Erro 404
- Verifique se o domínio está apontando para o projeto correto
- Verifique se o deploy foi feito com sucesso
- Limpe o cache do navegador

---

**Última atualização:** 02/12/2025


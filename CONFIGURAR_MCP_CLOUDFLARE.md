# 🔧 Como Configurar MCP do Cloudflare

## 📁 Pasta do Projeto

```
/Users/carloseduardo/App/aplicacao-boi-gordo
```

## 🔑 Passo a Passo

### 1. Obter Token do Cloudflare

1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em **"Create Token"**
3. Use o template **"Edit Cloudflare Workers"** ou crie um custom:
   - **Permissions:**
     - Account → Cloudflare Pages → Edit
     - Account → Workers Scripts → Edit
   - **Account Resources:** Selecione sua conta
4. Clique em **"Continue to summary"** → **"Create Token"**
5. **Copie o token** (você só verá ele uma vez!)

### 2. Configurar no Cursor

1. Abra o Cursor
2. Vá em **Settings** (Cmd+, ou Ctrl+,)
3. Procure por **"MCP"** ou **"Model Context Protocol"**
4. Adicione uma nova configuração:

```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "npx",
      "args": [
        "-y",
        "@cloudflare/mcp-server-cloudflare"
      ],
      "env": {
        "CLOUDFLARE_API_TOKEN": "seu_token_aqui",
        "CLOUDFLARE_ACCOUNT_ID": "seu_account_id_aqui"
      }
    }
  }
}
```

### 3. Obter Account ID

1. Acesse: https://dash.cloudflare.com/
2. Selecione sua conta
3. No sidebar direito, você verá **"Account ID"**
4. Copie o ID

### 4. Instalar o MCP Server (Opcional - Local)

Se quiser instalar localmente no projeto:

```bash
cd /Users/carloseduardo/App/aplicacao-boi-gordo
npm install -D @cloudflare/mcp-server-cloudflare
```

### 5. Verificar Configuração

Após configurar, reinicie o Cursor e teste se o MCP está funcionando.

## 📝 Nota Importante

- O MCP do Cloudflare é configurado nas **configurações do Cursor**, não no projeto
- Você já tem o **MCP do Supabase** funcionando! ✅
- O MCP do Cloudflare permite gerenciar Workers, Pages, etc. diretamente

## 🔍 Localização do Arquivo de Configuração

O arquivo de configuração do Cursor geralmente fica em:

- **macOS:** `~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- **Linux:** `~/.config/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- **Windows:** `%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`

Ou você pode configurar diretamente nas Settings do Cursor (mais fácil).

---

**Dica:** Se você já tem o projeto deployado no Cloudflare Pages, você pode usar o MCP para gerenciar deployments, variáveis de ambiente, etc. diretamente pelo Cursor!


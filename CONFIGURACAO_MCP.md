# Configuração MCP - Playwright e Supabase

## Status da Configuração
📅 Data: 28 de Janeiro de 2025
📍 Arquivo: `~/.cursor/mcp.json`

## ⚠️ AÇÃO NECESSÁRIA

### Gerar Personal Access Token do Supabase

1. **Acesse o Dashboard do Supabase**
   - URL: https://supabase.com/dashboard/account/tokens
   
2. **Crie um novo token**
   - Clique em "Generate new token"
   - Nome: `Cursor MCP Server`
   - Permissões: Selecione as apropriadas para seu uso
   
3. **Copie o token gerado**
   - ⚠️ IMPORTANTE: O token só é mostrado uma vez!
   
4. **Atualize o arquivo MCP**
   - Abra: `~/.cursor/mcp.json`
   - Substitua `"SUPABASE_ACCESS_TOKEN": "sbp_81e97fb6c23f89c0f4a0f3643a088b5a0df21bc8"`
   - Por: `"SUPABASE_ACCESS_TOKEN": "SEU_TOKEN_AQUI"`

## Configuração Atual

### Playwright MCP Server
```json
{
  "playwright": {
    "command": "npx",
    "args": [
      "-y",
      "@executeautomation/playwright-mcp-server"
    ]
  }
}
```

**Funcionalidades:**
- Automação de browsers (Chrome, Firefox, Safari/WebKit)
- Execução de testes E2E
- Captura de screenshots
- Gravação de vídeos
- Análise de performance

### Supabase MCP Server
```json
{
  "supabase": {
    "command": "npx",
    "args": [
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--project-ref=xqfmejiajosmkfdryizy"
    ],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "TOKEN_PRECISA_SER_GERADO"
    }
  }
}
```

**Funcionalidades (Modo Full - Permissões Completas):**
- ✅ Criar e deletar tabelas
- ✅ Inserir, atualizar e deletar dados
- ✅ Executar qualquer comando SQL
- ✅ Gerenciar schema e migrações
- ✅ Criar e modificar políticas RLS
- ✅ Gerenciar funções e triggers
- ✅ Criar e deletar projetos
- ✅ Modificar configurações do projeto
- ✅ Gerenciar branches
- ✅ Deploy de Edge Functions
- ✅ Visualizar e limpar logs
- ✅ Gerenciar autenticação e usuários

## Informações do Projeto Supabase

- **Project Reference**: `xqfmejiajosmkfdryizy`
- **URL**: `https://xqfmejiajosmkfdryizy.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZm1lamlham9zbWtmZHJ5aXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMzI1MjQsImV4cCI6MjA1MDkwODUyNH0.I7bZQvJPx0HLfPGl7Wo94s2s0mOE3IDiFMblQHOQFP0`

## Passos para Ativar

1. ✅ Arquivo MCP configurado em `~/.cursor/mcp.json`
2. ⏳ Gerar Personal Access Token no Supabase Dashboard
3. ⏳ Atualizar o token no arquivo MCP
4. ⏳ Reiniciar o Cursor/VS Code
5. ⏳ Verificar se os servidores MCP estão ativos

## Verificação

Após configurar, você pode verificar se está funcionando:

1. **No Cursor**, abra o Command Palette (Cmd+Shift+P)
2. Digite "MCP" e veja se aparecem comandos relacionados
3. Verifique o output/console para mensagens dos servidores MCP

## Troubleshooting

### Erro: "MCP server not found"
- Verifique se o arquivo está em `~/.cursor/mcp.json`
- Confirme que o JSON está válido (sem erros de sintaxe)
- Reinicie o Cursor completamente

### Erro: "Authentication failed" (Supabase)
- Token expirado ou inválido
- Gere um novo token no Dashboard
- Verifique se o project-ref está correto

### Erro: "Cannot start playwright server"
- Execute: `npm cache clean --force`
- Tente: `npx @executeautomation/playwright-mcp-server --version`
- Se falhar, instale globalmente: `npm install -g @executeautomation/playwright-mcp-server`

## Segurança

⚠️ **IMPORTANTE**: 
- Nunca commite o arquivo `mcp.json` com tokens reais
- **MODO FULL ATIVADO**: O MCP tem permissões completas para criar, editar e deletar
- Em produção, considere usar `--read-only` para maior segurança
- Crie tokens separados para desenvolvimento e produção
- Revogue tokens não utilizados regularmente
- **CUIDADO**: Com permissões completas, o MCP pode fazer alterações irreversíveis no banco de dados

## Recursos Adicionais

- [Documentação MCP Supabase](https://supabase.com/docs/guides/getting-started/mcp)
- [Playwright MCP GitHub](https://github.com/executeautomation/mcp-playwright)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
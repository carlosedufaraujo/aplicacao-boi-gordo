# Scripts do Backend - Sistema Boi Gordo

Este diretório contém scripts utilitários para manutenção, configuração e operações do sistema.

## 📋 Lista de Scripts

### 1. setup-database.sh
**Descrição**: Script principal de configuração do banco de dados
**Localização**: `./setup-database.sh`

**Funcionalidades**:
- Testa conexão com Supabase
- Reset completo do banco (opcional)
- Sincronização de schema
- Execução de seeds
- Geração do cliente Prisma

**Como usar**:
```bash
# Tornar executável
chmod +x scripts/setup-database.sh

# Executar
./scripts/setup-database.sh
```

**Opções disponíveis**:
1. Configuração completa (APAGA TODOS OS DADOS)
2. Apenas sincronizar schema (mantém dados)
3. Apenas executar seed (adiciona dados iniciais)
4. Cancelar

**Usuários padrão criados**:
| Email | Senha | Role |
|-------|-------|------|
| admin@boigordo.com | admin123 | ADMIN |
| gerente@boigordo.com | gerente123 | MANAGER |
| usuario@boigordo.com | usuario123 | USER |
| visualizador@boigordo.com | visualizador123 | VIEWER |

---

### 2. reset-admin.ts
**Descrição**: Reset ou criação do usuário administrador
**Localização**: `./reset-admin.ts`

**Funcionalidades**:
- Cria ou atualiza usuário admin
- Define senha padrão (admin123)
- Ativa o usuário
- Define role como ADMIN

**Como usar**:
```bash
npx tsx scripts/reset-admin.ts
```

**Saída esperada**:
```
✅ Usuário admin atualizado/criado:
   Email: admin@boigordo.com
   Senha: admin123
   Role: ADMIN
   Ativo: true
```

---

### 3. fix-typescript-errors.ts
**Descrição**: Correção automática de erros TypeScript comuns
**Localização**: `./fix-typescript-errors.ts`

**Funcionalidades**:
- Adiciona tipos a callbacks (map, filter, reduce)
- Remove variáveis não utilizadas
- Cria arquivo de tipos globais
- Atualiza scripts do package.json

**Como usar**:
```bash
npx tsx scripts/fix-typescript-errors.ts
# ou
npm run fix:types
```

**Correções aplicadas**:
- Callbacks sem tipo recebem `any`
- Variáveis não utilizadas são prefixadas com `_`
- Cria `src/types/global.d.ts` com tipos Express
- Adiciona scripts de typecheck ao package.json

---

### 4. fix-paths.js
**Descrição**: Corrige caminhos de importação após build
**Localização**: `./fix-paths.js`

**Funcionalidades**:
- Corrige imports com alias @/
- Ajusta caminhos relativos no dist/
- Processa todos arquivos .js recursivamente

**Como usar**:
```bash
# Após o build
npm run build
node scripts/fix-paths.js
```

**Quando usar**:
- Após compilar o TypeScript
- Se houver erros de módulo não encontrado
- Para deploy em produção

---

### 5. create-settings-tables.js
**Descrição**: Criação das tabelas de configurações no Supabase
**Localização**: `./create-settings-tables.js`

**Funcionalidades**:
- Verifica existência das tabelas settings e backup_history
- Gera SQL para criação se não existirem
- Configura RLS (Row Level Security)
- Cria triggers e índices

**Como usar**:
```bash
node scripts/create-settings-tables.js
```

**Tabelas criadas**:

#### settings
- Armazena configurações do usuário/organização
- Campos: id, user_id, setting_key, setting_value, category
- RLS habilitado (usuários só veem suas configs)

#### backup_history
- Histórico de backups
- Campos: id, user_id, backup_type, status, file_path
- RLS habilitado

**Se as tabelas não existirem**:
1. O script mostrará o SQL completo
2. Acesse o Supabase Dashboard
3. Cole e execute o SQL fornecido

---

## 🔧 Scripts NPM Disponíveis

Estes scripts estão configurados no package.json:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "typecheck:strict": "tsc --noEmit -p tsconfig.strict.json",
    "build:check": "npm run typecheck && npm run build",
    "fix:types": "tsx scripts/fix-typescript-errors.ts"
  }
}
```

## 📝 Ordem Recomendada de Execução

Para configuração inicial completa:

1. **setup-database.sh** - Configura banco e schema
2. **create-settings-tables.js** - Adiciona tabelas de settings
3. **fix-typescript-errors.ts** - Corrige erros de tipo
4. **npm run build** - Compila o projeto
5. **fix-paths.js** - Corrige caminhos no build

## ⚠️ Notas Importantes

### Variáveis de Ambiente
Certifique-se de ter o arquivo `.env` configurado com:
```env
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="eyJ..."
```

### Permissões
Scripts .sh precisam de permissão de execução:
```bash
chmod +x scripts/*.sh
```

### Dependências
Alguns scripts requerem:
- Node.js 18+
- npx (vem com npm)
- tsx (TypeScript executor)
- Prisma CLI

### Backup
Sempre faça backup antes de executar scripts que modificam o banco:
- setup-database.sh (opção 1)
- reset-admin.ts

## 🆘 Troubleshooting

### Erro: "Execute este script no diretório backend"
**Solução**: Navegue para o diretório backend antes de executar
```bash
cd backend
./scripts/setup-database.sh
```

### Erro: "Permission denied"
**Solução**: Adicione permissão de execução
```bash
chmod +x scripts/nome-do-script.sh
```

### Erro: "Cannot find module tsx"
**Solução**: Instale o tsx
```bash
npm install -D tsx
```

### Erro: "Prisma not found"
**Solução**: Instale as dependências
```bash
npm install
```

## 📊 Status dos Scripts

| Script | Status | Última Atualização | Testado |
|--------|--------|-------------------|---------|
| setup-database.sh | ✅ Funcional | 2025-01-28 | Sim |
| reset-admin.ts | ✅ Funcional | 2025-01-28 | Sim |
| fix-typescript-errors.ts | ✅ Funcional | 2025-01-28 | Sim |
| fix-paths.js | ✅ Funcional | 2025-01-28 | Sim |
| create-settings-tables.js | ✅ Funcional | 2025-01-28 | Sim |

## 🔄 Manutenção

### Adicionando Novos Scripts

1. Crie o arquivo em `backend/scripts/`
2. Adicione documentação neste README
3. Se necessário, adicione ao package.json
4. Teste em ambiente de desenvolvimento
5. Commit com mensagem descritiva

### Convenções

- Scripts bash: `.sh`
- Scripts Node.js: `.js`
- Scripts TypeScript: `.ts`
- Use comentários descritivos
- Adicione tratamento de erros
- Forneça feedback visual (emojis, cores)
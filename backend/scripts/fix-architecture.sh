#!/bin/bash

echo "🔧 Iniciando correção de arquitetura..."

# 1. Criar estrutura de diretórios correta
echo "📁 Criando estrutura de diretórios..."
mkdir -p src/repositories
mkdir -p src/dto
mkdir -p src/validations
mkdir -p src/types/generated

# 2. Remover arquivos duplicados/desnecessários
echo "🗑️  Removendo arquivos desnecessários..."
rm -rf src/routes/supabase
rm -rf src/controllers/supabase
rm -rf src/services/supabase
rm -rf src/__tests__  # Temporariamente até reescrever

# 3. Gerar tipos do Prisma
echo "🎨 Gerando tipos..."
npx prisma generate

# 4. Instalar dependências necessárias
echo "📦 Instalando dependências..."
npm install zod dotenv-safe
npm install -D @types/node

# 5. Criar arquivo de configuração de ambiente
echo "🔐 Criando validação de ambiente..."
cat > src/config/env.validation.ts << 'EOF'
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Server
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3333'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
EOF

echo "✅ Estrutura básica criada!"
echo ""
echo "📋 Próximos passos:"
echo "1. Mover lógica de services/supabase para services/"
echo "2. Remover dependência @supabase/supabase-js"
echo "3. Atualizar imports nos controllers"
echo "4. Rodar npm run typecheck para validar"
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Schema de validação
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().describe('PostgreSQL connection string'),
  
  // Server
  PORT: z.string().regex(/^\d+$/).transform(Number).default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // JWT
  JWT_SECRET: z.string().min(32).describe('Secret key for JWT signing'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // API
  API_PREFIX: z.string().default('/api/v1'),
  
  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default(100),
  
  // File Upload
  MAX_FILE_SIZE: z.string().regex(/^\d+$/).transform(Number).default(10485760),
  UPLOAD_DIR: z.string().default('./uploads'),
  
  // Master Admin
  MASTER_ADMIN_EMAIL: z.string().email().default('admin@boigordo.com'),
  
  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().regex(/^\d+$/).transform(Number).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().regex(/^\d+$/).transform(Number).default(0),
});

// Validação das variáveis
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Erro na validação das variáveis de ambiente:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

// Type export
export type Env = z.infer<typeof envSchema>;

// Validação em runtime
export function validateEnv() {
  console.log('✅ Variáveis de ambiente validadas com sucesso');
  console.log('📋 Ambiente:', env.NODE_ENV);
  console.log('🚀 Porta:', env.PORT);
  console.log('🔐 JWT configurado');
  console.log('🗄️  Banco de dados configurado');
  
  return env;
}
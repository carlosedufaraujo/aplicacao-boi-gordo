/**
 * Configuração de ambiente específica para Vercel
 * Simplificada para reduzir cold start time
 */

// Configuração básica para Vercel
export const vercelEnv = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Server
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // API
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  
  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://aplicacao-boi-gordo.vercel.app',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Rate Limiting (desabilitado no Vercel)
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX_REQUESTS: 1000,
  
  // File Upload (limitado no Vercel)
  MAX_FILE_SIZE: 5242880, // 5MB
  
  // Master Admin
  MASTER_ADMIN_EMAIL: process.env.MASTER_ADMIN_EMAIL || 'admin@boigordo.com',
  
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
};

// Validação básica das variáveis críticas
export function validateVercelEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !vercelEnv[key as keyof typeof vercelEnv]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Vercel environment variables validated');
  return vercelEnv;
}

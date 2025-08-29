import { env as validatedEnv, validateEnv } from './env.validation';

interface EnvConfig {
  // Database
  databaseUrl: string;
  
  // Server
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  
  // JWT
  jwtSecret: string;
  jwtExpiresIn: string;
  
  // API
  apiPrefix: string;
  
  // Logging
  logLevel: string;
  
  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  
  // File Upload
  maxFileSize: number;
  uploadDir: string;
  
  // CORS
  frontendUrl: string;
  
  // Email
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
  
  // Master Admin
  masterAdminEmail: string;
  masterIpWhitelist?: string;
}

function getEnvConfig(): EnvConfig {
  // Usa as variáveis já validadas pelo Zod
  return {
    // Database
    databaseUrl: validatedEnv.DATABASE_URL,
    
    // Server
    port: validatedEnv.PORT,
    nodeEnv: validatedEnv.NODE_ENV,
    
    // JWT
    jwtSecret: validatedEnv.JWT_SECRET,
    jwtExpiresIn: validatedEnv.JWT_EXPIRES_IN,
    
    // API
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    
    // Rate Limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    
    // File Upload
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    
    // CORS
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    
    // Email
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.EMAIL_FROM || 'noreply@ceac.com.br',
    },
    
    // Supabase
    supabaseUrl: process.env.SUPABASE_URL || 'https://vffxtvuqhlhcbbyqmynz.prisma.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Master Admin
    masterAdminEmail: process.env.MASTER_ADMIN_EMAIL || 'carlosedufaraujo@outlook.com',
    masterIpWhitelist: process.env.MASTER_IP_WHITELIST,
  };
}

export const env = validateEnv(); 
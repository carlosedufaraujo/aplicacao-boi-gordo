import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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
}

function validateEnv(): EnvConfig {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  // Verifica variáveis obrigatórias
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    // Database
    databaseUrl: process.env.DATABASE_URL!,
    
    // Server
    port: parseInt(process.env.PORT || '3333', 10),
    nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    
    // JWT
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    
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
  };
}

export const env = validateEnv(); 
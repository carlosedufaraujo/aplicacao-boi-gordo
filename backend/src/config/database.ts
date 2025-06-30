import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

// Configuração do Prisma baseada no ambiente
const prismaClientOptions = {
  log: env.nodeEnv === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
  errorFormat: env.nodeEnv === 'development' ? 'pretty' : 'minimal',
} as const;

// Cria instância do Prisma Client
export const prisma = new PrismaClient(prismaClientOptions);

// Middleware para log de queries em desenvolvimento
if (env.nodeEnv === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    
    logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
    
    return result;
  });
}

// Função para conectar ao banco
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Função para desconectar do banco
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

// Gerencia conexão em caso de término do processo
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
}); 
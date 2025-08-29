import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

// Configuração do Prisma baseada no ambiente
const prismaClientOptions = {
  log: env.nodeEnv === 'development' 
    ? ['query' as const, 'error' as const, 'warn' as const] 
    : ['error' as const],
  errorFormat: env.nodeEnv === 'development' 
    ? 'pretty' as const 
    : 'minimal' as const,
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`❌ Database connection failed: ${errorMessage}`, {
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      databaseUrl: env.databaseUrl ? env.databaseUrl.replace(/\/\/.*:.*@/, '//***:***@') : 'undefined'
    });
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

// Tratamento de erros de conexão
prisma.$connect()
  .then(() => {
    logger.info('✅ Conectado ao banco de dados');
  })
  .catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`❌ Erro ao conectar ao banco de dados: ${errorMessage}`, {
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      databaseUrl: env.databaseUrl ? env.databaseUrl.replace(/\/\/.*:.*@/, '//***:***@') : 'undefined'
    });
    process.exit(1);
  });

// Desconectar ao encerrar a aplicação
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Desconectado do banco de dados');
}); 
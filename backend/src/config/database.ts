// Re-exporta a conexão centralizada do novo sistema
export { prisma, db } from '../lib/prisma';
export type { PrismaClient } from '@prisma/client';

import { logger } from './logger';
import { db } from '../lib/prisma';

// Função para conectar ao banco (delega para o novo sistema)
export async function connectDatabase(): Promise<void> {
  try {
    await db.connect();
    logger.info('Database connected via centralized system');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Database connection failed: ${errorMessage}`);
    throw error;
  }
}

// Função para desconectar do banco (delega para o novo sistema)
export async function disconnectDatabase(): Promise<void> {
  await db.disconnect();
  logger.info('Database disconnected via centralized system');
}

// Inicializa conexão centralizada
db.connect()
  .then(() => {
    logger.info('Sistema de conexão centralizado inicializado');
  })
  .catch((error) => {
    logger.error('Falha ao inicializar sistema de conexão:', error);
    // Não faz exit aqui, deixa o sistema de retry tentar reconectar
  }); 
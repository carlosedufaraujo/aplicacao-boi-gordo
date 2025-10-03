import { PrismaClient } from '@prisma/client';
import { prisma } from '@/config/database';

export interface TransactionOptions {
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  maxRetries?: number;
  timeout?: number;
}

/**
 * Executa uma operação dentro de uma transação com retry automático
 */
export async function executeInTransaction<T>(
  operation: (tx: PrismaClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const {
    isolationLevel = 'ReadCommitted',
    maxRetries = 3,
    timeout = 30000
  } = options;

  let attempt = 0;
  let lastError: any;

  while (attempt < maxRetries) {
    attempt++;

    try {
      // Executa operação dentro da transação
      const result = await prisma.$transaction(
        async (tx) => {
          return await operation(tx as any);
        },
        {
          isolationLevel,
          timeout
        }
      );

      return result;
    } catch (error: any) {
      lastError = error;

      // Verifica se é erro de concorrência
      if (error.code === 'P2034' || error.code === 'P2002') {
        console.log(`[Transaction] Conflito detectado, tentativa ${attempt}/${maxRetries}`);

        // Aguarda um tempo aleatório antes de tentar novamente
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
          continue;
        }
      }

      // Para outros erros, lança imediatamente
      throw error;
    }
  }

  throw lastError;
}

/**
 * Decorator para métodos que precisam ser executados em transação
 */
export function Transactional(options?: TransactionOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return executeInTransaction(
        async (tx) => {
          // Substitui prisma pela transação
          const originalPrisma = (this as any).prisma;
          (this as any).prisma = tx;

          try {
            return await originalMethod.apply(this, args);
          } finally {
            // Restaura prisma original
            (this as any).prisma = originalPrisma;
          }
        },
        options
      );
    };

    return descriptor;
  };
}

/**
 * Helper para operações financeiras críticas
 */
export async function executeFinancialTransaction<T>(
  operation: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return executeInTransaction(operation, {
    isolationLevel: 'Serializable', // Máximo isolamento para operações financeiras
    maxRetries: 5,
    timeout: 60000
  });
}

/**
 * Helper para operações batch
 */
export async function executeBatchOperation<T>(
  operations: Array<(tx: PrismaClient) => Promise<any>>
): Promise<T[]> {
  return executeInTransaction(
    async (tx) => {
      const results = [];
      for (const operation of operations) {
        results.push(await operation(tx as any));
      }
      return results;
    },
    {
      isolationLevel: 'ReadCommitted',
      maxRetries: 3,
      timeout: 120000 // 2 minutos para operações batch
    }
  ) as Promise<T[]>;
}

/**
 * Lock otimista para prevenir conflitos
 */
export async function withOptimisticLock<T>(
  entityName: string,
  entityId: string,
  currentVersion: number,
  operation: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return executeInTransaction(async (tx) => {
    // Verifica versão atual
    const entity = await (tx as any)[entityName].findUnique({
      where: { id: entityId }
    });

    if (!entity) {
      throw new Error(`${entityName} não encontrado`);
    }

    if (entity.version !== currentVersion) {
      throw new Error('Registro foi modificado por outro usuário. Recarregue e tente novamente.');
    }

    // Executa operação
    const result = await operation(tx as any);

    // Incrementa versão
    await (tx as any)[entityName].update({
      where: { id: entityId },
      data: { version: { increment: 1 } }
    });

    return result;
  });
}

/**
 * Helper para rollback manual se necessário
 */
export class TransactionManager {
  private savepoints: string[] = [];

  async createSavepoint(name: string): Promise<void> {
    await prisma.$executeRawUnsafe(`SAVEPOINT ${name}`);
    this.savepoints.push(name);
  }

  async rollbackToSavepoint(name: string): Promise<void> {
    if (!this.savepoints.includes(name)) {
      throw new Error(`Savepoint ${name} não existe`);
    }

    await prisma.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${name}`);

    // Remove savepoints após o rollback
    const index = this.savepoints.indexOf(name);
    this.savepoints = this.savepoints.slice(0, index);
  }

  async releaseSavepoint(name: string): Promise<void> {
    if (!this.savepoints.includes(name)) {
      throw new Error(`Savepoint ${name} não existe`);
    }

    await prisma.$executeRawUnsafe(`RELEASE SAVEPOINT ${name}`);

    // Remove da lista
    this.savepoints = this.savepoints.filter(sp => sp !== name);
  }
}
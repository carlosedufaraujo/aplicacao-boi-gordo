import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

/**
 * Sistema Centralizado de Conexão com Banco de Dados
 *
 * Este módulo implementa:
 * - Singleton pattern para instância única do Prisma
 * - Connection pooling otimizado
 * - Retry logic com exponential backoff
 * - Health checks automatizados
 * - Tratamento robusto de erros de conexão
 */

// Interface para opções de retry
interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

// Configurações padrão de retry
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 5,
  initialDelay: 1000, // 1 segundo
  maxDelay: 30000,   // 30 segundos
  factor: 2,          // Exponential backoff factor
};

// Configurações otimizadas do Prisma Client
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development'
    ? ['error' as const, 'warn' as const]
    : ['error' as const],
  errorFormat: process.env.NODE_ENV === 'development'
    ? 'pretty' as const
    : 'minimal' as const,
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

// Classe para gerenciar conexão com o banco
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private prismaClient: PrismaClient | null = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private lastConnectionError: Error | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  // Singleton pattern
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  // Obtém cliente Prisma com lazy initialization
  public async getClient(): Promise<PrismaClient> {
    if (!this.prismaClient) {
      this.prismaClient = new PrismaClient(prismaClientOptions);
      await this.connect();
    }

    // Verifica se ainda está conectado
    if (!this.isConnected) {
      await this.connect();
    }

    return this.prismaClient;
  }

  // Conecta ao banco com retry logic
  private async connect(options: RetryOptions = DEFAULT_RETRY_OPTIONS): Promise<void> {
    let delay = options.initialDelay;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        this.connectionAttempts++;

        logger.info(`Tentativa ${attempt}/${options.maxRetries} de conexão com banco de dados...`);

        if (!this.prismaClient) {
          this.prismaClient = new PrismaClient(prismaClientOptions);
        }

        // Tenta conectar
        await this.prismaClient.$connect();

        // Testa a conexão com uma query simples
        await this.prismaClient.$queryRaw`SELECT 1`;

        this.isConnected = true;
        this.lastConnectionError = null;

        logger.info('✅ Conexão com banco de dados estabelecida com sucesso');

        // Inicia health checks
        this.startHealthChecks();

        return;
      } catch (error) {
        this.lastConnectionError = error as Error;
        this.isConnected = false;

        const errorMessage = error instanceof Error ? error.message : String(error);

        logger.error(`❌ Tentativa ${attempt} falhou: ${errorMessage}`);

        if (attempt < options.maxRetries) {
          logger.info(`Aguardando ${delay}ms antes da próxima tentativa...`);
          await this.sleep(delay);

          // Exponential backoff
          delay = Math.min(delay * options.factor, options.maxDelay);
        } else {
          logger.error('Todas as tentativas de conexão falharam');
          throw new Error(`Não foi possível conectar ao banco após ${options.maxRetries} tentativas: ${errorMessage}`);
        }
      }
    }
  }

  // Desconecta do banco
  public async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.prismaClient) {
      await this.prismaClient.$disconnect();
      this.prismaClient = null;
      this.isConnected = false;
      logger.info('Desconectado do banco de dados');
    }
  }

  // Health check do banco
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    details: {
      connected: boolean;
      attempts: number;
      lastError: string | null;
      uptime: number;
    };
  }> {
    try {
      if (!this.prismaClient || !this.isConnected) {
        await this.connect();
      }

      // Testa conexão
      await this.prismaClient!.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        message: 'Conexão com banco de dados está funcionando',
        details: {
          connected: true,
          attempts: this.connectionAttempts,
          lastError: null,
          uptime: process.uptime(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        status: 'unhealthy',
        message: 'Conexão com banco de dados está com problemas',
        details: {
          connected: false,
          attempts: this.connectionAttempts,
          lastError: errorMessage,
          uptime: process.uptime(),
        },
      };
    }
  }

  // Inicia health checks periódicos
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Health check a cada 30 segundos
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.healthCheck();

        if (health.status === 'unhealthy') {
          logger.warn('Health check falhou, tentando reconectar...');
          await this.connect();
        }
      } catch (error) {
        logger.error('Erro durante health check:', error);
      }
    }, 30000);
  }

  // Utilitário para sleep
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Executa transação com retry
  public async transaction<T>(
    fn: (tx: PrismaClient) => Promise<T>,
    options: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, maxRetries: 3 }
  ): Promise<T> {
    const client = await this.getClient();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        return await client.$transaction(async (tx) => {
          return await fn(tx as PrismaClient);
        });
      } catch (error) {
        lastError = error as Error;
        const errorMessage = error instanceof Error ? error.message : String(error);

        logger.warn(`Transação falhou (tentativa ${attempt}/${options.maxRetries}): ${errorMessage}`);

        // Se for erro de deadlock ou timeout, tenta novamente
        if (
          errorMessage.includes('deadlock') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('connection')
        ) {
          if (attempt < options.maxRetries) {
            await this.sleep(options.initialDelay * Math.pow(options.factor, attempt - 1));
            continue;
          }
        }

        // Para outros erros, falha imediatamente
        throw error;
      }
    }

    throw lastError || new Error('Transação falhou após múltiplas tentativas');
  }

  // Obtém estatísticas da conexão
  public getStats() {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      lastError: this.lastConnectionError?.message || null,
      uptime: process.uptime(),
    };
  }
}

// Instância singleton
const databaseConnection = DatabaseConnection.getInstance();

// Cliente Prisma global para compatibilidade
let globalPrismaClient: PrismaClient | null = null;

// Função para obter o cliente global
async function getGlobalClient(): Promise<PrismaClient> {
  if (!globalPrismaClient) {
    globalPrismaClient = await databaseConnection.getClient();
  }
  return globalPrismaClient;
}

// Exporta cliente Prisma para uso direto (compatibilidade)
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // Para propriedades especiais do Prisma
    if (prop === '$connect' || prop === '$disconnect' || prop === '$transaction' || prop === '$queryRaw' || prop === '$executeRaw' || prop === '$use' || prop === '$on' || prop === '$extends') {
      return async (...args: any[]) => {
        const client = await getGlobalClient();
        return (client as any)[prop](...args);
      };
    }

    // Para modelos do Prisma (user, partner, etc)
    return new Proxy({}, {
      get(_modelTarget, modelMethod) {
        return async (...args: any[]) => {
          const client = await getGlobalClient();
          return (client as any)[prop][modelMethod](...args);
        };
      },
    });
  },
});

// Exporta funções utilitárias
export const db = {
  // Obtém cliente Prisma
  async getClient(): Promise<PrismaClient> {
    return databaseConnection.getClient();
  },

  // Conecta ao banco
  async connect(): Promise<void> {
    await databaseConnection.getClient();
  },

  // Desconecta do banco
  async disconnect(): Promise<void> {
    await databaseConnection.disconnect();
  },

  // Health check
  async healthCheck() {
    return databaseConnection.healthCheck();
  },

  // Executa transação com retry
  async transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return databaseConnection.transaction(fn);
  },

  // Obtém estatísticas
  getStats() {
    return databaseConnection.getStats();
  },
};

// Tratamento de sinais do processo
process.on('SIGINT', async () => {
  logger.info('SIGINT recebido, desconectando do banco...');
  await databaseConnection.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido, desconectando do banco...');
  await databaseConnection.disconnect();
  process.exit(0);
});

process.on('beforeExit', async () => {
  await databaseConnection.disconnect();
});

// Exporta tipo do Prisma para uso em outros módulos
export type { PrismaClient } from '@prisma/client';
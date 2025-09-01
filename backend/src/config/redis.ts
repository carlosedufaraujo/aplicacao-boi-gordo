import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// Criar cliente Redis
export const redis = new Redis({
  host: env.REDIS_HOST || 'localhost',
  port: env.REDIS_PORT || 6379,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

// Event handlers
redis.on('connect', () => {
  logger.info('🔴 Redis: Conectando...');
});

redis.on('ready', () => {
  logger.info('✅ Redis: Conectado e pronto');
});

redis.on('error', (err) => {
  logger.error('❌ Redis erro:', err);
});

redis.on('close', () => {
  logger.warn('🔌 Redis: Conexão fechada');
});

redis.on('reconnecting', (delay: number) => {
  logger.info(`🔄 Redis: Reconectando em ${delay}ms`);
});

// Funções auxiliares de cache
export const cache = {
  // Get com parse automático
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  // Set com stringify automático
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, data);
      } else {
        await redis.set(key, data);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  },

  // Delete
  async del(key: string | string[]): Promise<void> {
    try {
      await redis.del(Array.isArray(key) ? key : [key]);
    } catch (error) {
      logger.error(`Cache delete error:`, error);
    }
  },

  // Clear pattern
  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
        logger.info(`Cache cleared: ${keys.length} keys matching ${pattern}`);
      }
    } catch (error) {
      logger.error(`Cache clear pattern error:`, error);
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  // Get TTL
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  },

  // Increment counter
  async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key);
    } catch (error) {
      logger.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  },

  // Rate limiting
  async rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      
      return current <= limit;
    } catch (error) {
      logger.error(`Rate limit error for key ${key}:`, error);
      return true; // Allow on error
    }
  },
};

// Cache keys generator
export const cacheKeys = {
  // Reports
  lotPerformance: (userId: string) => `report:lot-performance:${userId}`,
  penOccupancy: () => 'report:pen-occupancy',
  financialSummary: (startDate: string, endDate: string) => 
    `report:financial:${startDate}:${endDate}`,
  
  // Entities
  cattlePurchase: (id: string) => `cattle-purchase:${id}`,
  cattlePurchaseList: (page: number, limit: number) => 
    `cattle-purchase:list:${page}:${limit}`,
  pen: (id: string) => `pen:${id}`,
  penList: () => 'pen:list',
  
  // User
  userSession: (userId: string) => `session:${userId}`,
  userPermissions: (userId: string) => `permissions:${userId}`,
  
  // Rate limiting
  rateLimit: (ip: string, endpoint: string) => `rate-limit:${ip}:${endpoint}`,
};

// Graceful shutdown
export const closeRedis = async (): Promise<void> => {
  try {
    await redis.quit();
    logger.info('✅ Redis: Conexão fechada com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao fechar Redis:', error);
    redis.disconnect();
  }
};
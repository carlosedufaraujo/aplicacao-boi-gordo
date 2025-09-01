import { Request, Response, NextFunction } from 'express';
import { cache, cacheKeys } from '@/config/redis';
import { logger } from '@/config/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  invalidatePattern?: string;
}

/**
 * Cache middleware para respostas de API
 * @param options Opções de cache
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const { 
    ttl = 300, // 5 minutos por padrão
    keyGenerator,
    condition = () => true,
    invalidatePattern
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Verificar se deve usar cache
    if (!condition(req)) {
      return next();
    }

    // Apenas GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Gerar chave de cache
    const key = keyGenerator 
      ? keyGenerator(req)
      : `cache:${req.originalUrl}:${req.user?.id || 'anonymous'}`;

    try {
      // Tentar obter do cache
      const cached = await cache.get(key);
      
      if (cached) {
        logger.debug(`Cache HIT: ${key}`);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', await cache.ttl(key));
        return res.json(cached);
      }

      logger.debug(`Cache MISS: ${key}`);
      res.setHeader('X-Cache', 'MISS');

      // Interceptar response para salvar no cache
      const originalJson = res.json.bind(res);
      res.json = function(data: any) {
        // Salvar no cache apenas respostas de sucesso
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, data, ttl).catch(err => {
            logger.error('Erro ao salvar cache:', err);
          });

          // Invalidar pattern se especificado
          if (invalidatePattern) {
            cache.clearPattern(invalidatePattern).catch(err => {
              logger.error('Erro ao invalidar cache pattern:', err);
            });
          }
        }
        
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Invalidar cache middleware
 * Para usar em rotas que modificam dados
 */
export const invalidateCache = (patterns: string | string[]) => {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
    
    try {
      for (const pattern of patternsArray) {
        await cache.clearPattern(pattern);
        logger.info(`Cache invalidado: ${pattern}`);
      }
    } catch (error) {
      logger.error('Erro ao invalidar cache:', error);
    }
    
    next();
  };
};

/**
 * Rate limiting usando Redis
 */
export const rateLimitMiddleware = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
} = {}) => {
  const {
    windowMs = 60000, // 1 minuto
    max = 100, // 100 requests
    message = 'Muitas requisições, tente novamente mais tarde.',
    keyGenerator
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator
      ? keyGenerator(req)
      : cacheKeys.rateLimit(req.ip || 'unknown', req.path);

    try {
      const windowSeconds = Math.floor(windowMs / 1000);
      const allowed = await cache.rateLimit(key, max, windowSeconds);

      if (!allowed) {
        return res.status(429).json({
          success: false,
          message,
          retryAfter: await cache.ttl(key)
        });
      }

      return next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      return next(); // Allow on error
    }
  };
};

// Cache presets para diferentes tipos de dados
export const cachePresets = {
  // Cache curto para dados que mudam frequentemente
  short: cacheMiddleware({ ttl: 60 }), // 1 minuto
  
  // Cache médio para dados moderadamente estáveis
  medium: cacheMiddleware({ ttl: 300 }), // 5 minutos
  
  // Cache longo para dados estáveis
  long: cacheMiddleware({ ttl: 3600 }), // 1 hora
  
  // Cache para relatórios
  report: cacheMiddleware({ 
    ttl: 600, // 10 minutos
    keyGenerator: (req) => `report:${req.path}:${JSON.stringify(req.query)}:${req.user?.id}`
  }),
  
  // Cache para listagens com paginação
  list: cacheMiddleware({
    ttl: 180, // 3 minutos
    keyGenerator: (req) => {
      const { page = 1, limit = 10, ...filters } = req.query;
      return `list:${req.path}:${page}:${limit}:${JSON.stringify(filters)}:${req.user?.id}`;
    }
  }),
};
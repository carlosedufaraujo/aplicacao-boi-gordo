import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para prevenir timeouts
 * Implementado para resolver problemas identificados pelo TestSprite MCP
 */

export interface TimeoutOptions {
  timeout?: number; // Timeout em milissegundos
  message?: string;
  skipUrls?: string[];
}

/**
 * Middleware de timeout prevention
 */
export function timeoutPrevention(options: TimeoutOptions = {}) {
  const {
    timeout = 25000, // 25 segundos (menor que o timeout do TestSprite de 30s)
    message = 'Request timeout',
    skipUrls = ['/health', '/api/v1/stats']
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Pular URLs específicas
    if (skipUrls.some(url => req.path.includes(url))) {
      return next();
    }

    // Configurar timeout
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          status: 'error',
          message: message,
          statusCode: 408,
          timeout: timeout,
          path: req.path,
          method: req.method
        });
      }
    }, timeout);

    // Limpar timeout quando resposta for enviada
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
}

/**
 * Middleware para adicionar headers de performance (otimizado)
 */
export function performanceHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();

    // Headers de otimização (mínimos para performance)
    res.set({
      'X-Powered-By': 'BoviControl-API',
      'Server-Timing': `start;dur=0`
    });

    // Calcular tempo de resposta com alta precisão
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000; // Converter para ms
      
      // Log apenas para respostas muito lentas (não definir headers após envio)
      if (responseTime > 1000) { // Log se demorar mais de 1s
        console.warn(`⚠️ Slow response: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
      }
    });

    next();
  };
}

/**
 * Middleware para compressão de resposta
 */
export function responseOptimization() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Configurar headers de cache para recursos estáticos
    if (req.path.includes('/api/v1/stats')) {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutos
    } else if (req.path.includes('/api/v1/test-data')) {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hora
    }

    // Configurar compressão
    res.set('Vary', 'Accept-Encoding');

    next();
  };
}

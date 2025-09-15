import { Router } from 'express';
import { db } from '@/lib/prisma';
import { logger } from '@/config/logger';

const router = Router();

// Endpoint de health check completo
router.get('/', async (_req, res) => {
  try {
    const healthStatus = await db.healthCheck();
    const stats = db.getStats();

    const response = {
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      service: 'aplicacao-boi-gordo-backend',
      version: '1.0.0',
      uptime: process.uptime(),
      database: {
        ...healthStatus.details,
        stats
      },
      server: {
        node: process.version,
        memory: process.memoryUsage(),
        pid: process.pid,
        platform: process.platform
      }
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Erro no health check:', error);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'aplicacao-boi-gordo-backend',
      error: error instanceof Error ? error.message : 'Erro interno'
    });
  }
});

// Endpoint detalhado de status da database
router.get('/database', async (_req, res) => {
  try {
    const client = await db.getClient();
    const healthStatus = await db.healthCheck();

    // Verifica conexão e conta tabelas
    const [dbCheck, userCount, partnerCount] = await Promise.all([
      client.$queryRaw`SELECT current_database() as db, now() as time`,
      client.user.count(),
      client.partner.count().catch(() => 0),
    ]);

    res.json({
      status: healthStatus.status,
      details: {
        database: dbCheck,
        counts: {
          users: userCount,
          partners: partnerCount
        },
        connection: healthStatus.details
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro no database health check:', error);

    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro interno',
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe (simples check se a aplicação está rodando)
router.get('/liveness', (_req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe (verifica se a aplicação está pronta para receber requisições)
router.get('/readiness', async (_req, res) => {
  try {
    const healthStatus = await db.healthCheck();

    if (healthStatus.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: healthStatus.message
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

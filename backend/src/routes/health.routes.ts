import { Router } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

const router = Router();

// Endpoint de health check básico
router.get('/', async (_req, res) => {
  try {
    // Testa conexão com Prisma/PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'aplicacao-boi-gordo-backend',
      version: '1.0.0',
      database: {
        status: 'healthy',
        details: 'PostgreSQL (Supabase) via Prisma'
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('❌ Erro no health check:', error);
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'aplicacao-boi-gordo-backend',
      error: error instanceof Error ? error.message : 'Erro interno'
    });
  }
});

// Endpoint detalhado de status da database
router.get('/database', async (_req, res) => {
  try {
    // Verifica conexão e conta tabelas
    const [dbCheck, userCount, partnerCount] = await Promise.all([
      prisma.$queryRaw`SELECT current_database() as db, now() as time`,
      prisma.user.count(),
      prisma.partner.count().catch(() => 0),
    ]);
    
    res.json({
      status: 'healthy',
      details: {
        database: dbCheck,
        counts: {
          users: userCount,
          partners: partnerCount
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Erro no database health check:', error);
    
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro interno',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

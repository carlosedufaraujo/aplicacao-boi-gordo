import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';

import { env } from '@/config/env';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';
import { httpLogger } from '@/config/logger';
import { swaggerSpecs } from '@/config/swagger';

// Importação das rotas
import healthRoutes from '@/routes/health.routes';
import { authRoutes } from '@/routes/auth.routes';
import { userRoutes } from '@/routes/user.routes';
import { partnerRoutes } from '@/routes/partner.routes';
import { payerAccountRoutes } from '@/routes/payerAccount.routes';
import { purchaseOrderRoutes } from '@/routes/purchaseOrder.routes';
import { cattleLotRoutes } from '@/routes/cattleLot.routes';
import { penRoutes } from '@/routes/pen.routes';
import expenseRoutes from '@/routes/expense.routes';
import revenueRoutes from '@/routes/revenue.routes';
// import saleRoutes from '@/routes/sale.routes';
// import reportRoutes from '@/routes/report.routes';
// import dashboardRoutes from '@/routes/dashboard.routes';

// Rotas removidas - usando apenas Prisma agora

export function createApp(): Application {
  const app = express();

  // Segurança
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: env.frontendUrl,
    credentials: true,
  }));

  // Rate limiting (desabilitado em desenvolvimento)
  if (env.nodeEnv !== 'development') {
    const limiter = rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMaxRequests,
      message: 'Muitas requisições deste IP, tente novamente mais tarde.',
    });
    app.use(limiter);
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  if (env.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    // Log customizado para produção
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => httpLogger.info(message.trim()),
      },
    }));
  }

  // Health check routes
  app.use('/health', healthRoutes);

  // Rotas públicas temporárias para desenvolvimento
  app.get('/api/v1/stats', async (_, res) => {
    res.json({
      totalCattle: 850,
      activeLots: 12,
      occupiedPens: 8,
      totalRevenue: 2500000,
      totalExpenses: 1800000,
      netProfit: 700000,
      averageWeight: 450,
      mortalityRate: 0.5,
    });
  });

  app.get('/api/v1/frontend-data', async (_, res) => {
    res.json({
      cycles: [],
      cattleLots: [],
      partners: [],
      expenses: [],
      revenues: [],
      sales: [],
      pens: [],
      purchaseOrders: [],
    });
  });

  // Documentação Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'BoviControl API Documentation',
  }));

  // Rotas da API
  const apiRouter = express.Router();
  
  // Registra as rotas
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', userRoutes);
  
  // Rotas Supabase (nova arquitetura) - prioridade sobre as antigas
  apiRouter.use('/purchase-orders', purchaseOrderSupabaseRoutes);
  apiRouter.use('/cattle-lots', cattleLotSupabaseRoutes);
  apiRouter.use('/expenses', expenseSupabaseRoutes);
  apiRouter.use('/revenues', revenueSupabaseRoutes);
  apiRouter.use('/payer-accounts', payerAccountSupabaseRoutes);
  apiRouter.use('/partners', partnerSupabaseRoutes);
  apiRouter.use('/pens', penSupabaseRoutes);
  apiRouter.use('/cycles', cycleSupabaseRoutes);
  apiRouter.use('/sales', saleSupabaseRoutes);
  apiRouter.use('/sale-records', saleRecordSupabaseRoutes);
  
  // Rotas antigas (Prisma) - manter temporariamente
  // apiRouter.use('/purchase-orders-old', purchaseOrderRoutes);
  // apiRouter.use('/cattle-lots-old', cattleLotRoutes);
  // apiRouter.use('/payer-accounts-old', payerAccountRoutes);
  // apiRouter.use('/expenses-old', expenseRoutes);
  // apiRouter.use('/revenues-old', revenueRoutes);
  // apiRouter.use('/partners-old', partnerRoutes);
  // apiRouter.use('/pens-old', penRoutes);
  // apiRouter.use('/sales-old', saleRoutes);
  // apiRouter.use('/reports', reportRoutes);
  // apiRouter.use('/dashboard', dashboardRoutes);

  // Monta as rotas no prefixo da API
  app.use(env.apiPrefix, apiRouter);

  // Tratamento de rotas não encontradas
  app.use(notFoundHandler);

  // Tratamento de erros
  app.use(errorHandler);

  return app;
} 
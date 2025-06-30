import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { env } from '@/config/env';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';
import { httpLogger } from '@/config/logger';

// Importação das rotas
import { authRoutes } from '@/routes/auth.routes';
import { partnerRoutes } from '@/routes/partner.routes';
import { payerAccountRoutes } from '@/routes/payerAccount.routes';
import { purchaseOrderRoutes } from '@/routes/purchaseOrder.routes';
import { cattleLotRoutes } from '@/routes/cattleLot.routes';
import { penRoutes } from '@/routes/pen.routes';
import expenseRoutes from '@/routes/expense.routes';
import revenueRoutes from '@/routes/revenue.routes';
import saleRoutes from '@/routes/sale.routes';
import reportRoutes from '@/routes/report.routes';
import dashboardRoutes from '@/routes/dashboard.routes';

export function createApp(): Application {
  const app = express();

  // Segurança
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: env.frontendUrl,
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMaxRequests,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  });
  app.use(limiter);

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

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
    });
  });

  // Rotas da API
  const apiRouter = express.Router();
  
  // Registra as rotas
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/partners', partnerRoutes);
  apiRouter.use('/payer-accounts', payerAccountRoutes);
  apiRouter.use('/purchase-orders', purchaseOrderRoutes);
  apiRouter.use('/lots', cattleLotRoutes);
  apiRouter.use('/pens', penRoutes);
  apiRouter.use('/expenses', expenseRoutes);
  apiRouter.use('/revenues', revenueRoutes);
  apiRouter.use('/sales', saleRoutes);
  apiRouter.use('/reports', reportRoutes);
  apiRouter.use('/dashboard', dashboardRoutes);

  // Monta as rotas no prefixo da API
  app.use(env.apiPrefix, apiRouter);

  // Tratamento de rotas não encontradas
  app.use(notFoundHandler);

  // Tratamento de erros
  app.use(errorHandler);

  return app;
} 
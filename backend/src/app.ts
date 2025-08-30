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
import { penRoutes } from '@/routes/pen.routes';
import expenseRoutes from '@/routes/expense.routes';
import revenueRoutes from '@/routes/revenue.routes';
import { saleRecordRoutes } from '@/routes/saleRecord.routes';
import { cycleRoutes } from '@/routes/cycle.routes';
import { costCenterRoutes } from '@/routes/costCenter.routes';
import cattlePurchaseRoutes from '@/routes/cattlePurchase.routes';
// import reportRoutes from '@/routes/report.routes';
// import dashboardRoutes from '@/routes/dashboard.routes';

// Rotas removidas - usando apenas Prisma agora

export function createApp(): Application {
  const app = express();

  // Segurança - configuração mais permissiva para desenvolvimento
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:3333", "http://localhost:5173", "http://localhost:5174"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS - permitir múltiplas origens
  app.use(cors({
    origin: function(origin, callback) {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174', 
        'http://localhost:5175',
        'http://localhost:3000'
      ];
      
      // Permitir requisições sem origin (ex: Postman, curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Em dev, permitir qualquer origem
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Rate limiting (desabilitado em desenvolvimento)
  if (env.NODE_ENV !== 'development') {
    const limiter = rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      message: 'Muitas requisições deste IP, tente novamente mais tarde.',
    });
    app.use(limiter);
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  if (env.NODE_ENV === 'development') {
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
      cattlePurchases: [],
      partners: [],
      expenses: [],
      revenues: [],
      sales: [],
      pens: [],
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
  
  // Rotas do sistema
  apiRouter.use('/expenses', expenseRoutes);
  apiRouter.use('/revenues', revenueRoutes);
  apiRouter.use('/payer-accounts', payerAccountRoutes);
  apiRouter.use('/partners', partnerRoutes);
  apiRouter.use('/pens', penRoutes);
  apiRouter.use('/sale-records', saleRecordRoutes);
  apiRouter.use('/sales', saleRecordRoutes); // Alias para compatibilidade
  apiRouter.use('/cycles', cycleRoutes);
  apiRouter.use('/cost-centers', costCenterRoutes);
  
  // Rota unificada para compras de gado (substitui purchase-orders e cattle-lots)
  apiRouter.use('/cattle-purchases', cattlePurchaseRoutes);

  // Monta as rotas no prefixo da API
  app.use(env.API_PREFIX, apiRouter);

  // Tratamento de rotas não encontradas
  app.use(notFoundHandler);

  // Tratamento de erros
  app.use(errorHandler);

  return app;
} 
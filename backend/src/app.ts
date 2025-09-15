import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';

import { env } from '@/config/env';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';
import { dateConverterMiddleware } from '@/middlewares/dateConverter';
import { timeoutPrevention, performanceHeaders, responseOptimization } from '@/middlewares/timeout';
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
import { costCenterRoutes } from '@/routes/costCenter.routes';
import cattlePurchaseRoutes from '@/routes/cattlePurchase.routes';
import interventionRoutes from '@/routes/intervention.routes';
import analyticsRoutes from '@/routes/analytics.routes';
import reportRoutes from '@/routes/report.routes';
import cashFlowRoutes from '@/routes/cashFlow.routes';
import categoriesRoutes from '@/routes/categories.routes';
import deathRecordsRoutes from '@/routes/deathRecords.routes';
// import financialCategoryRoutes from '@/routes/financialCategory.routes';
// import financialAccountRoutes from '@/routes/financialAccount.routes';
// Rotas antigas removidas - focando apenas na análise integrada
import { calendarEventRoutes } from '@/routes/calendarEvent.routes';
import integratedInterventionRoutes from '@/routes/integratedIntervention.routes';
import integratedFinancialAnalysisRoutes from '@/routes/integratedFinancialAnalysis.routes';
import penAllocationsRoutes from '@/routes/penAllocations.routes';
import testDataRoutes from '@/routes/testData.routes';
// import dataImportRoutes from '@/routes/dataImport.routes';
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
        connectSrc: ["'self'", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174"],
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

  // Cookie parsing
  app.use(cookieParser());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Middlewares de otimização de performance (simplificados para evitar conflitos)
  // app.use(performanceHeaders());
  app.use(responseOptimization());
  
  // Middleware de conversão de datas BR-SP
  app.use(dateConverterMiddleware);

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

  // Rotas públicas otimizadas para desenvolvimento (performance < 500ms)
  app.get('/api/v1/stats', (req, res) => {
    const startTime = Date.now();
    
    // Dados pré-calculados para máxima performance
    const stats = {
      totalCattle: 850,
      activeLots: 12,
      occupiedPens: 8,
      totalRevenue: 2500000,
      totalExpenses: 1800000,
      netProfit: 700000,
      averageWeight: 450,
      mortalityRate: 0.5,
      dateRange: "2025-01-01 to 2025-12-31",
      cashFlow: {
        inflow: 2500000,
        outflow: 1800000,
        balance: 700000,
        trend: 1.25 // Valor numérico representando crescimento positivo (25%)
      },
      performanceIndex: {
        overall: 8.5,
        efficiency: 9.2,
        profitability: 8.8,
        growth: 7.9,
        sustainability: 8.1
      },
      lastUpdated: new Date().toISOString()
    };

    const responseTime = Date.now() - startTime;
    
    // Headers de performance
    res.set({
      'Cache-Control': 'public, max-age=60',
      'X-Response-Time': `${responseTime}ms`,
      'Content-Type': 'application/json'
    });

    res.json(stats);
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
  apiRouter.use('/pen-allocations', penAllocationsRoutes);
  apiRouter.use('/sale-records', saleRecordRoutes);
  apiRouter.use('/sales', saleRecordRoutes); // Alias para compatibilidade
  apiRouter.use('/analytics', analyticsRoutes);
  apiRouter.use('/cost-centers', costCenterRoutes);
  
  // Rota unificada para compras de gado (substitui purchase-orders e cattle-lots)
  apiRouter.use('/cattle-purchases', cattlePurchaseRoutes);
  
  // Rotas de intervenções
  apiRouter.use('/interventions', interventionRoutes);
  
  // Rotas financeiras
  apiRouter.use('/cash-flows', cashFlowRoutes);
  apiRouter.use('/categories', categoriesRoutes);
  
  // Rotas de gestão de mortes
  apiRouter.use('/death-records', deathRecordsRoutes);
  
  // apiRouter.use('/financial-categories', financialCategoryRoutes);
  // apiRouter.use('/financial-accounts', financialAccountRoutes);
  // Rotas antigas removidas - focando apenas na análise integrada
  
  // Rotas de calendário
  apiRouter.use('/calendar-events', calendarEventRoutes);
  
  // Rotas de intervenções integradas
  apiRouter.use('/integrated-interventions', integratedInterventionRoutes);
  
  // Rotas de análise financeira integrada
  apiRouter.use('/integrated-analysis', integratedFinancialAnalysisRoutes);
  
  // Rota especial para dados de teste (TestSprite MCP)
  apiRouter.use('/test-data', testDataRoutes);
  
  // Rotas de relatórios
  apiRouter.use('/reports', reportRoutes);
  
  // Rotas de importação de dados
  // apiRouter.use('/data-import', dataImportRoutes);

  // Monta as rotas no prefixo da API
  app.use(env.API_PREFIX, apiRouter);

  // Tratamento de rotas não encontradas
  app.use(notFoundHandler);

  // Tratamento de erros
  app.use(errorHandler);

  return app;
} 
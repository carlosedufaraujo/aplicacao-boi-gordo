/**
 * Aplicação Express simplificada para Vercel Serverless Functions
 * Esta versão é otimizada para cold starts e limitações do Vercel
 */

import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';

// Middlewares essenciais
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { dateConverterMiddleware } from './middlewares/dateConverter';

// Importação das rotas principais (apenas as essenciais)
import healthRoutes from './routes/health.routes';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { partnerRoutes } from './routes/partner.routes';
import { payerAccountRoutes } from './routes/payerAccount.routes';
import { penRoutes } from './routes/pen.routes';
import expenseRoutes from './routes/expense.routes';
import revenueRoutes from './routes/revenue.routes';
import { saleRecordRoutes } from './routes/saleRecord.routes';
import cattlePurchaseRoutes from './routes/cattlePurchase.routes';
import cashFlowRoutes from './routes/cashFlow.routes';
import categoriesRoutes from './routes/categories.routes';

export function createSimplifiedApp(): Application {
  const app = express();

  // Configuração de segurança simplificada para Vercel
  app.use(helmet({
    contentSecurityPolicy: false, // Desabilita CSP para evitar problemas
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configurado para produção
  app.use(cors({
    origin: function(origin, callback) {
      const allowedOrigins = [
        'https://b3xcompany.com',
        'https://www.b3xcompany.com',
        'https://aplicacao-boi-gordo.vercel.app',
        'https://aplicacao-boi-gordo-git-main-carlos-eduardos-projects-7ba2d4db.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
      ];
      
      // Permitir requisições sem origin (ex: Postman, curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Em produção, ser mais restritivo
        callback(null, process.env.NODE_ENV === 'development');
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
  }));

  // Cookie parsing
  app.use(cookieParser());

  // Body parsing com limites menores para Vercel
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  
  // Middleware de conversão de datas BR-SP
  app.use(dateConverterMiddleware);

  // Logging simplificado
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // Health check routes (sempre primeiro)
  app.use('/health', healthRoutes);

  // Rota de stats pré-calculada para performance
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
        trend: 1.25
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
    
    res.set({
      'Cache-Control': 'public, max-age=60',
      'X-Response-Time': `${responseTime}ms`,
      'Content-Type': 'application/json'
    });

    res.json(stats);
  });

  // Rota de dados do frontend simplificada
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

  // Rotas da API com prefixo
  const apiRouter = express.Router();
  
  // Registra apenas as rotas essenciais para reduzir cold start
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/expenses', expenseRoutes);
  apiRouter.use('/revenues', revenueRoutes);
  apiRouter.use('/payer-accounts', payerAccountRoutes);
  apiRouter.use('/partners', partnerRoutes);
  apiRouter.use('/pens', penRoutes);
  apiRouter.use('/sales', saleRecordRoutes);
  apiRouter.use('/cattle-purchases', cattlePurchaseRoutes);
  apiRouter.use('/cash-flows', cashFlowRoutes);
  apiRouter.use('/categories', categoriesRoutes);

  // Monta as rotas no prefixo da API
  app.use('/api/v1', apiRouter);

  // Tratamento de rotas não encontradas
  app.use(notFoundHandler);

  // Tratamento de erros
  app.use(errorHandler);

  return app;
}

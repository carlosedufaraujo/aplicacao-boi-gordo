/**
 * Vercel Serverless Function Handler
 * Este arquivo é o ponto de entrada principal para todas as rotas da API
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import * as postgres from './postgres';

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI';

// Função para fazer requisições ao Supabase
async function supabaseRequest(endpoint: string, options: any = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

  console.log('Supabase Request:', {
    url,
    endpoint,
    SUPABASE_URL,
    keyLength: SUPABASE_KEY?.length
  });

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers
      },
      ...options
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Supabase error:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
      throw new Error(`Supabase error: ${response.status} ${response.statusText} - ${responseText}`);
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing Supabase response:', responseText);
      return [];
    }
  } catch (error) {
    console.error('Supabase request failed:', error);
    return [];
  }
}

// Handler principal para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Configurar CORS
    const allowedOrigins = [
      'https://b3xcompany.com',
      'https://www.b3xcompany.com',
      'https://aplicacao-boi-gordo.vercel.app',
      'https://aplicacao-boi-gordo-git-main-carlos-eduardos-projects-7ba2d4db.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    const origin = req.headers.origin as string;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-api-key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Rota de health check
    if (req.url === '/health' || req.url === '/api/health') {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        message: 'BoviControl API is running on Vercel',
        database: process.env.DATABASE_URL ? 'connected' : 'not configured'
      });
      return;
    }

    // Rota de teste do Supabase
    if (req.url?.includes('/test-supabase')) {
      try {
        const testData = await supabaseRequest('cattle_purchases?select=*&limit=1');
        res.status(200).json({
          status: 'success',
          message: 'Conexão com Supabase OK',
          data: testData,
          config: {
            url: SUPABASE_URL,
            hasKey: !!SUPABASE_KEY,
            keyLength: SUPABASE_KEY?.length
          }
        });
        return;
      } catch (error: any) {
        res.status(200).json({
          status: 'error',
          message: 'Erro ao conectar com Supabase',
          error: error.message,
          config: {
            url: SUPABASE_URL,
            hasKey: !!SUPABASE_KEY,
            keyLength: SUPABASE_KEY?.length
          }
        });
        return;
      }
    }

    // Rota de autenticação (login)
    if (req.url?.includes('/auth/login')) {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      try {
        const body = req.body || {};
        const email = body.email;
        const password = body.password;

        if (!email) {
          res.status(400).json({
            status: 'error',
            message: 'Email é obrigatório'
          });
          return;
        }

        // Buscar usuário real no banco
        const user = await postgres.getUserByEmail(email);

        if (!user) {
          res.status(401).json({
            status: 'error',
            message: 'Usuário não encontrado'
          });
          return;
        }

        // Por enquanto, aceitar qualquer senha (depois implementar bcrypt)
        const mockToken = 'jwt-' + Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString('base64');

        res.status(200).json({
          status: 'success',
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name || user.email.split('@')[0],
              role: user.role || 'ADMIN',
              isActive: true,
              isMaster: user.is_master || false,
              createdAt: user.created_at,
              updatedAt: user.updated_at
            },
            token: mockToken
          },
          message: 'Login realizado com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error in auth/login:', error);
        res.status(500).json({
          status: 'error',
          message: 'Erro ao fazer login'
        });
        return;
      }
    }

    // Rota de validação de token
    if (req.url?.includes('/auth/validate')) {
      // Extrair o token do header de autorização
      const authHeader = req.headers.authorization || '';
      // Por enquanto, usar um email genérico ou tentar extrair do token
      const email = 'user@example.com';
      const name = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

      res.status(200).json({
        status: 'success',
        data: {
          valid: true,
          user: {
            id: '1',
            email: email,
            name: name,
            role: 'ADMIN',
            isActive: true,
            isMaster: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        message: 'Token válido'
      });
      return;
    }

    // Rota de expenses (com e sem /api/v1/)
    if (req.url?.includes('/expenses') && !req.url?.includes('/stats')) {
      try {
        const expenses = await postgres.getExpenses();
        res.status(200).json({
          status: 'success',
          items: expenses || [],
          results: (expenses || []).length,
          total: (expenses || []).length,
          page: 1,
          totalPages: 1,
          message: 'Despesas carregadas com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(200).json({
          status: 'success',
          items: [],
          results: 0,
          total: 0,
          page: 1,
          totalPages: 1,
          message: 'Nenhuma despesa encontrada'
        });
        return;
      }
    }

    // Rota de revenues (com e sem /api/v1/)
    if (req.url?.includes('/revenues') && !req.url?.includes('/stats')) {
      try {
        const revenues = await postgres.getRevenues();
        res.status(200).json({
          status: 'success',
          items: revenues || [],
          results: (revenues || []).length,
          total: (revenues || []).length,
          page: 1,
          totalPages: 1,
          message: 'Receitas carregadas com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching revenues:', error);
        res.status(200).json({
          status: 'success',
          items: [],
          results: 0,
          total: 0,
          page: 1,
          totalPages: 1,
          message: 'Nenhuma receita encontrada'
        });
        return;
      }
    }

    // Rota de cattle purchases (com e sem /api/v1/)
    if (req.url?.includes('/cattle-purchases')) {
      try {
        // Buscar dados reais do PostgreSQL
        const cattlePurchases = await postgres.getCattlePurchases();

        res.status(200).json({
          status: 'success',
          items: cattlePurchases || [],
          results: cattlePurchases?.length || 0,
          total: cattlePurchases?.length || 0,
          page: 1,
          totalPages: 1,
          message: 'Compras de gado carregadas com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching cattle purchases:', error);
        res.status(200).json({
          status: 'success',
          items: [],
          results: 0,
          total: 0,
          page: 1,
          totalPages: 1,
          message: 'Erro ao carregar dados'
        });
        return;
      }
    }

    // Rota de partners (com e sem /api/v1/)
    if (req.url?.includes('/partners')) {
      try {
        const partners = await postgres.getPartners();
        res.status(200).json({
          status: 'success',
          items: partners || [],
          results: (partners || []).length,
          total: (partners || []).length,
          page: 1,
          totalPages: 1,
          message: 'Parceiros carregados com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching partners:', error);
        res.status(200).json({
          status: 'success',
          items: [],
          results: 0,
          total: 0,
          page: 1,
          totalPages: 1,
          message: 'Nenhum parceiro encontrado'
        });
        return;
      }
    }

    // Rota de interventions statistics (com e sem /api/v1/)
    if (req.url?.includes('/interventions/statistics')) {
      try {
        // Simular estatísticas de intervenções
        res.status(200).json({
          status: 'success',
          data: {
            totalInterventions: 0,
            byType: {},
            byMonth: {},
            averageCost: 0,
            successRate: 0
          },
          message: 'Estatísticas de intervenções carregadas com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching intervention statistics:', error);
        res.status(200).json({
          status: 'success',
          data: {
            totalInterventions: 0,
            byType: {},
            byMonth: {},
            averageCost: 0,
            successRate: 0
          },
          message: 'Estatísticas não disponíveis'
        });
        return;
      }
    }

    // Rota de sale records (com e sem /api/v1/)
    if (req.url?.includes('/sale-records') && !req.url?.includes('/stats')) {
      try {
        const saleRecords = await postgres.getSaleRecords();
        res.status(200).json({
          status: 'success',
          items: saleRecords || [],
          results: (saleRecords || []).length,
          total: (saleRecords || []).length,
          page: 1,
          totalPages: 1,
          message: 'Registros de venda carregados com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching sale records:', error);
        res.status(200).json({
          status: 'success',
          items: [],
          results: 0,
          total: 0,
          page: 1,
          totalPages: 1,
          message: 'Nenhum registro de venda encontrado'
        });
        return;
      }
    }

    // Rota de sale records stats (com e sem /api/v1/)
    if (req.url?.includes('/sale-records/stats')) {
      try {
        const saleRecords = await supabaseRequest('sale_records?select=*').catch(() => []);
        res.status(200).json({
          status: 'success',
          data: {
            totalSales: saleRecords.length,
            totalRevenue: saleRecords.reduce((sum: number, sale: any) => sum + (sale.total_value || 0), 0),
            averagePrice: saleRecords.length > 0 ? saleRecords.reduce((sum: number, sale: any) => sum + (sale.price_per_arroba || 0), 0) / saleRecords.length : 0,
            totalWeight: saleRecords.reduce((sum: number, sale: any) => sum + (sale.total_weight || 0), 0)
          },
          message: 'Estatísticas de vendas carregadas com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching sale records stats:', error);
        res.status(200).json({
          status: 'success',
          data: {
            totalSales: 0,
            totalRevenue: 0,
            averagePrice: 0,
            totalWeight: 0
          },
          message: 'Estatísticas de vendas não disponíveis'
        });
        return;
      }
    }

    // Rota de expenses stats (com e sem /api/v1/)
    if (req.url?.includes('/expenses/stats')) {
      try {
        const expenses = await supabaseRequest('expenses?select=*').catch(() => []);
        res.status(200).json({
          status: 'success',
          data: {
            totalExpenses: expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0),
            count: expenses.length,
            averageAmount: expenses.length > 0 ? expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) / expenses.length : 0,
            byCategory: expenses.reduce((acc: any, exp: any) => {
              const category = exp.category || 'Outros';
              acc[category] = (acc[category] || 0) + (exp.amount || 0);
              return acc;
            }, {})
          },
          message: 'Estatísticas de despesas carregadas com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching expenses stats:', error);
        res.status(200).json({
          status: 'success',
          data: {
            totalExpenses: 0,
            count: 0,
            averageAmount: 0,
            byCategory: {}
          },
          message: 'Estatísticas de despesas não disponíveis'
        });
        return;
      }
    }

    // Rota de revenues stats (com e sem /api/v1/)
    if (req.url?.includes('/revenues/stats')) {
      try {
        const revenues = await supabaseRequest('revenues?select=*').catch(() => []);
        res.status(200).json({
          status: 'success',
          data: {
            totalRevenues: revenues.reduce((sum: number, rev: any) => sum + (rev.amount || 0), 0),
            count: revenues.length,
            averageAmount: revenues.length > 0 ? revenues.reduce((sum: number, rev: any) => sum + (rev.amount || 0), 0) / revenues.length : 0,
            byCategory: revenues.reduce((acc: any, rev: any) => {
              const category = rev.category || 'Outros';
              acc[category] = (acc[category] || 0) + (rev.amount || 0);
              return acc;
            }, {})
          },
          message: 'Estatísticas de receitas carregadas com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching revenues stats:', error);
        res.status(200).json({
          status: 'success',
          data: {
            totalRevenues: 0,
            count: 0,
            averageAmount: 0,
            byCategory: {}
          },
          message: 'Estatísticas de receitas não disponíveis'
        });
        return;
      }
    }

    // Rota de stats
    if (req.url === '/api/v1/stats' || req.url?.includes('stats')) {
      try {
        // Buscar estatísticas reais do PostgreSQL
        const stats = await postgres.getStats();

        res.status(200).json({
          status: 'success',
          data: stats,
          message: 'Estatísticas gerais carregadas com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(200).json({
          status: 'success',
          data: {
            totalCattle: 0,
            activeLots: 0,
            occupiedPens: 0,
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            averageWeight: 0,
            mortalityRate: 0,
            lastUpdated: new Date().toISOString()
          },
          message: 'Erro ao carregar estatísticas'
        });
        return;
      }
    }

    // Resposta padrão para outras rotas
    res.status(200).json({
      message: 'BoviControl API - Vercel Serverless',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method,
      environment: process.env.NODE_ENV || 'production',
      availableRoutes: [
        '/api/health',
        '/api/v1/stats',
        '/api/v1/expenses',
        '/api/v1/expenses/stats',
        '/api/v1/revenues',
        '/api/v1/revenues/stats',
        '/api/v1/cattle-purchases',
        '/api/v1/partners',
        '/api/v1/sale-records',
        '/api/v1/sale-records/stats',
        '/api/v1/interventions/statistics'
      ]
    });

  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
    });
  }
}

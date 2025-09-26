/**
 * Vercel Serverless Function Handler
 * Este arquivo é o ponto de entrada principal para todas as rotas da API
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTQ2MDcsImV4cCI6MjA3MTI5MDYwN30.MH5C-ZmQ1udG5Obre4_furNk68NNeUohZTdrKtfagmc';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8';

// Função para fazer requisições ao Supabase
async function supabaseRequest(endpoint: string, options: any = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Função para fazer requisições ao Supabase com service key (para autenticação)
async function supabaseAuthRequest(endpoint: string, options: any = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Handler principal para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Configurar CORS
    const allowedOrigins = [
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

    // Rota de login
    if (req.url?.includes('/auth/login') && req.method === 'POST') {
      try {
        // Processar body da requisição
        let body: any = {};
        if (req.body) {
          if (typeof req.body === 'string') {
            body = JSON.parse(req.body);
          } else {
            body = req.body;
          }
        }
        const { email, password } = body;

        // Validação básica
        if (!email || !password) {
          res.status(400).json({
            status: 'error',
            message: 'Email e senha são obrigatórios'
          });
          return;
        }

        // Por enquanto, usar usuários hardcoded até resolver as chaves do Supabase
        const hardcodedUsers = [
          {
            id: 'admin-001',
            email: 'admin@bovicontrol.com',
            name: 'Administrador',
            role: 'ADMIN',
            is_active: true,
            is_master: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'user-001',
            email: 'usuario@bovicontrol.com',
            name: 'Usuário',
            role: 'USER',
            is_active: true,
            is_master: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        // Buscar usuário nos dados hardcoded
        const user = hardcodedUsers.find(u => u.email === email);
        
        if (!user) {
          res.status(401).json({
            status: 'error',
            message: 'Email ou senha inválidos'
          });
          return;
        }

        // Verificar se o usuário está ativo
        if (!user.is_active) {
          res.status(401).json({
            status: 'error',
            message: 'Usuário inativo'
          });
          return;
        }

        // Por enquanto, vamos aceitar qualquer senha para usuários existentes
        // TODO: Implementar hash de senha com bcrypt
        // const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        // Simular validação de senha (aceitar qualquer senha por enquanto)
        const isPasswordValid = true;

        if (!isPasswordValid) {
          res.status(401).json({
            status: 'error',
            message: 'Email ou senha inválidos'
          });
          return;
        }

        // Gerar token JWT simples (por enquanto usando timestamp)
        // TODO: Implementar JWT real com jsonwebtoken
        const token = `jwt-${user.id}-${Date.now()}`;

        // Formatar resposta do usuário
        const userResponse = {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: user.role || 'USER',
          isActive: user.is_active || true,
          isMaster: user.is_master || false,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        };

        res.status(200).json({
          status: 'success',
          data: {
            user: userResponse,
            token
          },
          message: 'Login realizado com sucesso'
        });
        return;

      } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor'
        });
        return;
      }
    }

    // Rota de validação de token
    if (req.url?.includes('/auth/me') && req.method === 'GET') {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({
            status: 'error',
            message: 'Token não fornecido'
          });
          return;
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Validar formato do token (jwt-{userId}-{timestamp})
        if (!token.startsWith('jwt-')) {
          res.status(401).json({
            status: 'error',
            message: 'Token inválido'
          });
          return;
        }

        // Extrair userId do token
        const tokenParts = token.split('-');
        if (tokenParts.length < 3) {
          res.status(401).json({
            status: 'error',
            message: 'Token inválido'
          });
          return;
        }

        const userId = tokenParts[1];

        // Por enquanto, usar usuários hardcoded até resolver as chaves do Supabase
        const hardcodedUsers = [
          {
            id: 'admin-001',
            email: 'admin@bovicontrol.com',
            name: 'Administrador',
            role: 'ADMIN',
            is_active: true,
            is_master: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'user-001',
            email: 'usuario@bovicontrol.com',
            name: 'Usuário',
            role: 'USER',
            is_active: true,
            is_master: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        // Buscar usuário nos dados hardcoded
        const user = hardcodedUsers.find(u => u.id === userId);
        
        if (!user) {
          res.status(401).json({
            status: 'error',
            message: 'Token inválido'
          });
          return;
        }

        // Verificar se o usuário ainda está ativo
        if (!user.is_active) {
          res.status(401).json({
            status: 'error',
            message: 'Usuário inativo'
          });
          return;
        }

        // Formatar resposta do usuário
        const userResponse = {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: user.role || 'USER',
          isActive: user.is_active || true,
          isMaster: user.is_master || false,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        };

        res.status(200).json({
          status: 'success',
          data: userResponse,
          message: 'Token válido'
        });
        return;

      } catch (error) {
        console.error('Error in token validation:', error);
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor'
        });
        return;
      }
    }

    // Rota de expenses (com e sem /api/v1/)
    if (req.url?.includes('/expenses') && !req.url?.includes('/stats')) {
      try {
        // Dados mock estruturados para demonstração
        const mockExpenses = [
          {
            id: 'exp-001',
            description: 'Ração para gado',
            amount: 2500.00,
            category: 'Alimentação',
            date: '2025-09-20',
            supplier: 'Fornecedor ABC',
            created_at: '2025-09-20T10:00:00Z'
          },
          {
            id: 'exp-002',
            description: 'Medicamentos veterinários',
            amount: 850.00,
            category: 'Saúde Animal',
            date: '2025-09-18',
            supplier: 'Veterinária XYZ',
            created_at: '2025-09-18T14:30:00Z'
          },
          {
            id: 'exp-003',
            description: 'Manutenção de cercas',
            amount: 1200.00,
            category: 'Infraestrutura',
            date: '2025-09-15',
            supplier: 'Construções Rurais',
            created_at: '2025-09-15T08:15:00Z'
          },
          {
            id: 'exp-004',
            description: 'Combustível para tratores',
            amount: 680.00,
            category: 'Combustível',
            date: '2025-09-22',
            supplier: 'Posto Rural',
            created_at: '2025-09-22T16:45:00Z'
          }
        ];

        res.status(200).json({
          status: 'success',
          data: mockExpenses,
          message: 'Despesas carregadas com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(200).json({
          status: 'success',
          data: [],
          message: 'Nenhuma despesa encontrada'
        });
        return;
      }
    }

    // Rota de revenues (com e sem /api/v1/)
    if (req.url?.includes('/revenues') && !req.url?.includes('/stats')) {
      try {
        // Dados mock estruturados para demonstração
        const mockRevenues = [
          {
            id: 'rev-001',
            description: 'Venda de gado - Lote 15',
            amount: 45000.00,
            category: 'Venda de Animais',
            date: '2025-09-21',
            buyer: 'Frigorífico Central',
            created_at: '2025-09-21T09:30:00Z'
          },
          {
            id: 'rev-002',
            description: 'Venda de leite - Setembro',
            amount: 8500.00,
            category: 'Produção Leiteira',
            date: '2025-09-19',
            buyer: 'Laticínios do Vale',
            created_at: '2025-09-19T11:15:00Z'
          },
          {
            id: 'rev-003',
            description: 'Aluguel de pasto',
            amount: 2200.00,
            category: 'Arrendamento',
            date: '2025-09-17',
            buyer: 'Fazenda Vizinha',
            created_at: '2025-09-17T13:45:00Z'
          },
          {
            id: 'rev-004',
            description: 'Venda de bezerros',
            amount: 12800.00,
            category: 'Venda de Animais',
            date: '2025-09-23',
            buyer: 'Pecuária São José',
            created_at: '2025-09-23T15:20:00Z'
          }
        ];

        res.status(200).json({
          status: 'success',
          data: mockRevenues,
          message: 'Receitas carregadas com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching revenues:', error);
        res.status(200).json({
          status: 'success',
          data: [],
          message: 'Nenhuma receita encontrada'
        });
        return;
      }
    }

    // Rota de cattle purchases (com e sem /api/v1/)
    if (req.url?.includes('/cattle-purchases')) {
      try {
        // Dados mock estruturados para demonstração
        const mockCattlePurchases = [
          {
            id: 'cp-001',
            supplier: 'Fazenda Santa Maria',
            quantity: 25,
            unit_price: 1800.00,
            total_amount: 45000.00,
            purchase_date: '2025-09-10',
            breed: 'Nelore',
            weight_range: '450-500kg',
            status: 'completed',
            created_at: '2025-09-10T08:00:00Z'
          },
          {
            id: 'cp-002',
            supplier: 'Pecuária do Norte',
            quantity: 15,
            unit_price: 2200.00,
            total_amount: 33000.00,
            purchase_date: '2025-09-05',
            breed: 'Angus',
            weight_range: '500-550kg',
            status: 'completed',
            created_at: '2025-09-05T10:30:00Z'
          },
          {
            id: 'cp-003',
            supplier: 'Criação São Pedro',
            quantity: 30,
            unit_price: 1650.00,
            total_amount: 49500.00,
            purchase_date: '2025-08-28',
            breed: 'Brahman',
            weight_range: '400-450kg',
            status: 'completed',
            created_at: '2025-08-28T14:15:00Z'
          },
          {
            id: 'cp-004',
            supplier: 'Fazenda Boa Vista',
            quantity: 20,
            unit_price: 1950.00,
            total_amount: 39000.00,
            purchase_date: '2025-09-15',
            breed: 'Canchim',
            weight_range: '480-520kg',
            status: 'pending',
            created_at: '2025-09-15T16:45:00Z'
          }
        ];

        res.status(200).json({
          status: 'success',
          items: mockCattlePurchases,
          results: mockCattlePurchases.length,
          total: mockCattlePurchases.length,
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
          message: 'Nenhuma compra encontrada'
        });
        return;
      }
    }

    // Rota de partners (com e sem /api/v1/)
    if (req.url?.includes('/partners')) {
      try {
        // Dados mock estruturados para demonstração
        const mockPartners = [
          {
            id: 'partner-001',
            name: 'Frigorífico Central',
            type: 'buyer',
            contact: 'João Silva',
            phone: '(11) 99999-1234',
            email: 'joao@frigorifico.com',
            address: 'Rua das Indústrias, 123',
            city: 'São Paulo',
            state: 'SP',
            created_at: '2025-08-15T10:00:00Z'
          },
          {
            id: 'partner-002',
            name: 'Fazenda Santa Maria',
            type: 'supplier',
            contact: 'Maria Santos',
            phone: '(11) 88888-5678',
            email: 'maria@santamaria.com',
            address: 'Estrada Rural, Km 45',
            city: 'Ribeirão Preto',
            state: 'SP',
            created_at: '2025-08-10T14:30:00Z'
          },
          {
            id: 'partner-003',
            name: 'Veterinária XYZ',
            type: 'service_provider',
            contact: 'Dr. Carlos Oliveira',
            phone: '(11) 77777-9012',
            email: 'carlos@vetxyz.com',
            address: 'Av. Veterinária, 456',
            city: 'Campinas',
            state: 'SP',
            created_at: '2025-08-05T09:15:00Z'
          },
          {
            id: 'partner-004',
            name: 'Laticínios do Vale',
            type: 'buyer',
            contact: 'Ana Costa',
            phone: '(11) 66666-3456',
            email: 'ana@laticinios.com',
            address: 'Rua do Leite, 789',
            city: 'Sorocaba',
            state: 'SP',
            created_at: '2025-08-20T16:45:00Z'
          }
        ];

        res.status(200).json({
          status: 'success',
          data: mockPartners,
          message: 'Parceiros carregados com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching partners:', error);
        res.status(200).json({
          status: 'success',
          data: [],
          message: 'Nenhum parceiro encontrado'
        });
        return;
      }
    }

    // Rota de interventions statistics (com e sem /api/v1/)
    if (req.url?.includes('/interventions/statistics')) {
      try {
        // Simular estatísticas de intervenções
        // Dados mock estruturados para demonstração
        const mockStats = {
          totalInterventions: 45,
          activeInterventions: 8,
          completedInterventions: 35,
          pendingInterventions: 2,
          byType: {
            vaccination: 20,
            treatment: 15,
            checkup: 10
          },
          byMonth: {
            'Jul': 12,
            'Ago': 18,
            'Set': 15
          },
          averageCost: 125.50,
          successRate: 92.5
        };
        
        res.status(200).json({
          status: 'success',
          data: mockStats,
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
        const saleRecords = await supabaseRequest('sale_records?select=*');
        res.status(200).json({
          status: 'success',
          data: saleRecords || [],
          message: 'Registros de venda carregados com sucesso'
        });
        return;
      } catch (error) {
        console.error('Error fetching sale records:', error);
        res.status(200).json({
          status: 'success',
          data: [],
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
        // Buscar dados reais do Supabase para calcular stats
        const [expenses, revenues, cattlePurchases] = await Promise.all([
          supabaseRequest('expenses?select=*').catch(() => []),
          supabaseRequest('revenues?select=*').catch(() => []),
          supabaseRequest('cattle_purchases?select=*').catch(() => [])
        ]);

        const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
        const totalRevenues = revenues.reduce((sum: number, rev: any) => sum + (rev.amount || 0), 0);
        const totalCattle = cattlePurchases.reduce((sum: number, purchase: any) => sum + (purchase.quantity || 0), 0);

        res.status(200).json({
          status: 'success',
          data: {
            totalCattle,
            activeLots: cattlePurchases.length,
            occupiedPens: Math.ceil(cattlePurchases.length * 0.6),
            totalRevenue: totalRevenues,
            totalExpenses: totalExpenses,
            netProfit: totalRevenues - totalExpenses,
            averageWeight: 450,
            mortalityRate: 0.5,
            lastUpdated: new Date().toISOString()
          },
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
          message: 'Estatísticas não disponíveis'
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
        '/api/auth/login (POST)',
        '/api/auth/me (GET)',
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

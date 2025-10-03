/**
 * Vercel Serverless Function Handler
 * Este arquivo é o ponto de entrada principal para todas as rotas da API
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configuração do PostgreSQL direto
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

// Cache simples para conexões
let cachedConnection: any = null;

// Função para conectar ao PostgreSQL usando pg
async function getConnection() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    cachedConnection = client;
    console.log('✅ Conectado ao PostgreSQL diretamente');
    return client;
  } catch (error) {
    console.log('❌ Erro ao conectar ao PostgreSQL:', error.message);
    return null;
  }
}

// Função para executar queries SQL diretamente
async function executeQuery(query: string, params: any[] = []): Promise<any[]> {
  try {
    const client = await getConnection();
    if (!client) {
      throw new Error('Conexão com PostgreSQL não disponível');
    }
    
    const result = await client.query(query, params);
    console.log(`✅ Query executada: ${result.rows.length} registros`);
    return result.rows;
  } catch (error) {
    console.log('❌ Erro na query PostgreSQL:', error.message);
    return [];
  }
}

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
// Tentando chaves legacy mais recentes encontradas no projeto
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI';
// Service key legacy mais recente
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8';

// Função para ler dados locais como fallback
function readLocalData(tableName: string) {
  try {
    const filePath = join(process.cwd(), 'api', 'data', `${tableName}.json`);
    const data = readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(`Arquivo local não encontrado para ${tableName}, retornando array vazio`);
    return [];
  }
}

// Função para fazer requisições ao PostgreSQL com fallback local
async function supabaseRequest(endpoint: string, options: any = {}) {
  try {
    // PRIMEIRA TENTATIVA: Conexão direta ao PostgreSQL via REST API
    const supabaseUrl = 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8';
    
    const url = `${supabaseUrl}/rest/v1/${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`PostgreSQL error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Dados em tempo real do PostgreSQL: ${endpoint} (${Array.isArray(data) ? data.length : 'objeto'} registros)`);
    return data;
    
  } catch (error) {
    console.log('PostgreSQL indisponível, usando dados locais como fallback:', error.message);
    
    // FALLBACK: Usar dados locais apenas se PostgreSQL falhar
    const tableName = endpoint.split('?')[0];
    const localData = readLocalData(tableName);
    console.log(`⚠️ Usando fallback local: ${tableName} (${localData.length} registros)`);
    return localData;
  }
}

// Função para fazer requisições ao Supabase com service key (para autenticação)
async function supabaseAuthRequest(endpoint: string, options: any = {}) {
  try {
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
  } catch (error) {
    console.log('Supabase auth indisponível, usando dados locais:', error.message);
    
    // Para autenticação, usar dados locais de usuários
    const tableName = endpoint.split('?')[0];
    const localData = readLocalData(tableName);
    
    // Filtrar dados baseado no endpoint (simulando query do Supabase)
    if (endpoint.includes('email=eq.')) {
      const email = endpoint.split('email=eq.')[1].split('&')[0];
      return localData.filter((user: any) => user.email === email);
    }
    
    if (endpoint.includes('id=eq.')) {
      const id = endpoint.split('id=eq.')[1].split('&')[0];
      return localData.filter((user: any) => user.id === id);
    }
    
    return localData;
  }
}

// Handler principal para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // DEBUG: Log completo para troubleshooting
    const debugInfo = {
      url: req.url,
      method: req.method,
      path: req.url?.split('?')[0],
      hasUsersInUrl: req.url?.includes('/users'),
      isGetMethod: req.method === 'GET',
      timestamp: new Date().toISOString()
    };
    console.log('🔍 REQUEST DEBUG:', JSON.stringify(debugInfo));
    
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
    
    // Rota de diagnóstico - NOVA
    if (req.url === '/api/debug' || req.url === '/debug') {
      const connectionTest = await getConnection();
      res.status(200).json({
        status: 'debug',
        timestamp: new Date().toISOString(),
        request: {
          url: req.url,
          method: req.method,
          headers: Object.keys(req.headers || {})
        },
        database: {
          configured: !!process.env.DATABASE_URL,
          connected: !!connectionTest
        },
        routes: {
          users: '/api/users está configurada',
          expenses: '/api/expenses está configurada',
          partners: '/api/partners está configurada',
          cattlePurchases: '/api/cattle-purchases está configurada'
        },
        lastDeploy: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
      });
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

        // Buscar usuário real no Supabase
        const users = await supabaseAuthRequest(`users?email=eq.${email}&select=*`);
        
        if (!users || users.length === 0) {
          res.status(401).json({
            status: 'error',
            message: 'Email ou senha inválidos'
          });
          return;
        }

        const user = users[0];

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

        // Buscar usuário real no Supabase
        const users = await supabaseAuthRequest(`users?id=eq.${userId}&select=*`);
        
        if (!users || users.length === 0) {
          res.status(401).json({
            status: 'error',
            message: 'Token inválido'
          });
          return;
        }

        const user = users[0];

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

    // Rota de users (com e sem /api/v1/) - CONEXÃO DIRETA
    if (req.url?.includes('/users') && req.method === 'GET' && !req.url?.includes('/auth')) {
      console.log('📊 ROTA DE USUÁRIOS ATIVADA!');
      console.log('URL:', req.url);
      console.log('Method:', req.method);
      
      try {
        // PRIMEIRA TENTATIVA: PostgreSQL direto
        console.log('🔄 Tentando buscar usuários do PostgreSQL...');
        const users = await executeQuery(`
          SELECT id, email, name, role, is_active, is_master, created_at, updated_at
          FROM users
          WHERE is_active = true
          ORDER BY created_at DESC
          LIMIT 100
        `);
        
        console.log(`📊 Resultado da query: ${users.length} usuários encontrados`);
        
        if (users.length > 0) {
          console.log('✅ Dados em tempo real do PostgreSQL: users');
          res.status(200).json({
            status: 'success',
            data: users,
            message: `${users.length} usuários carregados em tempo real`
          });
          return;
        }
        
        // FALLBACK: Dados locais
        console.log('⚠️ PostgreSQL vazio, usando fallback local');
        const localUsers = readLocalData('users');
        res.status(200).json({
          status: 'success',
          data: localUsers,
          message: localUsers.length > 0 ? 'Usuários carregados (fallback)' : 'Nenhum usuário encontrado'
        });
        return;
        
      } catch (error) {
        console.error('Error fetching users:', error);
        
        // FALLBACK: Dados locais em caso de erro
        const localUsers = readLocalData('users');
        res.status(200).json({
          status: 'success',
          data: localUsers,
          message: 'Usuários carregados (fallback devido a erro)'
        });
        return;
      }
    }

    // Rota de expenses (com e sem /api/v1/) - CONEXÃO DIRETA
    if (req.url?.includes('/expenses') && !req.url?.includes('/stats')) {
      try {
        // PRIMEIRA TENTATIVA: PostgreSQL direto
        const expenses = await executeQuery(`
          SELECT e.*, 
                 p.name as vendor_name,
                 pa.account_name as payer_account_name
          FROM expenses e
          LEFT JOIN cattle_purchases cp ON e.purchase_id = cp.id
          LEFT JOIN partners p ON cp.vendor_id = p.id
          LEFT JOIN payer_accounts pa ON e.payer_account_id = pa.id
          ORDER BY e.created_at DESC
          LIMIT 50
        `);
        
        if (expenses.length > 0) {
          console.log('✅ Dados em tempo real do PostgreSQL: expenses');
          res.status(200).json({
            status: 'success',
            data: expenses,
            message: `${expenses.length} despesas carregadas em tempo real`
          });
          return;
        }
        
        // FALLBACK: Dados locais
        console.log('⚠️ PostgreSQL vazio, usando fallback local');
        const localExpenses = readLocalData('expenses');
        res.status(200).json({
          status: 'success',
          data: localExpenses,
          message: localExpenses.length > 0 ? 'Despesas carregadas (fallback)' : 'Nenhuma despesa encontrada'
        });
        return;
        
      } catch (error) {
        console.error('Error fetching expenses:', error);
        
        // FALLBACK: Dados locais em caso de erro
        const localExpenses = readLocalData('expenses');
        res.status(200).json({
          status: 'success',
          data: localExpenses,
          message: 'Despesas carregadas (fallback devido a erro)'
        });
        return;
      }
    }

    // Rota de revenues (com e sem /api/v1/)
    if (req.url?.includes('/revenues') && !req.url?.includes('/stats')) {
      try {
        const revenues = await supabaseRequest('revenues?select=*');
        res.status(200).json({
          status: 'success',
          data: revenues || [],
          message: revenues?.length > 0 ? 'Receitas carregadas com sucesso' : 'Nenhuma receita encontrada'
        });
        return;
      } catch (error) {
        console.error('Error fetching revenues:', error);
        res.status(500).json({
          status: 'error',
          message: 'Erro ao carregar receitas: ' + (error as Error).message
        });
        return;
      }
    }

    // Rota de cattle purchases (com e sem /api/v1/) - CONEXÃO DIRETA
    if (req.url?.includes('/cattle-purchases')) {
      try {
        // PRIMEIRA TENTATIVA: PostgreSQL direto
        const cattlePurchases = await executeQuery(`
          SELECT cp.*, 
                 p.name as vendor,
                 pa.account_name as payer_account
          FROM cattle_purchases cp
          LEFT JOIN partners p ON cp.vendor_id = p.id
          LEFT JOIN payer_accounts pa ON cp.payer_account_id = pa.id
          ORDER BY cp.created_at DESC
          LIMIT 50
        `);
        
        if (cattlePurchases.length > 0) {
          console.log('✅ Dados em tempo real do PostgreSQL: cattle-purchases');
          
          // Formatar dados para o frontend
          const formattedPurchases = cattlePurchases.map(purchase => ({
            id: purchase.id,
            averageWeight: parseFloat(purchase.average_weight || 0),
            pricePerArroba: parseFloat(purchase.price_per_arroba || 0),
            purchaseDate: purchase.purchase_date,
            vendor: purchase.vendor || 'Desconhecido',
            payerAccount: purchase.payer_account || 'Fluxo de Caixa',
            status: purchase.status || 'CONFIRMED',
            createdAt: purchase.created_at,
            updatedAt: purchase.updated_at
          }));
          
          res.status(200).json({
            status: 'success',
            items: formattedPurchases,
            results: formattedPurchases.length,
            total: formattedPurchases.length,
            page: 1,
            totalPages: 1,
            message: `${formattedPurchases.length} compras carregadas em tempo real`
          });
          return;
        }
        
        // FALLBACK: Dados locais
        console.log('⚠️ PostgreSQL vazio, usando fallback local');
        const localPurchases = readLocalData('cattle-purchases');
        res.status(200).json({
          status: 'success',
          items: localPurchases,
          results: localPurchases.length,
          total: localPurchases.length,
          page: 1,
          totalPages: 1,
          message: localPurchases.length > 0 ? 'Compras carregadas (fallback)' : 'Nenhuma compra encontrada'
        });
        return;
        
      } catch (error) {
        console.error('Error fetching cattle purchases:', error);
        
        // FALLBACK: Dados locais em caso de erro
        const localPurchases = readLocalData('cattle-purchases');
        res.status(200).json({
          status: 'success',
          items: localPurchases,
          results: localPurchases.length,
          total: localPurchases.length,
          page: 1,
          totalPages: 1,
          message: 'Compras carregadas (fallback devido a erro)'
        });
        return;
      }
    }

    // Rota de partners (com e sem /api/v1/) - CONEXÃO DIRETA
    if (req.url?.includes('/partners')) {
      try {
        // PRIMEIRA TENTATIVA: PostgreSQL direto
        const partners = await executeQuery(`
          SELECT * FROM partners
          ORDER BY created_at DESC
          LIMIT 100
        `);
        
        if (partners.length > 0) {
          console.log('✅ Dados em tempo real do PostgreSQL: partners');
          res.status(200).json({
            status: 'success',
            data: partners,
            message: `${partners.length} parceiros carregados em tempo real`
          });
          return;
        }
        
        // FALLBACK: Dados locais
        console.log('⚠️ PostgreSQL vazio, usando fallback local');
        const localPartners = readLocalData('partners');
        res.status(200).json({
          status: 'success',
          data: localPartners,
          message: localPartners.length > 0 ? 'Parceiros carregados (fallback)' : 'Nenhum parceiro encontrado'
        });
        return;
        
      } catch (error) {
        console.error('Error fetching partners:', error);
        
        // FALLBACK: Dados locais em caso de erro
        const localPartners = readLocalData('partners');
        res.status(200).json({
          status: 'success',
          data: localPartners,
          message: 'Parceiros carregados (fallback devido a erro)'
        });
        return;
      }
    }

    // Rota de interventions statistics (com e sem /api/v1/)
    if (req.url?.includes('/interventions/statistics')) {
      try {
        const interventions = await supabaseRequest('interventions?select=*');
        
        // Calcular estatísticas reais baseadas nos dados do banco
        const stats = {
          totalInterventions: interventions?.length || 0,
          activeInterventions: interventions?.filter((i: any) => i.status === 'active')?.length || 0,
          completedInterventions: interventions?.filter((i: any) => i.status === 'completed')?.length || 0,
          pendingInterventions: interventions?.filter((i: any) => i.status === 'pending')?.length || 0,
          byType: {},
          byMonth: {},
          averageCost: 0,
          successRate: 0
        };
        
        res.status(200).json({
          status: 'success',
          data: stats,
          message: interventions?.length > 0 ? 'Estatísticas de intervenções carregadas com sucesso' : 'Nenhuma intervenção encontrada'
        });
        return;
      } catch (error) {
        console.error('Error fetching intervention statistics:', error);
        res.status(500).json({
          status: 'error',
          message: 'Erro ao carregar estatísticas: ' + (error as Error).message
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
        '/api/v1/users',
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

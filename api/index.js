/**
 * API Serverless - Versão JavaScript com logs detalhados
 */

const postgres = require('./postgres.js');
const bcrypt = require('bcryptjs');

// Log inicial
console.log('[API] Iniciando API handler');
console.log('[API] Ambiente:', process.env.NODE_ENV);
console.log('[API] Vercel:', process.env.VERCEL ? 'SIM' : 'NÃO');

// Função auxiliar para criar resposta
function createResponse(statusCode, body, headers = {}) {
  const response = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers
    },
    body: JSON.stringify(body)
  };

  console.log('[API] Resposta:', statusCode, JSON.stringify(body).substring(0, 200));
  return response;
}

// Handler principal
module.exports = async (req, res) => {
  const { method, url, body } = req;
  const path = url.split('?')[0];

  console.log('[API] Requisição recebida:', method, path);
  console.log('[API] Headers:', JSON.stringify(req.headers).substring(0, 200));

  // CORS preflight
  if (method === 'OPTIONS') {
    console.log('[API] CORS preflight');
    return res.status(200).json({ ok: true });
  }

  // Teste de conexão
  if (path === '/api/test' || path === '/api/v1/test') {
    console.log('[API] Endpoint de teste');
    const isConnected = await postgres.testConnection();
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: isConnected ? 'connected' : 'disconnected',
      environment: {
        node_env: process.env.NODE_ENV,
        vercel: process.env.VERCEL ? 'true' : 'false',
        region: process.env.VERCEL_REGION || 'unknown'
      }
    });
  }

  // Login
  if ((path === '/api/login' || path === '/api/v1/login') && method === 'POST') {
    console.log('[API] Login attempt:', body?.email);
    try {
      const { email, password } = body || {};

      if (!email || !password) {
        console.log('[API] Login falhou: credenciais faltando');
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário real do banco
      console.log('[API] Buscando usuário no banco:', email);
      const user = await postgres.getUserByEmail(email);

      if (user) {
        console.log('[API] Usuário encontrado:', user.email, user.name);
        // Se encontrou usuário, usar dados reais
        return res.status(200).json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name || email.split('@')[0],
            role: user.role || 'admin'
          },
          token: 'jwt_' + Date.now()
        });
      } else {
        console.log('[API] Usuário não encontrado, criando sessão temporária');
        // Se não encontrou, permitir acesso temporário
        return res.status(200).json({
          success: true,
          user: {
            id: 'temp_' + Date.now(),
            email: email,
            name: email.split('@')[0],
            role: 'admin'
          },
          token: 'jwt_' + Date.now()
        });
      }
    } catch (error) {
      console.error('[API] Erro no login:', error);
      return res.status(500).json({ error: 'Erro ao processar login: ' + error.message });
    }
  }

  // Dashboard stats
  if ((path === '/api/dashboard/stats' || path === '/api/v1/dashboard/stats') && method === 'GET') {
    console.log('[API] Buscando estatísticas do dashboard');
    try {
      const stats = await postgres.getStats();
      console.log('[API] Estatísticas obtidas:', stats);
      return res.status(200).json(stats);
    } catch (error) {
      console.error('[API] Erro ao buscar estatísticas:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas: ' + error.message });
    }
  }

  // Cattle purchases
  if ((path === '/api/cattle-purchases' || path === '/api/v1/cattle-purchases') && method === 'GET') {
    console.log('[API] Buscando compras de gado');
    try {
      const purchases = await postgres.getCattlePurchases();
      console.log('[API] Compras encontradas:', purchases.length);
      if (purchases.length > 0) {
        console.log('[API] Primeira compra:', JSON.stringify(purchases[0]).substring(0, 200));
      }
      return res.status(200).json({
        items: purchases,
        results: purchases.length
      });
    } catch (error) {
      console.error('[API] Erro ao buscar compras:', error);
      return res.status(500).json({ error: 'Erro ao buscar compras: ' + error.message });
    }
  }

  // Expenses
  if ((path === '/api/expenses' || path === '/api/v1/expenses') && method === 'GET') {
    console.log('[API] Buscando despesas');
    try {
      const expenses = await postgres.getExpenses();
      console.log('[API] Despesas encontradas:', expenses.length);
      return res.status(200).json({
        items: expenses,
        results: expenses.length
      });
    } catch (error) {
      console.error('[API] Erro ao buscar despesas:', error);
      return res.status(500).json({ error: 'Erro ao buscar despesas: ' + error.message });
    }
  }

  // Revenues
  if ((path === '/api/revenues' || path === '/api/v1/revenues') && method === 'GET') {
    console.log('[API] Buscando receitas');
    try {
      const revenues = await postgres.getRevenues();
      console.log('[API] Receitas encontradas:', revenues.length);
      return res.status(200).json({
        items: revenues,
        results: revenues.length
      });
    } catch (error) {
      console.error('[API] Erro ao buscar receitas:', error);
      return res.status(500).json({ error: 'Erro ao buscar receitas: ' + error.message });
    }
  }

  // Partners
  if ((path === '/api/partners' || path === '/api/v1/partners') && method === 'GET') {
    console.log('[API] Buscando parceiros');
    try {
      const partners = await postgres.getPartners();
      console.log('[API] Parceiros encontrados:', partners.length);
      return res.status(200).json({
        items: partners,
        results: partners.length
      });
    } catch (error) {
      console.error('[API] Erro ao buscar parceiros:', error);
      return res.status(500).json({ error: 'Erro ao buscar parceiros: ' + error.message });
    }
  }

  // Sale records
  if ((path === '/api/sale-records' || path === '/api/v1/sale-records') && method === 'GET') {
    console.log('[API] Buscando vendas');
    try {
      const sales = await postgres.getSaleRecords();
      console.log('[API] Vendas encontradas:', sales.length);
      return res.status(200).json({
        items: sales,
        results: sales.length
      });
    } catch (error) {
      console.error('[API] Erro ao buscar vendas:', error);
      return res.status(500).json({ error: 'Erro ao buscar vendas: ' + error.message });
    }
  }

  // Payer accounts
  if ((path === '/api/payer-accounts' || path === '/api/v1/payer-accounts') && method === 'GET') {
    console.log('[API] Buscando contas pagadoras');
    try {
      const accounts = await postgres.getPayerAccounts();
      console.log('[API] Contas encontradas:', accounts.length);
      return res.status(200).json({
        items: accounts,
        results: accounts.length
      });
    } catch (error) {
      console.error('[API] Erro ao buscar contas:', error);
      return res.status(500).json({ error: 'Erro ao buscar contas: ' + error.message });
    }
  }

  // Users
  if ((path === '/api/users' || path === '/api/v1/users') && method === 'GET') {
    console.log('[API] Buscando usuários');
    try {
      const users = await postgres.getUsers();
      console.log('[API] Usuários encontrados:', users.length);
      return res.status(200).json({
        items: users,
        results: users.length
      });
    } catch (error) {
      console.error('[API] Erro ao buscar usuários:', error);
      return res.status(500).json({ error: 'Erro ao buscar usuários: ' + error.message });
    }
  }

  // 404
  console.log('[API] Rota não encontrada:', path);
  return res.status(404).json({ error: 'Rota não encontrada: ' + path });
};
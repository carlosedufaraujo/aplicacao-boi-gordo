// Handler principal que roteia todas as requisições
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  const url = req.url || '';
  // Extrair o path corretamente - remover /api/ e index se presente
  let path = url.replace(/\?.*$/, '').replace(/^\/api\//, '');
  if (path === 'index') path = '';

  // Se vier query param com o path real
  if (req.query && req.query.path) {
    path = req.query.path;
  }

  console.log('[MAIN] URL:', url, '| Path final:', path);

  // CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    // Roteamento baseado no path
    switch(path) {
      case 'cattle-purchases':
        const purchases = await postgres.getCattlePurchases();
        return res.status(200).json({
          items: purchases,
          results: purchases.length
        });

      case 'expenses':
        const expenses = await postgres.getExpenses();
        return res.status(200).json({
          items: expenses || [],
          results: expenses ? expenses.length : 0
        });

      case 'expenses-stats':
      case 'expensesstats':
        const expensesForStats = await postgres.getExpenses();
        return res.status(200).json({
          total: expensesForStats.length,
          totalAmount: expensesForStats.reduce((sum, e) => sum + (parseFloat(e.totalAmount) || 0), 0),
          paid: expensesForStats.filter(e => e.isPaid).length,
          pending: expensesForStats.filter(e => !e.isPaid).length,
          overdue: expensesForStats.filter(e => !e.isPaid && new Date(e.dueDate) < new Date()).length
        });

      case 'revenues':
        const revenues = await postgres.getRevenues();
        return res.status(200).json({
          items: revenues || [],
          results: revenues ? revenues.length : 0
        });

      case 'revenues-stats':
      case 'revenuesstats':
        const revenuesForStats = await postgres.getRevenues();
        return res.status(200).json({
          total: revenuesForStats.length,
          totalAmount: revenuesForStats.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0),
          received: revenuesForStats.filter(r => r.isReceived).length,
          pending: revenuesForStats.filter(r => !r.isReceived).length,
          overdue: revenuesForStats.filter(r => !r.isReceived && new Date(r.receivedDate) < new Date()).length
        });

      case 'sale-records':
      case 'salerecords':
        const sales = await postgres.getSaleRecords();
        return res.status(200).json({
          items: sales,
          results: sales.length
        });

      case 'sale-records-stats':
      case 'salerecordsstats':
        const salesForStats = await postgres.getSaleRecords();
        return res.status(200).json({
          total: salesForStats.length,
          totalQuantity: salesForStats.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0),
          totalRevenue: salesForStats.reduce((sum, s) => sum + (parseFloat(s.totalValue) || 0), 0),
          averagePrice: salesForStats.length > 0 ?
            salesForStats.reduce((sum, s) => sum + (parseFloat(s.pricePerArroba) || 0), 0) / salesForStats.length : 0,
          averageWeight: salesForStats.length > 0 ?
            salesForStats.reduce((sum, s) => sum + (parseFloat(s.averageWeight) || 0), 0) / salesForStats.length : 0
        });

      case 'partners':
        const partners = await postgres.getPartners();
        return res.status(200).json({
          items: partners,
          results: partners.length
        });

      case 'dashboard-stats':
      case 'dashboardstats':
        const stats = await postgres.getStats();
        return res.status(200).json(stats);

      case 'login':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Método não permitido' });
        }
        const { email, password } = req.body || {};
        if (!email || !password) {
          return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }
        const user = await postgres.getUserByEmail(email);
        if (user) {
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

      case '':
      case 'index':
        // Endpoint raiz - retornar informações da API
        return res.status(200).json({
          message: 'API BoviControl',
          version: '1.0.0',
          endpoints: [
            '/api/cattle-purchases',
            '/api/expenses',
            '/api/expenses-stats',
            '/api/revenues',
            '/api/revenues-stats',
            '/api/sale-records',
            '/api/sale-records-stats',
            '/api/partners',
            '/api/dashboard-stats',
            '/api/login'
          ]
        });

      default:
        return res.status(404).json({ error: 'Endpoint não encontrado: ' + path });
    }
  } catch (error) {
    console.error('[MAIN] Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
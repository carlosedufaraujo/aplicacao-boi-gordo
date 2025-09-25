// Endpoint único que roteia para diferentes funções baseado na URL
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  // Adicionar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  // Extrair o path da requisição
  const url = req.url || '';
  console.log('[ROUTER] URL recebida:', url);

  try {
    // Rotear baseado no path
    if (url.includes('/partners')) {
      const partners = await postgres.getPartners();
      console.log('[PARTNERS] Parceiros encontrados:', partners.length);
      return res.status(200).json({
        items: partners,
        results: partners.length
      });
    }

    if (url.includes('/expenses')) {
      const isStats = url.includes('stats') || (req.query && req.query.stats);
      const expenses = await postgres.getExpenses();
      console.log('[EXPENSES] Despesas encontradas:', expenses.length);

      if (isStats) {
        return res.status(200).json({
          total: expenses.length,
          totalAmount: expenses.reduce((sum, e) => sum + (parseFloat(e.totalAmount) || 0), 0),
          paid: expenses.filter(e => e.isPaid).length,
          pending: expenses.filter(e => !e.isPaid).length,
          overdue: expenses.filter(e => !e.isPaid && new Date(e.dueDate) < new Date()).length
        });
      }

      return res.status(200).json({
        items: expenses,
        results: expenses.length
      });
    }

    if (url.includes('/revenues')) {
      const isStats = url.includes('stats') || (req.query && req.query.stats);
      const revenues = await postgres.getRevenues();
      console.log('[REVENUES] Receitas encontradas:', revenues.length);

      if (isStats) {
        return res.status(200).json({
          total: revenues.length,
          totalAmount: revenues.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0),
          received: revenues.filter(r => r.isReceived).length,
          pending: revenues.filter(r => !r.isReceived).length,
          overdue: revenues.filter(r => !r.isReceived && new Date(r.receivedDate) < new Date()).length
        });
      }

      return res.status(200).json({
        items: revenues,
        results: revenues.length
      });
    }

    if (url.includes('/sale-records') || url.includes('/salerecords')) {
      const isStats = url.includes('stats') || (req.query && req.query.stats);
      const sales = await postgres.getSaleRecords();
      console.log('[SALE-RECORDS] Vendas encontradas:', sales.length);

      if (isStats) {
        return res.status(200).json({
          total: sales.length,
          totalQuantity: sales.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0),
          totalRevenue: sales.reduce((sum, s) => sum + (parseFloat(s.totalValue) || 0), 0),
          averagePrice: sales.length > 0 ?
            sales.reduce((sum, s) => sum + (parseFloat(s.pricePerArroba) || 0), 0) / sales.length : 0,
          averageWeight: sales.length > 0 ?
            sales.reduce((sum, s) => sum + (parseFloat(s.averageWeight) || 0), 0) / sales.length : 0
        });
      }

      return res.status(200).json({
        items: sales,
        results: sales.length
      });
    }

    if (url.includes('/dashboard-stats')) {
      const [purchases, sales, expenses, revenues] = await Promise.all([
        postgres.getCattlePurchases(),
        postgres.getSaleRecords(),
        postgres.getExpenses(),
        postgres.getRevenues()
      ]);

      console.log('[DASHBOARD-STATS] Dados encontrados - Compras:', purchases.length,
                  '| Vendas:', sales.length,
                  '| Despesas:', expenses.length,
                  '| Receitas:', revenues.length);

      const stats = {
        totalPurchases: purchases.length,
        totalSales: sales.length,
        totalExpenses: expenses.length,
        totalRevenues: revenues.length,
        purchaseAmount: purchases.reduce((sum, p) => sum + (parseFloat(p.totalPaid) || 0), 0),
        saleAmount: sales.reduce((sum, s) => sum + (parseFloat(s.totalValue) || 0), 0),
        expenseAmount: expenses.reduce((sum, e) => sum + (parseFloat(e.totalAmount) || 0), 0),
        revenueAmount: revenues.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0),
        pendingExpenses: expenses.filter(e => !e.isPaid).length,
        pendingRevenues: revenues.filter(r => !r.isReceived).length,
        overdueExpenses: expenses.filter(e => !e.isPaid && new Date(e.dueDate) < new Date()).length,
        overdueRevenues: revenues.filter(r => !r.isReceived && new Date(r.receivedDate) < new Date()).length
      };

      stats.profit = stats.revenueAmount - stats.expenseAmount;
      stats.margin = stats.saleAmount > 0 ? ((stats.profit / stats.saleAmount) * 100).toFixed(2) : 0;

      return res.status(200).json(stats);
    }

    // Default: retornar compras de gado
    const purchases = await postgres.getCattlePurchases();
    console.log('[CATTLE-PURCHASES] Compras encontradas:', purchases.length);
    return res.status(200).json({
      items: purchases,
      results: purchases.length
    });

  } catch (error) {
    console.error('[ROUTER] Erro:', error);

    // Retornar resposta vazia mas válida
    return res.status(200).json({
      items: [],
      results: 0
    });
  }
};
// Endpoint para estatísticas do dashboard
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[DASHBOARD-STATS] Requisição recebida');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    // Buscar dados de várias tabelas
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

    // Calcular estatísticas
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

    // Adicionar lucro/prejuízo
    stats.profit = stats.revenueAmount - stats.expenseAmount;
    stats.margin = stats.saleAmount > 0 ? ((stats.profit / stats.saleAmount) * 100).toFixed(2) : 0;

    return res.status(200).json(stats);
  } catch (error) {
    console.error('[DASHBOARD-STATS] Erro:', error);
    return res.status(200).json({
      totalPurchases: 0,
      totalSales: 0,
      totalExpenses: 0,
      totalRevenues: 0,
      purchaseAmount: 0,
      saleAmount: 0,
      expenseAmount: 0,
      revenueAmount: 0,
      pendingExpenses: 0,
      pendingRevenues: 0,
      overdueExpenses: 0,
      overdueRevenues: 0,
      profit: 0,
      margin: 0
    });
  }
};
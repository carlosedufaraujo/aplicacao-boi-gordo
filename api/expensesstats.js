// Endpoint para estatísticas de despesas
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[EXPENSES-STATS] Requisição recebida');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const expenses = await postgres.getExpenses();
    const stats = {
      total: expenses.length,
      totalAmount: expenses.reduce((sum, e) => sum + (parseFloat(e.totalAmount) || 0), 0),
      paid: expenses.filter(e => e.isPaid).length,
      pending: expenses.filter(e => !e.isPaid).length,
      overdue: expenses.filter(e => !e.isPaid && new Date(e.dueDate) < new Date()).length
    };
    console.log('[EXPENSES-STATS] Estatísticas:', stats);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[EXPENSES-STATS] Erro:', error);
    return res.status(200).json({
      total: 0,
      totalAmount: 0,
      paid: 0,
      pending: 0,
      overdue: 0
    });
  }
};
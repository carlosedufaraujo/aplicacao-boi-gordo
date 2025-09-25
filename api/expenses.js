// Endpoint para despesas e estatísticas
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[EXPENSES] Requisição recebida');

  // Verificar se está pedindo estatísticas baseado no query param
  const url = req.url || '';
  const isStats = url.includes('stats') || (req.query && req.query.stats);

  console.log('[EXPENSES] URL:', url, '| Stats:', isStats);

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const expenses = await postgres.getExpenses();
    console.log('[EXPENSES] Despesas encontradas:', expenses.length);

    // Se for requisição de estatísticas
    if (isStats) {
      return res.status(200).json({
        total: expenses.length,
        totalAmount: expenses.reduce((sum, e) => sum + (parseFloat(e.totalAmount) || 0), 0),
        paid: expenses.filter(e => e.isPaid).length,
        pending: expenses.filter(e => !e.isPaid).length,
        overdue: expenses.filter(e => !e.isPaid && new Date(e.dueDate) < new Date()).length
      });
    }

    // Resposta padrão - lista de despesas
    return res.status(200).json({
      items: expenses || [],
      results: expenses ? expenses.length : 0
    });
  } catch (error) {
    console.error('[EXPENSES] Erro:', error);

    if (isStats) {
      return res.status(200).json({
        total: 0,
        totalAmount: 0,
        paid: 0,
        pending: 0,
        overdue: 0
      });
    }

    return res.status(200).json({
      items: [],
      results: 0
    });
  }
};
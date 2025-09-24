// Endpoint para despesas
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[EXPENSES] Requisição recebida');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const expenses = await postgres.getExpenses();
    console.log('[EXPENSES] Despesas encontradas:', expenses.length);
    return res.status(200).json({
      items: expenses || [],
      results: expenses ? expenses.length : 0
    });
  } catch (error) {
    console.error('[EXPENSES] Erro:', error);
    return res.status(200).json({
      items: [],
      results: 0
    });
  }
};
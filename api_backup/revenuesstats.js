// Endpoint para estatísticas de receitas
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[REVENUES-STATS] Requisição recebida');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const revenues = await postgres.getRevenues();
    const stats = {
      total: revenues.length,
      totalAmount: revenues.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0),
      received: revenues.filter(r => r.isReceived).length,
      pending: revenues.filter(r => !r.isReceived).length,
      overdue: revenues.filter(r => !r.isReceived && new Date(r.receivedDate) < new Date()).length
    };
    console.log('[REVENUES-STATS] Estatísticas:', stats);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[REVENUES-STATS] Erro:', error);
    return res.status(200).json({
      total: 0,
      totalAmount: 0,
      received: 0,
      pending: 0,
      overdue: 0
    });
  }
};
// Endpoint para estatísticas do dashboard
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[DASHBOARD-STATS] Requisição recebida');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const stats = await postgres.getStats();
    console.log('[DASHBOARD-STATS] Estatísticas obtidas:', stats);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[DASHBOARD-STATS] Erro:', error);
    return res.status(200).json({
      totalCattle: 0,
      activeLots: 0,
      occupiedPens: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      averageWeight: 0,
      mortalityRate: 0,
      lastUpdated: new Date().toISOString()
    });
  }
};
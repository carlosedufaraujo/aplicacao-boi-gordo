// Endpoint para estatísticas de vendas
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[SALE-RECORDS-STATS] Requisição recebida');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const sales = await postgres.getSaleRecords();
    const stats = {
      total: sales.length,
      totalQuantity: sales.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0),
      totalRevenue: sales.reduce((sum, s) => sum + (parseFloat(s.totalValue) || 0), 0),
      averagePrice: sales.length > 0 ?
        sales.reduce((sum, s) => sum + (parseFloat(s.pricePerArroba) || 0), 0) / sales.length : 0,
      averageWeight: sales.length > 0 ?
        sales.reduce((sum, s) => sum + (parseFloat(s.averageWeight) || 0), 0) / sales.length : 0
    };
    console.log('[SALE-RECORDS-STATS] Estatísticas:', stats);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('[SALE-RECORDS-STATS] Erro:', error);
    return res.status(200).json({
      total: 0,
      totalQuantity: 0,
      totalRevenue: 0,
      averagePrice: 0,
      averageWeight: 0
    });
  }
};
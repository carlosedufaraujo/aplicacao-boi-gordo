// Endpoint para registros de venda e estatísticas
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[SALE-RECORDS] Requisição recebida');

  // Verificar se está pedindo estatísticas
  const url = req.url || '';
  const isStats = url.includes('stats') || (req.query && req.query.stats);

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const sales = await postgres.getSaleRecords();
    console.log('[SALE-RECORDS] Vendas encontradas:', sales.length);

    // Se for requisição de estatísticas
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

    // Resposta padrão
    return res.status(200).json({
      items: sales,
      results: sales.length
    });
  } catch (error) {
    console.error('[SALE-RECORDS] Erro:', error);

    if (isStats) {
      return res.status(200).json({
        total: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        averagePrice: 0,
        averageWeight: 0
      });
    }

    return res.status(200).json({
      items: [],
      results: 0
    });
  }
};
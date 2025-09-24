// Endpoint para registros de venda
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[SALE-RECORDS] Requisição recebida');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const sales = await postgres.getSaleRecords();
    console.log('[SALE-RECORDS] Vendas encontradas:', sales.length);
    return res.status(200).json({
      items: sales,
      results: sales.length
    });
  } catch (error) {
    console.error('[SALE-RECORDS] Erro:', error);
    return res.status(200).json({
      items: [],
      results: 0
    });
  }
};
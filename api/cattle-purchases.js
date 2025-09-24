// Endpoint para compras de gado
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[CATTLE-PURCHASES] Requisição recebida');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const purchases = await postgres.getCattlePurchases();
    console.log('[CATTLE-PURCHASES] Compras encontradas:', purchases.length);
    return res.status(200).json({
      items: purchases,
      results: purchases.length
    });
  } catch (error) {
    console.error('[CATTLE-PURCHASES] Erro:', error);
    return res.status(200).json({
      items: [],
      results: 0
    });
  }
};
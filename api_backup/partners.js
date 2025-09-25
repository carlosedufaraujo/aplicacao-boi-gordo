// Endpoint para parceiros
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[PARTNERS] Requisição recebida');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const partners = await postgres.getPartners();
    console.log('[PARTNERS] Parceiros encontrados:', partners.length);
    return res.status(200).json({
      items: partners,
      results: partners.length
    });
  } catch (error) {
    console.error('[PARTNERS] Erro:', error);
    return res.status(200).json({
      items: [],
      results: 0
    });
  }
};
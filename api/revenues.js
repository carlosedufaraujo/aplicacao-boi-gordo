// Endpoint para receitas
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[REVENUES] Requisição recebida');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const revenues = await postgres.getRevenues();
    console.log('[REVENUES] Receitas encontradas:', revenues.length);
    return res.status(200).json({
      items: revenues || [],
      results: revenues ? revenues.length : 0
    });
  } catch (error) {
    console.error('[REVENUES] Erro:', error);
    return res.status(200).json({
      items: [],
      results: 0
    });
  }
};
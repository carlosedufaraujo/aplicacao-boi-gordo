// Endpoint para receitas e estatísticas
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[REVENUES] Requisição recebida');

  // Verificar se está pedindo estatísticas baseado no query param
  const url = req.url || '';
  const isStats = url.includes('stats') || (req.query && req.query.stats);

  console.log('[REVENUES] URL:', url, '| Stats:', isStats);

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const revenues = await postgres.getRevenues();
    console.log('[REVENUES] Receitas encontradas:', revenues.length);

    // Se for requisição de estatísticas
    if (isStats) {
      return res.status(200).json({
        total: revenues.length,
        totalAmount: revenues.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0),
        received: revenues.filter(r => r.isReceived).length,
        pending: revenues.filter(r => !r.isReceived).length,
        overdue: revenues.filter(r => !r.isReceived && new Date(r.receivedDate) < new Date()).length
      });
    }

    // Resposta padrão - lista de receitas
    return res.status(200).json({
      items: revenues || [],
      results: revenues ? revenues.length : 0
    });
  } catch (error) {
    console.error('[REVENUES] Erro:', error);

    if (isStats) {
      return res.status(200).json({
        total: 0,
        totalAmount: 0,
        received: 0,
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
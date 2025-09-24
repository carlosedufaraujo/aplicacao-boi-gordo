// Endpoint para login
const postgres = require('./postgres.js');

module.exports = async (req, res) => {
  console.log('[LOGIN] Requisição recebida');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      console.log('[LOGIN] Credenciais faltando');
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário real do banco
    console.log('[LOGIN] Buscando usuário:', email);
    const user = await postgres.getUserByEmail(email);

    if (user) {
      console.log('[LOGIN] Usuário encontrado:', user.email);
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || email.split('@')[0],
          role: user.role || 'admin'
        },
        token: 'jwt_' + Date.now()
      });
    } else {
      console.log('[LOGIN] Usuário não encontrado, criando sessão temporária');
      // Permitir acesso temporário
      return res.status(200).json({
        success: true,
        user: {
          id: 'temp_' + Date.now(),
          email: email,
          name: email.split('@')[0],
          role: 'admin'
        },
        token: 'jwt_' + Date.now()
      });
    }
  } catch (error) {
    console.error('[LOGIN] Erro:', error);
    return res.status(500).json({ error: 'Erro ao processar login' });
  }
};
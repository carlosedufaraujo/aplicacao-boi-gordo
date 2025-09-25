/**
 * Teste simples de conexão com o banco
 */

module.exports = async (req, res) => {
  console.log('[TEST-DB] Iniciando teste de banco');

  try {
    const pg = require('pg');
    const { Client } = pg;

    const DATABASE_URL = 'postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

    console.log('[TEST-DB] Criando cliente PostgreSQL');
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('[TEST-DB] Conectando ao banco...');
    await client.connect();
    console.log('[TEST-DB] Conectado com sucesso!');

    console.log('[TEST-DB] Executando query de teste...');
    const result = await client.query('SELECT NOW() as now, current_database() as db, COUNT(*) as user_count FROM users');
    console.log('[TEST-DB] Query executada:', result.rows[0]);

    console.log('[TEST-DB] Buscando compras de gado...');
    const purchases = await client.query('SELECT COUNT(*) as total, SUM("initialQuantity") as heads FROM cattle_purchases');
    console.log('[TEST-DB] Compras:', purchases.rows[0]);

    await client.end();
    console.log('[TEST-DB] Conexão fechada');

    return res.status(200).json({
      success: true,
      database: result.rows[0],
      cattle_purchases: purchases.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[TEST-DB] ERRO:', error.message);
    console.error('[TEST-DB] Stack:', error.stack);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
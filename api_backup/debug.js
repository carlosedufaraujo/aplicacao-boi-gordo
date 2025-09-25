/**
 * Debug endpoint para testar queries específicas
 */

module.exports = async (req, res) => {
  console.log('[DEBUG] Iniciando debug de queries');

  try {
    const pg = require('pg');
    const { Client } = pg;

    const DATABASE_URL = 'postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    console.log('[DEBUG] Conectado ao banco');

    const results = {};

    // 1. Teste simples
    const test = await client.query('SELECT 1 as test');
    results.test = test.rows[0];

    // 2. Contagem de tabelas
    const tables = await client.query(`
      SELECT table_name,
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    results.tables = tables.rows;

    // 3. Query completa de cattle_purchases
    console.log('[DEBUG] Executando query de cattle_purchases...');
    const purchases = await client.query(`
      SELECT cp.*,
             p.name as vendor_name
      FROM cattle_purchases cp
      LEFT JOIN partners p ON cp."vendorId" = p.id
      ORDER BY cp."purchaseDate" DESC
      LIMIT 5
    `);
    console.log('[DEBUG] Compras encontradas:', purchases.rows.length);
    results.cattle_purchases = {
      count: purchases.rows.length,
      sample: purchases.rows[0] || null,
      fields: purchases.fields ? purchases.fields.map(f => f.name) : []
    };

    // 4. Query simples sem JOIN
    const simplePurchases = await client.query('SELECT * FROM cattle_purchases LIMIT 5');
    results.simple_cattle_purchases = {
      count: simplePurchases.rows.length,
      sample: simplePurchases.rows[0] || null
    };

    // 5. Verificar estrutura da tabela
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cattle_purchases'
      ORDER BY ordinal_position
    `);
    results.table_structure = structure.rows;

    await client.end();

    return res.status(200).json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DEBUG] ERRO:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
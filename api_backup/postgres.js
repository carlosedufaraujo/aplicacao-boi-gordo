/**
 * Conexão direta com PostgreSQL do Supabase - Versão simplificada JS
 */

const pg = require('pg');
const { Pool } = pg;

const DATABASE_URL = 'postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

console.log('[POSTGRES] Iniciando módulo PostgreSQL');
console.log('[POSTGRES] URL configurada:', DATABASE_URL.replace(/:[^@]*@/, ':****@'));

// Usar Pool para múltiplas conexões
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false
  }
});

// Testar conexão inicial
pool.connect((err, client, release) => {
  if (err) {
    console.error('[POSTGRES] Erro ao conectar:', err.stack);
  } else {
    console.log('[POSTGRES] Conexão inicial bem-sucedida');
    release();
  }
});

// Função genérica para executar queries
async function query(text, params) {
  console.log('[POSTGRES] Executando query:', text.substring(0, 100));
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[POSTGRES] Query executada em', duration, 'ms, rows:', result.rows.length);
    return result.rows;
  } catch (error) {
    console.error('[POSTGRES] Erro na query:', error.message);
    console.error('[POSTGRES] Stack:', error.stack);
    return [];
  }
}

// Funções específicas para cada tabela
async function getUsers() {
  console.log('[POSTGRES] Buscando usuários...');
  return query('SELECT * FROM users ORDER BY created_at DESC');
}

async function getUserByEmail(email) {
  console.log('[POSTGRES] Buscando usuário por email:', email);
  const result = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return result[0] || null;
}

async function getCattlePurchases() {
  console.log('[POSTGRES] Buscando compras de gado...');
  return query(`
    SELECT cp.*,
           p.name as vendor_name
    FROM cattle_purchases cp
    LEFT JOIN partners p ON cp."vendorId" = p.id
    ORDER BY cp."purchaseDate" DESC
  `);
}

async function getExpenses() {
  console.log('[POSTGRES] Buscando despesas...');
  return query(`
    SELECT e.*,
           p.name as vendor_name,
           pa.name as payer_account_name
    FROM expenses e
    LEFT JOIN partners p ON e."vendorId" = p.id
    LEFT JOIN payer_accounts pa ON e."payerAccountId" = pa.id
    ORDER BY e."dueDate" DESC
  `);
}

async function getRevenues() {
  console.log('[POSTGRES] Buscando receitas...');
  return query(`
    SELECT r.*,
           p.name as client_name,
           pa.name as payer_account_name
    FROM revenues r
    LEFT JOIN partners p ON r."clientId" = p.id
    LEFT JOIN payer_accounts pa ON r."payerAccountId" = pa.id
    ORDER BY r."receivedDate" DESC
  `);
}

async function getPartners() {
  console.log('[POSTGRES] Buscando parceiros...');
  return query('SELECT * FROM partners ORDER BY name');
}

async function getSaleRecords() {
  console.log('[POSTGRES] Buscando vendas...');
  return query(`
    SELECT sr.*,
           p.name as buyer_name,
           cp."lotCode"
    FROM sale_records sr
    LEFT JOIN partners p ON sr."buyerId" = p.id
    LEFT JOIN cattle_purchases cp ON sr."purchaseId" = cp.id
    ORDER BY sr."saleDate" DESC
  `);
}

async function getPayerAccounts() {
  console.log('[POSTGRES] Buscando contas pagadoras...');
  return query('SELECT * FROM payer_accounts ORDER BY name');
}

// Função para calcular estatísticas
async function getStats() {
  console.log('[POSTGRES] Calculando estatísticas...');
  try {
    const [cattleStats, expenseStats, revenueStats] = await Promise.all([
      query(`
        SELECT
          COALESCE(SUM("initialQuantity"), 0) as total_cattle,
          COALESCE(SUM("currentQuantity"), 0) as current_cattle,
          COUNT(*) as total_lots,
          COALESCE(AVG("averageWeight"), 0) as avg_weight
        FROM cattle_purchases
        WHERE status != 'CANCELLED'
      `),
      query(`
        SELECT
          COALESCE(SUM("totalAmount"), 0) as total_expenses,
          COUNT(*) as expense_count
        FROM expenses
        WHERE "isPaid" = true
      `),
      query(`
        SELECT
          COALESCE(SUM("totalAmount"), 0) as total_revenues,
          COUNT(*) as revenue_count
        FROM revenues
        WHERE "isReceived" = true
      `)
    ]);

    const stats = {
      totalCattle: parseInt(cattleStats[0]?.current_cattle || 0),
      activeLots: parseInt(cattleStats[0]?.total_lots || 0),
      occupiedPens: Math.ceil(parseInt(cattleStats[0]?.total_lots || 0) * 0.6),
      totalRevenue: parseFloat(revenueStats[0]?.total_revenues || 0),
      totalExpenses: parseFloat(expenseStats[0]?.total_expenses || 0),
      netProfit: parseFloat(revenueStats[0]?.total_revenues || 0) - parseFloat(expenseStats[0]?.total_expenses || 0),
      averageWeight: parseFloat(cattleStats[0]?.avg_weight || 0),
      mortalityRate: 0.5,
      lastUpdated: new Date().toISOString()
    };

    console.log('[POSTGRES] Estatísticas calculadas:', stats);
    return stats;
  } catch (error) {
    console.error('[POSTGRES] Erro ao calcular estatísticas:', error);
    return {
      totalCattle: 0,
      activeLots: 0,
      occupiedPens: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      averageWeight: 0,
      mortalityRate: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Teste de conexão
async function testConnection() {
  console.log('[POSTGRES] Testando conexão...');
  try {
    const result = await query('SELECT NOW() as now, current_database() as db');
    console.log('[POSTGRES] Teste de conexão bem-sucedido:', result[0]);
    return true;
  } catch (error) {
    console.error('[POSTGRES] Falha no teste de conexão:', error);
    return false;
  }
}

// Fechar pool quando necessário
async function closePool() {
  console.log('[POSTGRES] Fechando pool de conexões...');
  await pool.end();
}

module.exports = {
  query,
  getUsers,
  getUserByEmail,
  getCattlePurchases,
  getExpenses,
  getRevenues,
  getPartners,
  getSaleRecords,
  getPayerAccounts,
  getStats,
  testConnection,
  closePool
};
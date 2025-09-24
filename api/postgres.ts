/**
 * Conexão direta com PostgreSQL do Supabase
 */

import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = 'postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

// Usar Pool para múltiplas conexões
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10, // máximo de 10 conexões
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Função genérica para executar queries
export async function query(text: string, params?: any[]) {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

// Funções específicas para cada tabela
export async function getUsers() {
  return query('SELECT * FROM users ORDER BY created_at DESC');
}

export async function getUserByEmail(email: string) {
  const result = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return result[0] || null;
}

export async function getCattlePurchases() {
  return query(`
    SELECT cp.*,
           p.name as vendor_name,
           p.document as vendor_document
    FROM cattle_purchases cp
    LEFT JOIN partners p ON cp."vendorId" = p.id
    ORDER BY cp."purchaseDate" DESC
  `);
}

export async function getExpenses() {
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

export async function getRevenues() {
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

export async function getPartners() {
  return query('SELECT * FROM partners ORDER BY name');
}

export async function getSaleRecords() {
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

export async function getPayerAccounts() {
  return query('SELECT * FROM payer_accounts ORDER BY name');
}

// Função para calcular estatísticas
export async function getStats() {
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

    return stats;
  } catch (error) {
    console.error('Error calculating stats:', error);
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

// Fechar pool quando necessário (para testes)
export async function closePool() {
  await pool.end();
}
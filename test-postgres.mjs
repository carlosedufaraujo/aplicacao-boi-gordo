import pg from 'pg';
const { Client } = pg;

// Conexão direta com PostgreSQL do Supabase
const DATABASE_URL = 'postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const client = new Client({
  connectionString: DATABASE_URL,
});

async function testPostgres() {
  try {
    console.log('🔌 Conectando ao PostgreSQL...\n');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    // 1. Buscar usuários
    console.log('1. Buscando usuários...');
    try {
      const usersResult = await client.query('SELECT id, email, name FROM users LIMIT 5');
      console.log('✅ Usuários encontrados:', usersResult.rows.length);
      if (usersResult.rows.length > 0) {
        console.log('Exemplo:', usersResult.rows[0]);
      }
    } catch (err) {
      console.log('❌ Erro ao buscar users:', err.message);
    }

    // 2. Buscar compras de gado
    console.log('\n2. Buscando compras de gado...');
    try {
      const purchasesResult = await client.query('SELECT * FROM cattle_purchases LIMIT 5');
      console.log('✅ Compras encontradas:', purchasesResult.rows.length);
      if (purchasesResult.rows.length > 0) {
        console.log('Exemplo:', purchasesResult.rows[0]);
      }
    } catch (err) {
      console.log('❌ Erro ao buscar cattle_purchases:', err.message);
    }

    // 3. Buscar despesas
    console.log('\n3. Buscando despesas...');
    try {
      const expensesResult = await client.query('SELECT * FROM expenses LIMIT 5');
      console.log('✅ Despesas encontradas:', expensesResult.rows.length);
      if (expensesResult.rows.length > 0) {
        console.log('Exemplo:', expensesResult.rows[0]);
      }
    } catch (err) {
      console.log('❌ Erro ao buscar expenses:', err.message);
    }

    // 4. Buscar receitas
    console.log('\n4. Buscando receitas...');
    try {
      const revenuesResult = await client.query('SELECT * FROM revenues LIMIT 5');
      console.log('✅ Receitas encontradas:', revenuesResult.rows.length);
      if (revenuesResult.rows.length > 0) {
        console.log('Exemplo:', revenuesResult.rows[0]);
      }
    } catch (err) {
      console.log('❌ Erro ao buscar revenues:', err.message);
    }

    // 5. Listar todas as tabelas
    console.log('\n5. Listando todas as tabelas do banco...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('✅ Tabelas encontradas:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

testPostgres();
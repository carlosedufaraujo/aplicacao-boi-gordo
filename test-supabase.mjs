import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI';

console.log('🔍 Testando conexão com Supabase...\n');
console.log('URL:', SUPABASE_URL);
console.log('Key length:', SUPABASE_ANON_KEY.length);
console.log('---\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    // Testar buscar usuários
    console.log('1. Testando tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.log('❌ Erro ao buscar users:', usersError.message);
    } else {
      console.log('✅ Users encontrados:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('Exemplo de usuário:', {
          id: users[0].id,
          email: users[0].email,
          name: users[0].name
        });
      }
    }

    // Testar buscar cattle_purchases
    console.log('\n2. Testando tabela cattle_purchases...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('cattle_purchases')
      .select('*')
      .limit(5);

    if (purchasesError) {
      console.log('❌ Erro ao buscar cattle_purchases:', purchasesError.message);
    } else {
      console.log('✅ Compras encontradas:', purchases?.length || 0);
      if (purchases && purchases.length > 0) {
        console.log('Exemplo de compra:', {
          id: purchases[0].id,
          lotCode: purchases[0].lot_code || purchases[0].lotCode,
          quantity: purchases[0].initial_quantity || purchases[0].initialQuantity
        });
      }
    }

    // Testar buscar expenses
    console.log('\n3. Testando tabela expenses...');
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .limit(5);

    if (expensesError) {
      console.log('❌ Erro ao buscar expenses:', expensesError.message);
    } else {
      console.log('✅ Despesas encontradas:', expenses?.length || 0);
    }

    // Testar buscar revenues
    console.log('\n4. Testando tabela revenues...');
    const { data: revenues, error: revenuesError } = await supabase
      .from('revenues')
      .select('*')
      .limit(5);

    if (revenuesError) {
      console.log('❌ Erro ao buscar revenues:', revenuesError.message);
    } else {
      console.log('✅ Receitas encontradas:', revenues?.length || 0);
    }

    // Listar todas as tabelas disponíveis
    console.log('\n5. Verificando estrutura do banco...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('❌ Erro ao listar tabelas:', tablesError.message);

      // Tentar método alternativo
      console.log('\nTentando método alternativo para verificar dados...');

      // Testar com nomes de tabelas alternativos
      const tableTests = [
        'Users', 'USERS', 'user', 'User',
        'CattlePurchase', 'CattlePurchases', 'cattle_purchase',
        'Expense', 'Expenses', 'expense',
        'Revenue', 'Revenues', 'revenue'
      ];

      for (const tableName of tableTests) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error && data) {
          console.log(`✅ Tabela encontrada: ${tableName}`);
        }
      }
    } else {
      console.log('✅ Tabelas encontradas:', tables?.map(t => t.table_name).join(', '));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConnection();
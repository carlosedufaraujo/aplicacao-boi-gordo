const { createClient } = require('@supabase/supabase-js');

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

    // Testar autenticação
    console.log('\n5. Testando autenticação...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'teste@example.com',
      password: 'teste123'
    });

    if (authError) {
      console.log('❌ Erro de autenticação:', authError.message);

      // Tentar buscar um usuário específico
      console.log('\n6. Buscando usuário específico no banco...');
      const { data: testUser, error: testUserError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'teste@example.com')
        .single();

      if (testUserError) {
        console.log('❌ Usuário não encontrado:', testUserError.message);
      } else {
        console.log('✅ Usuário encontrado no banco:', testUser);
      }
    } else {
      console.log('✅ Autenticação bem-sucedida:', authData.user?.email);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConnection();
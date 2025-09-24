import { createClient } from '@supabase/supabase-js';

// CREDENCIAIS CORRETAS DO SUPABASE
const SUPABASE_URL = 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTQ2MDcsImV4cCI6MjA3MTI5MDYwN30.MH5C-ZmQ1udG5Obre4_furNk68NNeUohZTdrKtfagmc';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8';

console.log('🔍 Testando conexão com Supabase usando CREDENCIAIS CORRETAS...\n');

// Criar cliente com service role para ter acesso total
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testConnection() {
  try {
    // 1. Testar buscar usuários
    console.log('1. Buscando usuários reais...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.log('❌ Erro ao buscar users:', usersError.message);
    } else {
      console.log('✅ Users encontrados:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('Primeiro usuário:', {
          id: users[0].id,
          email: users[0].email,
          name: users[0].name
        });
      }
    }

    // 2. Testar buscar cattle_purchases
    console.log('\n2. Buscando compras de gado reais...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('cattle_purchases')
      .select('*')
      .limit(5);

    if (purchasesError) {
      console.log('❌ Erro ao buscar cattle_purchases:', purchasesError.message);
    } else {
      console.log('✅ Compras encontradas:', purchases?.length || 0);
      if (purchases && purchases.length > 0) {
        console.log('Primeira compra:', purchases[0]);
      }
    }

    // 3. Testar buscar expenses
    console.log('\n3. Buscando despesas reais...');
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .limit(5);

    if (expensesError) {
      console.log('❌ Erro ao buscar expenses:', expensesError.message);
    } else {
      console.log('✅ Despesas encontradas:', expenses?.length || 0);
      if (expenses && expenses.length > 0) {
        console.log('Primeira despesa:', expenses[0]);
      }
    }

    // 4. Testar buscar revenues
    console.log('\n4. Buscando receitas reais...');
    const { data: revenues, error: revenuesError } = await supabase
      .from('revenues')
      .select('*')
      .limit(5);

    if (revenuesError) {
      console.log('❌ Erro ao buscar revenues:', revenuesError.message);
    } else {
      console.log('✅ Receitas encontradas:', revenues?.length || 0);
      if (revenues && revenues.length > 0) {
        console.log('Primeira receita:', revenues[0]);
      }
    }

    // 5. Testar buscar partners
    console.log('\n5. Buscando parceiros...');
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('*')
      .limit(5);

    if (partnersError) {
      console.log('❌ Erro ao buscar partners:', partnersError.message);
    } else {
      console.log('✅ Parceiros encontrados:', partners?.length || 0);
      if (partners && partners.length > 0) {
        console.log('Primeiro parceiro:', partners[0]);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConnection();
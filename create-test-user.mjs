import { createClient } from '@supabase/supabase-js';

// CREDENCIAIS CORRETAS DO SUPABASE
const SUPABASE_URL = 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8';

console.log('🔍 Criando usuário de teste no Supabase...\n');

// Criar cliente com service role para ter acesso total
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createTestUser() {
  try {
    // Criar usuário de teste
    const testUser = {
      id: 'test-user-' + Date.now(),
      email: 'admin@bovicontrol.com',
      name: 'Administrador',
      role: 'ADMIN',
      is_active: true,
      is_master: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('1. Inserindo usuário de teste...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();

    if (userError) {
      console.log('❌ Erro ao inserir user:', userError.message);
      
      // Se o usuário já existe, vamos atualizar
      if (userError.message.includes('duplicate key')) {
        console.log('⚠️ Usuário já existe, atualizando...');
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            name: testUser.name,
            role: testUser.role,
            is_active: testUser.is_active,
            is_master: testUser.is_master,
            updated_at: testUser.updated_at
          })
          .eq('email', testUser.email)
          .select()
          .single();

        if (updateError) {
          console.log('❌ Erro ao atualizar user:', updateError.message);
        } else {
          console.log('✅ Usuário atualizado:', updatedUser);
        }
      }
    } else {
      console.log('✅ Usuário criado:', user);
    }

    // Verificar se o usuário existe
    console.log('\n2. Verificando usuário criado...');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@bovicontrol.com');

    if (fetchError) {
      console.log('❌ Erro ao buscar user:', fetchError.message);
    } else {
      console.log('✅ Usuário encontrado:', users);
    }

    console.log('\n🎯 CREDENCIAIS PARA TESTE:');
    console.log('Email: admin@bovicontrol.com');
    console.log('Senha: qualquer senha (validação desabilitada temporariamente)');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestUser();

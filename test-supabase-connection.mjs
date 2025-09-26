import { createClient } from '@supabase/supabase-js';

// CREDENCIAIS LEGACY MAIS RECENTES ENCONTRADAS NO PROJETO
const SUPABASE_URL = 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8';

console.log('🔍 Testando conexão com Supabase (sem dados mock)...\n');

// Criar cliente com service key para ter acesso total
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testRealConnection() {
  try {
    console.log('1. Testando conexão básica...');
    
    // Testar conexão básica
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Erro de conexão:', error.message);
      console.log('Detalhes:', error);
      return false;
    }

    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar cada tabela
    const tables = ['users', 'expenses', 'revenues', 'cattle_purchases', 'partners', 'interventions'];
    
    for (const table of tables) {
      console.log(`\n2. Testando tabela: ${table}`);
      
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(5);

      if (tableError) {
        console.log(`❌ Erro na tabela ${table}:`, tableError.message);
      } else {
        console.log(`✅ Tabela ${table}: ${tableData?.length || 0} registros encontrados`);
        if (tableData && tableData.length > 0) {
          console.log(`   Primeiro registro:`, Object.keys(tableData[0]));
        }
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

testRealConnection().then(success => {
  if (success) {
    console.log('\n🎉 CONEXÃO COM SUPABASE FUNCIONANDO!');
    console.log('✅ Dados reais do banco serão exibidos na aplicação');
  } else {
    console.log('\n❌ PROBLEMA NA CONEXÃO COM SUPABASE');
    console.log('⚠️ Verifique as chaves de API ou configurações do projeto');
  }
});

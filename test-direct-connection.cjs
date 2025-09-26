#!/usr/bin/env node

/**
 * TESTE DE CONEXÃO DIRETA AO POSTGRESQL
 * 
 * Este script testa se a API consegue conectar diretamente
 * ao PostgreSQL sem precisar de sincronização manual
 */

async function testDirectConnection() {
  console.log('🧪 TESTANDO CONEXÃO DIRETA AO POSTGRESQL...\n');
  
  const supabaseUrl = 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8';
  
  const tests = [
    {
      name: 'Despesas',
      endpoint: 'expenses?select=*&order=created_at.desc&limit=5'
    },
    {
      name: 'Parceiros', 
      endpoint: 'partners?select=*&order=created_at.desc&limit=5'
    },
    {
      name: 'Compras de Gado',
      endpoint: 'cattle_purchases?select=*&order=created_at.desc&limit=5'
    },
    {
      name: 'Receitas',
      endpoint: 'revenues?select=*&order=created_at.desc&limit=5'
    },
    {
      name: 'Usuários',
      endpoint: 'users?select=id,email,name,role,is_active'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`📊 Testando ${test.name}...`);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/${test.endpoint}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: ${data.length} registros encontrados`);
        
        if (data.length > 0) {
          console.log(`   Exemplo: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
        }
      } else {
        console.log(`❌ ${test.name}: Erro ${response.status} - ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 RESULTADO:');
  console.log('Se todos os testes passaram, a conexão direta funciona!');
  console.log('Não será mais necessário executar sync manual.');
}

testDirectConnection().catch(console.error);

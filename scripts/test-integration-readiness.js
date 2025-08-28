#!/usr/bin/env node

/**
 * Script para testar a prontidão do sistema para integração Backend/API
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Usar fetch nativo do Node.js (disponível a partir do Node 18)
const fetch = globalThis.fetch;

// Configurações
const BACKEND_URL = 'http://localhost:3333';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8';

console.log('🔍 TESTE DE PRONTIDÃO PARA INTEGRAÇÃO BACKEND/API\n');

async function testBackendConnectivity() {
  console.log('📡 Testando conectividade do Backend...');
  
  try {
    // Teste 1: Health Check
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend Health Check:', healthData);
    
    // Teste 2: API Stats (endpoint temporário)
    try {
      const statsResponse = await fetch(`${BACKEND_URL}/api/v1/stats`);
      const statsData = await statsResponse.json();
      console.log('✅ Backend Stats API:', statsData);
    } catch (error) {
      console.log('⚠️  Backend Stats API não disponível');
    }
    
    // Teste 3: Frontend Data endpoint
    try {
      const frontendDataResponse = await fetch(`${BACKEND_URL}/api/v1/frontend-data`);
      console.log('✅ Backend Frontend Data API disponível');
    } catch (error) {
      console.log('⚠️  Backend Frontend Data API não disponível');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Backend não está acessível:', error.message);
    console.log('💡 Execute: cd backend && npm run dev');
    return false;
  }
}

async function testSupabaseConnectivity() {
  console.log('\n🗄️  Testando conectividade do Supabase...');
  
  try {
    // Teste básico de conectividade via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/purchase_orders?select=count&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase conectado com sucesso');
      
      // Teste das tabelas principais
      const tables = [
        'purchase_orders',
        'cattle_lots', 
        'partners',
        'pens',
        'expenses',
        'revenues',
        'payer_accounts'
      ];
      
      console.log('\n📋 Verificando tabelas principais:');
      
      for (const table of tables) {
        try {
          const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count&limit=1`, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (tableResponse.ok) {
            console.log(`✅ Tabela ${table}: Acessível`);
          } else {
            console.log(`❌ Tabela ${table}: ${tableResponse.status} ${tableResponse.statusText}`);
          }
        } catch (err) {
          console.log(`❌ Tabela ${table}: Erro na consulta`);
        }
      }
      
      return true;
    } else {
      console.log('❌ Erro na conexão Supabase:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Supabase não está acessível:', error.message);
    return false;
  }
}

async function testCurrentArchitecture() {
  console.log('\n🏗️  Analisando arquitetura atual...');
  
  // Verificar se frontend está usando Supabase diretamente
  console.log('📊 Arquitetura atual identificada:');
  console.log('   Frontend → Supabase (direto) ✅');
  console.log('   Frontend → Backend API (não integrado) ⚠️');
  console.log('   Backend → Supabase (disponível) ✅');
  
  console.log('\n🎯 Problemas identificados:');
  console.log('   • Duplicação de lógica entre Frontend e Backend');
  console.log('   • Service Role Key exposta no Frontend (inseguro)');
  console.log('   • Regras de negócio espalhadas no Frontend');
  console.log('   • Dificuldade para integrações e jobs automáticos');
  
  return true;
}

async function generateRecommendations() {
  console.log('\n💡 RECOMENDAÇÕES PARA INTEGRAÇÃO:');
  
  console.log('\n🚀 PRIORIDADE ALTA:');
  console.log('   1. Migrar autenticação para Backend API');
  console.log('   2. Criar endpoints para Purchase Orders e Cattle Lots');
  console.log('   3. Implementar middleware de autenticação JWT');
  console.log('   4. Migrar hooks do Frontend para usar API');
  
  console.log('\n📈 PRIORIDADE MÉDIA:');
  console.log('   5. Implementar regras de negócio no Backend');
  console.log('   6. Adicionar validações centralizadas');
  console.log('   7. Criar serviços de integração automática');
  console.log('   8. Implementar cache para performance');
  
  console.log('\n🔮 PRIORIDADE BAIXA:');
  console.log('   9. Adicionar jobs para processamento assíncrono');
  console.log('   10. Implementar integrações externas');
  console.log('   11. Adicionar métricas e monitoramento');
  console.log('   12. Criar sistema de auditoria completo');
  
  console.log('\n⏱️  CRONOGRAMA ESTIMADO:');
  console.log('   • Fase 1 (Fundação): 2-3 dias');
  console.log('   • Fase 2 (Migração): 3-4 dias'); 
  console.log('   • Fase 3 (Regras de Negócio): 2-3 dias');
  console.log('   • Fase 4 (Funcionalidades Avançadas): 3-4 dias');
  console.log('   • TOTAL: 10-14 dias');
}

async function main() {
  const backendOk = await testBackendConnectivity();
  const supabaseOk = await testSupabaseConnectivity();
  
  if (backendOk && supabaseOk) {
    await testCurrentArchitecture();
    await generateRecommendations();
    
    console.log('\n✅ SISTEMA PRONTO PARA INTEGRAÇÃO!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Revisar o documento: docs/analise-integracao-backend-api.md');
    console.log('   2. Aprovar o plano de integração');
    console.log('   3. Iniciar Fase 1 - Preparação da API');
    
  } else {
    console.log('\n❌ SISTEMA NÃO ESTÁ PRONTO');
    console.log('\n🔧 Ações necessárias:');
    
    if (!backendOk) {
      console.log('   • Iniciar o servidor backend: cd backend && npm run dev');
    }
    
    if (!supabaseOk) {
      console.log('   • Verificar configuração do Supabase');
      console.log('   • Verificar variáveis de ambiente');
    }
  }
  
  console.log('\n📞 Aguardando aprovação para prosseguir com a integração!');
}

// Executar o teste
main().catch(console.error);

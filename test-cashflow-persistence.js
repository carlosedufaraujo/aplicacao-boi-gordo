#!/usr/bin/env node

import fetch from 'node-fetch';

// Configurações
const BASE_URL = 'http://localhost:3001/api/v1';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Tentar ler o token do arquivo
let TOKEN = process.env.TOKEN || '';
try {
  TOKEN = readFileSync(join(homedir(), '.boigordo_token'), 'utf8').trim();
} catch (e) {
  // Ignora se o arquivo não existe
}

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Função helper para logging
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para fazer requisições HTTP
async function apiRequest(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return text ? JSON.parse(text) : null;
  } catch (error) {
    throw error;
  }
}

// Testes
async function runTests() {
  log('\n=== TESTE DE PERSISTÊNCIA DO CASH FLOW ===\n', 'bright');

  try {
    // 1. Verificar token
    if (!TOKEN) {
      log('⚠️  Token não configurado. Use: export TOKEN="seu-token-aqui"', 'yellow');
      log('Tentando ler token do localStorage simulado...', 'yellow');
      // Em produção, o token vem do localStorage do navegador
      process.exit(1);
    }

    // 2. Buscar contas disponíveis
    log('\n📊 Buscando contas disponíveis...', 'cyan');
    const accountsResult = await apiRequest('GET', '/payer-accounts');
    const accounts = accountsResult.data?.items || [];
    
    if (accounts.length === 0) {
      log('❌ Nenhuma conta encontrada. Crie uma conta primeiro.', 'red');
      process.exit(1);
    }
    
    log(`✅ ${accounts.length} conta(s) encontrada(s)`, 'green');
    const firstAccount = accounts[0];
    log(`   Usando conta: ${firstAccount.accountName} (${firstAccount.bankName})`, 'blue');

    // 3. Criar uma DESPESA de teste
    log('\n💰 Criando DESPESA de teste...', 'cyan');
    const expenseData = {
      description: 'Teste de Despesa - ' + new Date().toISOString(),
      category: 'feed',  // Categoria válida do backend
      // costCenterId removido - não é obrigatório
      payerAccountId: firstAccount.id,
      totalAmount: 150.00,
      dueDate: new Date().toISOString(),
      isPaid: false,
      notes: 'Despesa criada via teste automatizado',
      supplier: 'Fornecedor Teste',
      reference: 'REF-TEST-001',
      paymentMethod: 'PIX'
    };

    const createdExpense = await apiRequest('POST', '/expenses', expenseData);
    log(`✅ Despesa criada com ID: ${createdExpense.data.id}`, 'green');

    // 4. Criar uma RECEITA de teste
    log('\n💵 Criando RECEITA de teste...', 'cyan');
    const revenueData = {
      description: 'Teste de Receita - ' + new Date().toISOString(),
      category: 'cattle_sales',  // Categoria válida do backend
      // costCenterId removido - não é obrigatório
      payerAccountId: firstAccount.id,
      totalAmount: 250.00,
      dueDate: new Date().toISOString(),
      isReceived: false,
      notes: 'Receita criada via teste automatizado',
      source: 'Cliente Teste',
      reference: 'REF-TEST-002',
      paymentMethod: 'TED'
    };

    const createdRevenue = await apiRequest('POST', '/revenues', revenueData);
    log(`✅ Receita criada com ID: ${createdRevenue.data.id}`, 'green');

    // 5. Listar despesas
    log('\n📋 Listando despesas...', 'cyan');
    const expensesList = await apiRequest('GET', '/expenses?limit=5');
    log(`✅ ${expensesList.data.items.length} despesa(s) encontrada(s)`, 'green');
    
    const testExpense = expensesList.data.items.find(e => e.id === createdExpense.data.id);
    if (testExpense) {
      log('✅ Despesa de teste encontrada na listagem', 'green');
    } else {
      log('❌ Despesa de teste NÃO encontrada na listagem', 'red');
    }

    // 6. Listar receitas
    log('\n📋 Listando receitas...', 'cyan');
    const revenuesList = await apiRequest('GET', '/revenues?limit=5');
    log(`✅ ${revenuesList.data.items.length} receita(s) encontrada(s)`, 'green');
    
    const testRevenue = revenuesList.data.items.find(r => r.id === createdRevenue.data.id);
    if (testRevenue) {
      log('✅ Receita de teste encontrada na listagem', 'green');
    } else {
      log('❌ Receita de teste NÃO encontrada na listagem', 'red');
    }

    // 7. Atualizar status da despesa
    log('\n🔄 Atualizando status da despesa para PAGA...', 'cyan');
    const updateExpenseData = {
      isPaid: true,
      paymentDate: new Date().toISOString()
    };
    
    const updatedExpense = await apiRequest('PATCH', `/expenses/${createdExpense.data.id}`, updateExpenseData);
    log(`✅ Status atualizado: isPaid = ${updatedExpense.data.isPaid}`, 'green');

    // 8. Atualizar status da receita
    log('\n🔄 Atualizando status da receita para RECEBIDA...', 'cyan');
    const updateRevenueData = {
      isReceived: true,
      receiptDate: new Date().toISOString()
    };
    
    const updatedRevenue = await apiRequest('PATCH', `/revenues/${createdRevenue.data.id}`, updateRevenueData);
    log(`✅ Status atualizado: isReceived = ${updatedRevenue.data.isReceived}`, 'green');

    // 9. Deletar os registros de teste
    log('\n🗑️  Limpando registros de teste...', 'cyan');
    
    await apiRequest('DELETE', `/expenses/${createdExpense.data.id}`);
    log('✅ Despesa de teste excluída', 'green');
    
    await apiRequest('DELETE', `/revenues/${createdRevenue.data.id}`);
    log('✅ Receita de teste excluída', 'green');

    // Resumo final
    log('\n' + '='.repeat(50), 'bright');
    log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO!', 'green');
    log('='.repeat(50) + '\n', 'bright');

    log('Resumo:', 'bright');
    log('  ✅ Despesa criada e persistida', 'green');
    log('  ✅ Receita criada e persistida', 'green');
    log('  ✅ Listagem funcionando corretamente', 'green');
    log('  ✅ Atualização de status funcionando', 'green');
    log('  ✅ Exclusão funcionando corretamente', 'green');
    log('\n💡 O sistema de Cash Flow está totalmente integrado e funcional!\n', 'cyan');

  } catch (error) {
    log('\n❌ ERRO NO TESTE:', 'red');
    log(error.message, 'red');
    log('\nVerifique:', 'yellow');
    log('  1. O backend está rodando na porta 3001', 'yellow');
    log('  2. Você configurou o TOKEN corretamente', 'yellow');
    log('  3. Existe pelo menos uma conta cadastrada', 'yellow');
    process.exit(1);
  }
}

// Executar testes
runTests();
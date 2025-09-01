const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:3333/api/v1';

// Criar token de teste
const testToken = jwt.sign(
  { id: 'test-user', email: 'test@bovicontrol.com', role: 'admin' },
  'your-super-secret-jwt-key-here-change-in-production',
  { expiresIn: '1h' }
);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testToken}`
  }
});

let testResults = {
  passed: [],
  failed: []
};

async function testEndpoint(method, path, data = null, description) {
  try {
    console.log(`\n🧪 Testando: ${description}`);
    console.log(`   ${method} ${path}`);
    
    const config = {};
    if (data) config.data = data;
    
    const response = await api({
      method,
      url: path,
      ...config,
      validateStatus: () => true
    });
    
    if (response.status < 400) {
      console.log(`   ✅ Status: ${response.status}`);
      testResults.passed.push(`${method} ${path} - ${description}`);
      return response.data;
    } else {
      console.log(`   ⚠️ Status: ${response.status} - ${response.data?.message || 'Erro'}`);
      testResults.failed.push(`${method} ${path} - ${description}: ${response.data?.message}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    testResults.failed.push(`${method} ${path} - ${description}: ${error.message}`);
    return null;
  }
}

async function runCRUDTests() {
  console.log('='.repeat(60));
  console.log('🚀 TESTE CRUD COMPLETO - BOVICONTROL');
  console.log('='.repeat(60));
  
  let createdIds = {};
  
  // ========== TESTE: PARTNERS ==========
  console.log('\n📋 TESTANDO PARTNERS (PARCEIROS)');
  console.log('-'.repeat(40));
  
  // CREATE
  const partner = await testEndpoint('POST', '/partners', {
    name: 'Teste Fornecedor CRUD',
    type: 'VENDOR',
    cpfCnpj: '99988877766',
    phone: '65999998888',
    email: 'teste@crud.com',
    address: 'Endereço Teste'
  }, 'CREATE Partner');
  
  if (partner?.data?.id) {
    createdIds.partnerId = partner.data.id;
    
    // READ
    await testEndpoint('GET', `/partners/${createdIds.partnerId}`, null, 'READ Partner by ID');
    await testEndpoint('GET', '/partners', null, 'LIST Partners');
    
    // UPDATE
    await testEndpoint('PUT', `/partners/${createdIds.partnerId}`, {
      name: 'Teste Fornecedor ATUALIZADO'
    }, 'UPDATE Partner');
    
    // DELETE
    await testEndpoint('DELETE', `/partners/${createdIds.partnerId}`, null, 'DELETE Partner');
  }
  
  // ========== TESTE: PAYER ACCOUNTS ==========
  console.log('\n💳 TESTANDO PAYER ACCOUNTS (CONTAS)');
  console.log('-'.repeat(40));
  
  const account = await testEndpoint('POST', '/payer-accounts', {
    bankName: 'Banco Teste',
    accountName: 'Conta CRUD Test',
    agency: '0001',
    accountNumber: '123456',
    accountType: 'CHECKING',
    balance: 100000
  }, 'CREATE PayerAccount');
  
  if (account?.data?.id) {
    createdIds.accountId = account.data.id;
    
    await testEndpoint('GET', `/payer-accounts/${createdIds.accountId}`, null, 'READ PayerAccount');
    await testEndpoint('PUT', `/payer-accounts/${createdIds.accountId}`, {
      balance: 200000
    }, 'UPDATE PayerAccount');
    await testEndpoint('DELETE', `/payer-accounts/${createdIds.accountId}`, null, 'DELETE PayerAccount');
  }
  
  // ========== TESTE: PENS ==========
  console.log('\n🏠 TESTANDO PENS (CURRAIS)');
  console.log('-'.repeat(40));
  
  const pen = await testEndpoint('POST', '/pens', {
    penNumber: 'TEST-001',
    capacity: 50,
    penType: 'CONFINEMENT',
    waterAvailable: true,
    troughAvailable: true,
    status: 'AVAILABLE'
  }, 'CREATE Pen');
  
  if (pen?.data?.id) {
    createdIds.penId = pen.data.id;
    
    await testEndpoint('GET', `/pens/${createdIds.penId}`, null, 'READ Pen');
    await testEndpoint('GET', '/pens/occupancy', null, 'CHECK Pen Occupancy');
    await testEndpoint('PUT', `/pens/${createdIds.penId}`, {
      capacity: 60
    }, 'UPDATE Pen');
    await testEndpoint('DELETE', `/pens/${createdIds.penId}`, null, 'DELETE Pen');
  }
  
  // ========== TESTE: CATTLE PURCHASES ==========
  console.log('\n🐂 TESTANDO CATTLE PURCHASES (COMPRAS)');
  console.log('-'.repeat(40));
  
  // Criar parceiro e conta para teste
  const vendor = await api.post('/partners', {
    name: 'Vendor para Purchase',
    type: 'VENDOR',
    cpfCnpj: '11122233344',
    phone: '65888887777'
  });
  
  const payerAccount = await api.post('/payer-accounts', {
    bankName: 'Banco Purchase',
    accountName: 'Conta Purchase',
    agency: '0002',
    accountNumber: '654321',
    accountType: 'CHECKING',
    balance: 500000
  });
  
  if (vendor.data?.data?.id && payerAccount.data?.data?.id) {
    const purchase = await testEndpoint('POST', '/cattle-purchases', {
      vendorId: vendor.data.data.id,
      payerAccountId: payerAccount.data.data.id,
      purchaseDate: new Date().toISOString(),
      animalType: 'MALE',
      initialQuantity: 50,
      purchaseWeight: 7500,
      carcassYield: 52,
      pricePerArroba: 280,
      paymentType: 'CASH'
    }, 'CREATE CattlePurchase');
    
    if (purchase?.data?.id) {
      createdIds.purchaseId = purchase.data.id;
      
      await testEndpoint('GET', `/cattle-purchases/${createdIds.purchaseId}`, null, 'READ CattlePurchase');
      await testEndpoint('GET', '/cattle-purchases', null, 'LIST CattlePurchases');
      
      // Testar fluxo de recepção
      await testEndpoint('POST', `/cattle-purchases/${createdIds.purchaseId}/reception`, {
        receivedDate: new Date().toISOString(),
        receivedWeight: 7450,
        actualQuantity: 50
      }, 'RECEPTION CattlePurchase');
      
      // Testar morte
      await testEndpoint('POST', `/cattle-purchases/${createdIds.purchaseId}/death`, {
        count: 1,
        date: new Date().toISOString()
      }, 'REGISTER Death');
      
      await testEndpoint('PUT', `/cattle-purchases/${createdIds.purchaseId}`, {
        notes: 'Teste atualização'
      }, 'UPDATE CattlePurchase');
    }
    
    // Limpar dados de teste
    await api.delete(`/partners/${vendor.data.data.id}`).catch(() => {});
    await api.delete(`/payer-accounts/${payerAccount.data.data.id}`).catch(() => {});
  }
  
  // ========== TESTE: EXPENSES ==========
  console.log('\n💰 TESTANDO EXPENSES (DESPESAS)');
  console.log('-'.repeat(40));
  
  const expense = await testEndpoint('POST', '/expenses', {
    category: 'ALIMENTAÇÃO',
    description: 'Teste Despesa CRUD',
    totalAmount: 5000,
    dueDate: new Date().toISOString()
  }, 'CREATE Expense');
  
  if (expense?.data?.id) {
    createdIds.expenseId = expense.data.id;
    
    await testEndpoint('GET', `/expenses/${createdIds.expenseId}`, null, 'READ Expense');
    await testEndpoint('PUT', `/expenses/${createdIds.expenseId}`, {
      totalAmount: 6000
    }, 'UPDATE Expense');
    await testEndpoint('DELETE', `/expenses/${createdIds.expenseId}`, null, 'DELETE Expense');
  }
  
  // ========== TESTE: REVENUES ==========
  console.log('\n💵 TESTANDO REVENUES (RECEITAS)');
  console.log('-'.repeat(40));
  
  const revenue = await testEndpoint('POST', '/revenues', {
    category: 'VENDA_GADO',
    description: 'Teste Receita CRUD',
    totalAmount: 50000,
    receivedDate: new Date().toISOString()
  }, 'CREATE Revenue');
  
  if (revenue?.data?.id) {
    createdIds.revenueId = revenue.data.id;
    
    await testEndpoint('GET', `/revenues/${createdIds.revenueId}`, null, 'READ Revenue');
    await testEndpoint('DELETE', `/revenues/${createdIds.revenueId}`, null, 'DELETE Revenue');
  }
  
  // ========== RELATÓRIO FINAL ==========
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE TESTES');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Testes que passaram: ${testResults.passed.length}`);
  testResults.passed.forEach(test => console.log(`   • ${test}`));
  
  if (testResults.failed.length > 0) {
    console.log(`\n❌ Testes que falharam: ${testResults.failed.length}`);
    testResults.failed.forEach(test => console.log(`   • ${test}`));
  }
  
  const successRate = (testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100;
  console.log(`\n📈 Taxa de sucesso: ${successRate.toFixed(1)}%`);
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Teste CRUD completo finalizado!');
  console.log('='.repeat(60));
}

// Executar testes
runCRUDTests().catch(console.error);
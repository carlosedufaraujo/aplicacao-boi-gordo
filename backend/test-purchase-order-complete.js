// Script para testar criação de ordem de compra completa com todos os custos
const axios = require('axios');

async function testCreatePurchaseOrderComplete() {
  try {
    // Primeiro, buscar parceiros e contas pagadoras
    console.log('🔍 Buscando dados necessários...');
    
    const partnersResponse = await axios.get('http://localhost:3333/api/v1/partners');
    const partners = partnersResponse.data.data?.data || [];
    console.log(`✅ ${partners.length} parceiros encontrados`);
    
    const payerAccountsResponse = await axios.get('http://localhost:3333/api/v1/payer-accounts');
    const payerAccounts = payerAccountsResponse.data.data?.data || [];
    console.log(`✅ ${payerAccounts.length} contas pagadoras encontradas`);
    
    if (partners.length === 0) {
      console.error('❌ Nenhum parceiro encontrado');
      return;
    }
    
    if (payerAccounts.length === 0) {
      console.error('❌ Nenhuma conta pagadora encontrada');
      return;
    }
    
    // Dados completos da ordem de compra
    const orderData = {
      vendorId: partners[0].id,
      brokerId: partners.length > 1 ? partners[1].id : null, // Usar segundo parceiro como corretor se houver
      location: 'Fazenda Boa Vista, GO',
      purchaseDate: new Date().toISOString(),
      animalCount: 100,
      animalType: 'MALE',
      averageAge: 18,
      totalWeight: 30000, // 30 toneladas
      carcassYield: 54, // 54%
      pricePerArroba: 285,
      commission: 1500, // Comissão de R$ 1.500
      freightCost: 3500, // Frete de R$ 3.500
      otherCosts: 800, // Outros custos de R$ 800
      paymentType: 'INSTALLMENT',
      payerAccountId: payerAccounts[0].id,
      principalDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      commissionDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 dias
      otherCostsDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
      notes: 'Ordem completa com todos os custos'
    };
    
    console.log('\n📦 Enviando ordem de compra completa...');
    console.log('================================');
    console.log(`📍 Local: ${orderData.location}`);
    console.log(`🐂 Animais: ${orderData.animalCount} cabeças`);
    console.log(`⚖️ Peso Total: ${(orderData.totalWeight / 1000).toFixed(1)} toneladas`);
    console.log(`💵 Preço/@: R$ ${orderData.pricePerArroba}`);
    console.log(`💰 Valor calculado: R$ ${((orderData.totalWeight * orderData.carcassYield / 100) / 15 * orderData.pricePerArroba).toFixed(2)}`);
    console.log(`🚚 Frete: R$ ${orderData.freightCost.toFixed(2)}`);
    console.log(`💼 Comissão: R$ ${orderData.commission.toFixed(2)}`);
    console.log(`➕ Outros: R$ ${orderData.otherCosts.toFixed(2)}`);
    console.log('================================\n');
    
    const response = await axios.post('http://localhost:3333/api/v1/purchase-orders', orderData);
    
    console.log('✅ Ordem criada com sucesso!');
    console.log(`📋 Número da Ordem: ${response.data.data.orderNumber}`);
    console.log(`💰 Valor Total: R$ ${response.data.data.totalValue.toFixed(2)}`);
    
    // Buscar despesas criadas
    console.log('\n💳 Verificando despesas criadas...');
    const expensesResponse = await axios.get('http://localhost:3333/api/v1/expenses');
    const expenses = expensesResponse.data.data?.data || [];
    const orderExpenses = expenses.filter(e => e.purchaseOrderId === response.data.data.id);
    
    console.log(`📊 ${orderExpenses.length} despesas criadas:`);
    orderExpenses.forEach(expense => {
      console.log(`  - ${expense.description}`);
      console.log(`    Valor: R$ ${expense.totalAmount.toFixed(2)}`);
      console.log(`    Centro de Custo: ${expense.costCenterId ? '✅ Vinculado' : '❌ Sem centro'}`);
      console.log(`    Vencimento: ${new Date(expense.dueDate).toLocaleDateString('pt-BR')}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar ordem:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Executar teste
testCreatePurchaseOrderComplete();
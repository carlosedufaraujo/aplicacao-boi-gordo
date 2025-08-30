// Script para testar criação de ordem de compra
const axios = require('axios');

async function testCreatePurchaseOrder() {
  try {
    // Primeiro, buscar parceiros e contas pagadoras
    console.log('🔍 Buscando dados necessários...');
    
    const partnersResponse = await axios.get('http://localhost:3333/api/v1/partners');
    const partnersData = partnersResponse.data;
    // Os dados estão em data.data.data devido ao formato da resposta paginada
    const partners = partnersData.data?.data || partnersData.data || [];
    console.log(`✅ ${Array.isArray(partners) ? partners.length : 0} parceiros encontrados`);
    
    const payerAccountsResponse = await axios.get('http://localhost:3333/api/v1/payer-accounts');
    const accountsData = payerAccountsResponse.data;
    // Os dados estão em data.data.data devido ao formato da resposta paginada
    const payerAccounts = accountsData.data?.data || accountsData.data || [];
    console.log(`✅ ${Array.isArray(payerAccounts) ? payerAccounts.length : 0} contas pagadoras encontradas`);
    
    if (!Array.isArray(partners) || partners.length === 0) {
      console.error('❌ Nenhum parceiro encontrado. Crie um parceiro primeiro.');
      console.log('Resposta partners:', partnersData);
      return;
    }
    
    if (!Array.isArray(payerAccounts) || payerAccounts.length === 0) {
      console.error('❌ Nenhuma conta pagadora encontrada. Crie uma conta primeiro.');
      console.log('Resposta accounts:', accountsData);
      return;
    }
    
    // Dados da ordem de compra
    const orderData = {
      vendorId: partners[0].id,
      location: 'Fazenda São João, MG',
      purchaseDate: new Date().toISOString(),
      animalCount: 50,
      animalType: 'MALE', // Valores corretos: MALE, FEMALE, MIXED
      averageAge: 24,
      totalWeight: 15000, // 15 toneladas
      carcassYield: 52, // 52%
      pricePerArroba: 280,
      commission: 500,
      paymentType: 'CASH', // Valores corretos: CASH, INSTALLMENT, MIXED
      payerAccountId: payerAccounts[0].id,
      principalDueDate: new Date().toISOString(),
      commissionDueDate: new Date().toISOString(),
      notes: 'Teste de criação de ordem'
    };
    
    console.log('📦 Enviando ordem de compra...');
    console.log('Dados:', JSON.stringify(orderData, null, 2));
    
    const response = await axios.post('http://localhost:3333/api/v1/purchase-orders', orderData);
    
    console.log('✅ Ordem criada com sucesso!');
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
    
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
testCreatePurchaseOrder();
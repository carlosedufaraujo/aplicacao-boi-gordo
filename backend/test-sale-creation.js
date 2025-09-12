const axios = require('axios');

async function testSaleCreation() {
  try {
    // Primeiro fazer login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@boigordo.com',
      password: 'Admin@123'
    });

    const token = loginResponse.data.data.token;

    // Buscar um pen com animais
    const pensResponse = await axios.get('http://localhost:3001/api/pens', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const pen = pensResponse.data.data.items?.find(p => p.currentOccupancy > 0);
    
    if (!pen) {
      console.log('❌ Nenhum curral com animais encontrado');
      return;
    }

    // Buscar um comprador
    const partnersResponse = await axios.get('http://localhost:3001/api/partners?type=buyer', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const buyer = partnersResponse.data.data.items?.[0];
    
    if (!buyer) {
      console.log('❌ Nenhum comprador encontrado');
      return;
    }

    // Buscar uma conta recebedora
    const accountsResponse = await axios.get('http://localhost:3001/api/payer-accounts', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const account = accountsResponse.data.data.items?.[0];

    // Criar venda
    const saleData = {
      saleDate: new Date().toISOString(),
      penId: pen.id,
      saleType: 'total',
      quantity: pen.currentOccupancy,
      buyerId: buyer.id,
      exitWeight: pen.currentOccupancy * 450, // 450kg por cabeça
      carcassWeight: pen.currentOccupancy * 225, // 50% de rendimento
      carcassYield: 50,
      pricePerArroba: 300,
      arrobas: (pen.currentOccupancy * 225) / 15,
      totalValue: ((pen.currentOccupancy * 225) / 15) * 300,
      deductions: 0,
      netValue: ((pen.currentOccupancy * 225) / 15) * 300,
      paymentType: 'cash',
      paymentDate: new Date().toISOString(),
      receiverAccountId: account?.id,
      observations: 'Teste de criação de venda',
      status: 'PENDING'
    };

    console.log('📤 Enviando dados da venda:', JSON.stringify(saleData, null, 2));

    const response = await axios.post('http://localhost:3001/api/sale-records', saleData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Venda criada com sucesso!');
    console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao criar venda:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('📋 Detalhes:', error.response.data.details);
    }
  }
}

testSaleCreation();
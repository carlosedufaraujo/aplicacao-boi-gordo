const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api/v1';

async function testReceptionAPI() {
  try {
    // 1. Login
    console.log('🔐 Fazendo login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@boicontrol.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (loginData.status !== 'success') {
      throw new Error('Falha no login');
    }

    const token = loginData.data.token;
    console.log('✅ Login realizado');

    // 2. Buscar uma compra existente
    console.log('\n📋 Buscando compras...');
    const purchasesResponse = await fetch(`${API_URL}/cattle-purchases`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const purchasesData = await purchasesResponse.json();
    
    if (!purchasesData.data || !purchasesData.data.items || purchasesData.data.items.length === 0) {
      console.log('❌ Nenhuma compra encontrada');
      return;
    }

    const purchase = purchasesData.data.items[0];
    console.log(`✅ Usando compra: ${purchase.lotCode} (ID: ${purchase.id})`);

    // 3. Testar recepção
    console.log('\n🚚 Testando registro de recepção...');
    
    const receptionPayload = {
      receivedDate: new Date().toISOString(),
      receivedWeight: 15000,
      actualQuantity: 50,
      receivedQuantity: 50,
      unloadingDate: new Date().toISOString(),
      observations: 'Teste de recepção via API',
      penAllocations: []
    };

    console.log('📦 Payload:', JSON.stringify(receptionPayload, null, 2));

    const receptionResponse = await fetch(`${API_URL}/cattle-purchases/${purchase.id}/reception`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(receptionPayload)
    });

    const responseText = await receptionResponse.text();
    let receptionData;
    
    try {
      receptionData = JSON.parse(responseText);
    } catch (e) {
      console.log('❌ Resposta não é JSON válido:', responseText);
      return;
    }

    if (receptionResponse.status === 200 || receptionResponse.status === 201) {
      console.log('✅ Recepção registrada com sucesso!');
      console.log('📊 Resposta:', JSON.stringify(receptionData, null, 2));
    } else {
      console.log(`❌ Erro ${receptionResponse.status}:`, receptionData);
      
      if (receptionData.message) {
        console.log('💬 Mensagem de erro:', receptionData.message);
      }
      
      if (receptionData.stack) {
        console.log('\n📚 Stack trace:');
        console.log(receptionData.stack);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

testReceptionAPI();
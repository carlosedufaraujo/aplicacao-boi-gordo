const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api/v1';

async function createTestPurchase() {
  try {
    // 1. Fazer login
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
    console.log('✅ Login realizado com sucesso!');

    // 2. Verificar se já existe um parceiro
    console.log('👥 Verificando parceiros...');
    const partnersResponse = await fetch(`${API_URL}/partners`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const partnersData = await partnersResponse.json();
    let partnerId;

    if (partnersData.data && partnersData.data.items && partnersData.data.items.length > 0) {
      partnerId = partnersData.data.items[0].id;
      console.log(`✅ Usando parceiro existente: ${partnersData.data.items[0].name}`);
    } else {
      // Criar um parceiro
      console.log('👥 Criando novo parceiro...');
      const createPartnerResponse = await fetch(`${API_URL}/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Fazenda Teste',
          type: 'VENDOR',
          cpfCnpj: '12345678901',
          phone: '11999999999',
          email: 'fazenda@teste.com',
          address: {
            street: 'Rua Teste',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01000-000'
          }
        })
      });

      const partnerData = await createPartnerResponse.json();
      if (partnerData.status !== 'success') {
        throw new Error('Falha ao criar parceiro');
      }
      partnerId = partnerData.data.id;
      console.log('✅ Parceiro criado com sucesso!');
    }

    // 2.5 Verificar contas pagadoras
    console.log('💰 Verificando contas pagadoras...');
    const payerAccountsResponse = await fetch(`${API_URL}/payer-accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const payerAccountsData = await payerAccountsResponse.json();
    let payerAccountId;

    if (payerAccountsData.data && payerAccountsData.data.items && payerAccountsData.data.items.length > 0) {
      payerAccountId = payerAccountsData.data.items[0].id;
      console.log(`✅ Usando conta pagadora existente: ${payerAccountsData.data.items[0].name}`);
    } else {
      // Criar uma conta pagadora
      console.log('💰 Criando nova conta pagadora...');
      const createPayerAccountResponse = await fetch(`${API_URL}/payer-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Conta Principal',
          type: 'BANK_ACCOUNT',
          balance: 1000000
        })
      });

      const payerAccountData = await createPayerAccountResponse.json();
      if (payerAccountData.status !== 'success') {
        throw new Error('Falha ao criar conta pagadora');
      }
      payerAccountId = payerAccountData.data.id;
      console.log('✅ Conta pagadora criada com sucesso!');
    }

    // 3. Criar compra de teste
    console.log('🐮 Criando compra de teste...');
    const purchaseResponse = await fetch(`${API_URL}/cattle-purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        lotCode: `LOTE-${Date.now()}`,
        vendorId: partnerId,
        payerAccountId: payerAccountId,
        purchaseDate: new Date().toISOString(),
        initialQuantity: 50,
        purchaseWeight: 15000, // 15 toneladas
        purchasePrice: 250000, // R$ 250.000
        pricePerArroba: 280, // R$ 280 por arroba
        animalType: 'BEEF_CATTLE', // Tipo válido
        paymentType: 'CASH', // Tipo de pagamento
        yield: 52, // Rendimento de 52%
        transportCost: 5000,
        otherCosts: 2000,
        origin: {
          farm: 'Fazenda Teste',
          city: 'Ribeirão Preto',
          state: 'SP'
        },
        averageAge: 24,
        observations: 'Lote de teste para demonstração do sistema'
      })
    });

    const purchaseData = await purchaseResponse.json();
    if (purchaseData.status !== 'success') {
      console.error('Erro ao criar compra:', purchaseData);
      throw new Error('Falha ao criar compra');
    }

    console.log('✅ Compra criada com sucesso!');
    console.log('📋 Detalhes da compra:');
    console.log(`   - ID: ${purchaseData.data.id}`);
    console.log(`   - Código do Lote: ${purchaseData.data.lotCode}`);
    console.log(`   - Quantidade: ${purchaseData.data.initialQuantity} cabeças`);
    console.log(`   - Status: ${purchaseData.data.status}`);
    console.log('\n📝 Para testar a recepção e alocação:');
    console.log('   1. Acesse o sistema em http://localhost:5173');
    console.log('   2. Vá para a seção de Compras');
    console.log(`   3. Localize o lote ${purchaseData.data.lotCode}`);
    console.log('   4. Clique no botão "Receber" ou mude o status para "RECEBIDO"');
    console.log('   5. O modal de Recepção e Alocação será aberto');
    console.log('   6. Na aba "Alocação em Currais", você verá os currais disponíveis');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createTestPurchase();
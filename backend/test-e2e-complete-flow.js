const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:3333/api/v1';

// Criar um token de teste
const testToken = jwt.sign(
  { 
    id: 'test-user-id',
    email: 'test@bovicontrol.com',
    role: 'admin'
  },
  'your-super-secret-jwt-key-here-change-in-production',
  { expiresIn: '1h' }
);

// Configurar axios com autenticação
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testToken}`
  }
});

// IDs que vamos criar e usar
let createdIds = {
  vendor: null,
  broker: null,
  transportCompany: null,
  payerAccount: null,
  pen1: null,
  pen2: null,
  cattlePurchase: null,
  buyer: null
};

async function createTestData() {
  console.log('🚀 Iniciando teste E2E completo do fluxo de compra de gado\n');
  console.log('='.repeat(60));

  try {
    // 1. CRIAR PARCEIROS
    console.log('\n📝 PASSO 1: Criando parceiros...');
    
    // Vendedor
    const vendor = await api.post('/partners', {
      name: 'Fazenda São João',
      type: 'VENDOR',
      cpfCnpj: '12345678901',
      phone: '65999991111',
      email: 'vendedor@fazenda.com',
      address: 'Rodovia MT-130, Km 45, Rondonópolis-MT',
      isActive: true
    });
    createdIds.vendor = vendor.data.data.id;
    console.log('✅ Vendedor criado:', vendor.data.data.name);

    // Corretor
    const broker = await api.post('/partners', {
      name: 'João Silva Corretor',
      type: 'BROKER',
      cpfCnpj: '98765432101',
      phone: '65999992222',
      email: 'corretor@email.com',
      address: 'Centro, Cuiabá-MT',
      isActive: true
    });
    createdIds.broker = broker.data.data.id;
    console.log('✅ Corretor criado:', broker.data.data.name);

    // Transportadora
    const transport = await api.post('/partners', {
      name: 'Transporte Rápido LTDA',
      type: 'SERVICE_PROVIDER',
      cpfCnpj: '11222333000144',
      phone: '65999993333',
      email: 'transporte@empresa.com',
      address: 'BR-163, Sinop-MT',
      isActive: true
    });
    createdIds.transportCompany = transport.data.data.id;
    console.log('✅ Transportadora criada:', transport.data.data.name);

    // Comprador (para venda futura)
    const buyer = await api.post('/partners', {
      name: 'Frigorífico Central',
      type: 'BUYER',
      cpfCnpj: '44555666000177',
      phone: '65999994444',
      email: 'compras@frigorifico.com',
      address: 'Distrito Industrial, Várzea Grande-MT',
      isActive: true
    });
    createdIds.buyer = buyer.data.data.id;
    console.log('✅ Comprador criado:', buyer.data.data.name);

    // 2. CRIAR CONTA PAGADORA
    console.log('\n💳 PASSO 2: Criando conta pagadora...');
    
    const payerAccount = await api.post('/payer-accounts', {
      bankName: 'Banco do Brasil',
      accountName: 'Fazenda Bovicontrol - Conta Principal',
      agency: '1234-5',
      accountNumber: '98765-0',
      accountType: 'CHECKING',
      balance: 1000000,
      isActive: true
    });
    createdIds.payerAccount = payerAccount.data.data.id;
    console.log('✅ Conta criada:', payerAccount.data.data.accountName);

    // 3. CRIAR CURRAIS
    console.log('\n🏠 PASSO 3: Criando currais...');
    
    const pen1 = await api.post('/pens', {
      penNumber: 'C-001',
      capacity: 100,
      penType: 'CONFINEMENT',
      waterAvailable: true,
      troughAvailable: true,
      covered: false,
      area: 500,
      status: 'AVAILABLE',
      notes: 'Curral principal - próximo ao cocho'
    });
    createdIds.pen1 = pen1.data.data.id;
    console.log('✅ Curral 1 criado:', pen1.data.data.penNumber);

    const pen2 = await api.post('/pens', {
      penNumber: 'C-002',
      capacity: 80,
      penType: 'CONFINEMENT',
      waterAvailable: true,
      troughAvailable: true,
      covered: true,
      area: 400,
      status: 'AVAILABLE',
      notes: 'Curral coberto - área de manejo'
    });
    createdIds.pen2 = pen2.data.data.id;
    console.log('✅ Curral 2 criado:', pen2.data.data.penNumber);

    // 4. CRIAR COMPRA DE GADO
    console.log('\n🐂 PASSO 4: Criando compra de gado...');
    
    const purchase = await api.post('/cattle-purchases', {
      vendorId: createdIds.vendor,
      brokerId: createdIds.broker,
      transportCompanyId: createdIds.transportCompany,
      payerAccountId: createdIds.payerAccount,
      location: 'Fazenda São João - Rondonópolis/MT',
      purchaseDate: new Date().toISOString(),
      animalType: 'MALE',
      animalAge: 24,
      initialQuantity: 150,
      purchaseWeight: 22500, // 150 animais x 150kg = 22.500kg
      carcassYield: 52.5,
      pricePerArroba: 285.00,
      paymentType: 'INSTALLMENT',
      paymentTerms: '30/60/90 dias',
      principalDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      freightCost: 3500,
      freightDistance: 350,
      commission: 1500,
      notes: 'Lote de alta qualidade - Nelore PO'
    });
    createdIds.cattlePurchase = purchase.data.data.id;
    console.log('✅ Compra criada:', purchase.data.data.lotCode);
    console.log('   - Quantidade:', purchase.data.data.initialQuantity, 'animais');
    console.log('   - Peso total:', purchase.data.data.purchaseWeight, 'kg');
    console.log('   - Valor total: R$', purchase.data.data.purchaseValue?.toFixed(2));

    // 5. REGISTRAR RECEPÇÃO
    console.log('\n📦 PASSO 5: Registrando recepção dos animais...');
    
    const reception = await api.post(`/cattle-purchases/${createdIds.cattlePurchase}/reception`, {
      receivedDate: new Date().toISOString(),
      receivedWeight: 22350, // Perda de 150kg no transporte
      actualQuantity: 149, // 1 morte no transporte
      transportMortality: 1,
      notes: 'Recepção ok - 1 animal morto no transporte'
    });
    console.log('✅ Recepção registrada');
    console.log('   - Peso recebido:', 22350, 'kg');
    console.log('   - Quebra de peso:', '0.67%');
    console.log('   - Mortalidade:', 1, 'animal');

    // 6. ALOCAR EM CURRAIS
    console.log('\n🏠 PASSO 6: Alocando animais nos currais...');
    
    const confined = await api.post(`/cattle-purchases/${createdIds.cattlePurchase}/confined`, {
      penAllocations: [
        {
          penId: createdIds.pen1,
          quantity: 80
        },
        {
          penId: createdIds.pen2,
          quantity: 69
        }
      ],
      notes: 'Animais distribuídos conforme tamanho e peso'
    });
    console.log('✅ Animais confinados');
    console.log('   - Curral C-001:', 80, 'animais');
    console.log('   - Curral C-002:', 69, 'animais');

    // 7. SIMULAR MORTE
    console.log('\n💀 PASSO 7: Registrando morte...');
    
    const death = await api.post(`/cattle-purchases/${createdIds.cattlePurchase}/death`, {
      count: 2,
      date: new Date().toISOString()
    });
    console.log('✅ Mortes registradas:', 2, 'animais');

    // 8. CRIAR DESPESAS RELACIONADAS
    console.log('\n💰 PASSO 8: Criando despesas relacionadas...');
    
    const expense1 = await api.post('/expenses', {
      category: 'ALIMENTAÇÃO',
      description: 'Ração inicial - 50 toneladas',
      totalAmount: 15000,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      purchaseId: createdIds.cattlePurchase,
      payerAccountId: createdIds.payerAccount,
      impactsCashFlow: true
    });
    console.log('✅ Despesa de alimentação criada: R$', 15000);

    const expense2 = await api.post('/expenses', {
      category: 'VETERINÁRIO',
      description: 'Vacinação e vermifugação do lote',
      totalAmount: 3500,
      dueDate: new Date().toISOString(),
      purchaseId: createdIds.cattlePurchase,
      payerAccountId: createdIds.payerAccount,
      impactsCashFlow: true
    });
    console.log('✅ Despesa veterinária criada: R$', 3500);

    // 9. VERIFICAR STATUS FINAL
    console.log('\n📊 PASSO 9: Verificando status final...');
    
    const finalStatus = await api.get(`/cattle-purchases/${createdIds.cattlePurchase}`);
    const finalData = finalStatus.data.data;
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 RESUMO FINAL DO LOTE', finalData.lotCode);
    console.log('='.repeat(60));
    console.log('Status:', finalData.status);
    console.log('Quantidade inicial:', finalData.initialQuantity, 'animais');
    console.log('Quantidade atual:', finalData.currentQuantity, 'animais');
    console.log('Mortalidade total:', finalData.deathCount, 'animais');
    console.log('Taxa de mortalidade:', ((finalData.deathCount / finalData.initialQuantity) * 100).toFixed(2) + '%');
    console.log('Peso médio atual:', (finalData.averageWeight || 0).toFixed(2), 'kg/animal');
    console.log('Valor da compra: R$', (finalData.purchaseValue || 0).toFixed(2));
    console.log('Custo total: R$', (finalData.totalCost || 0).toFixed(2));

    // 10. LISTAR TODOS OS DADOS CRIADOS
    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE E2E COMPLETO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n📋 IDs criados para referência:');
    console.log(JSON.stringify(createdIds, null, 2));

    return createdIds;

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.response?.data || error.message);
    if (error.response?.data?.stack) {
      console.error('Stack:', error.response.data.stack);
    }
    throw error;
  }
}

// Executar teste
createTestData()
  .then(ids => {
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('💡 Você pode usar os IDs acima para testar outras funcionalidades');
  })
  .catch(error => {
    console.error('\n❌ Teste falhou:', error.message);
    process.exit(1);
  });
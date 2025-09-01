const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

// Dados de teste para 5 compras
const testPurchases = [
  {
    vendorId: null,
    brokerId: null,
    transportCompanyId: null,
    payerAccountId: null,
    location: 'Fazenda Esperança',
    city: 'Ribeirão Preto',
    state: 'SP',
    farm: 'Fazenda Esperança',
    purchaseDate: new Date('2024-08-15').toISOString(),
    animalType: 'MALE',
    animalAge: 24,
    initialQuantity: 150,
    purchaseWeight: 22500, // 150kg por animal
    carcassYield: 52.5,
    pricePerArroba: 280.00,
    paymentType: 'CASH',
    paymentTerms: 'À vista com 2% de desconto',
    principalDueDate: new Date('2024-08-20').toISOString(),
    freightCost: 3500,
    freightDistance: 280,
    commission: 1500,
    notes: 'Lote de novilhos precoces, excelente genética'
  },
  {
    vendorId: null,
    brokerId: null,
    transportCompanyId: null,
    payerAccountId: null,
    location: 'Fazenda São José',
    city: 'Uberaba',
    state: 'MG',
    farm: 'Fazenda São José',
    purchaseDate: new Date('2024-08-20').toISOString(),
    animalType: 'FEMALE',
    animalAge: 18,
    initialQuantity: 80,
    purchaseWeight: 10400, // 130kg por animal
    carcassYield: 51.0,
    pricePerArroba: 265.00,
    paymentType: 'INSTALLMENT',
    paymentTerms: '30/60/90 dias',
    principalDueDate: new Date('2024-09-20').toISOString(),
    freightCost: 2200,
    freightDistance: 180,
    commission: 800,
    notes: 'Novilhas para engorda, vacinadas'
  },
  {
    vendorId: null,
    brokerId: null,
    transportCompanyId: null,
    payerAccountId: null,
    location: 'Fazenda Bela Vista',
    city: 'Campo Grande',
    state: 'MS',
    farm: 'Fazenda Bela Vista',
    purchaseDate: new Date('2024-08-25').toISOString(),
    animalType: 'MIXED',
    animalAge: 20,
    initialQuantity: 200,
    purchaseWeight: 28000, // 140kg por animal
    carcassYield: 53.0,
    pricePerArroba: 275.00,
    paymentType: 'BARTER',
    paymentTerms: 'Troca por bezerros + complemento',
    principalDueDate: new Date('2024-09-30').toISOString(),
    freightCost: 4800,
    freightDistance: 420,
    commission: 2000,
    notes: 'Lote misto, 60% machos, 40% fêmeas'
  },
  {
    vendorId: null,
    brokerId: null,
    transportCompanyId: null,
    payerAccountId: null,
    location: 'Fazenda Santa Clara',
    city: 'Barretos',
    state: 'SP',
    farm: 'Fazenda Santa Clara',
    purchaseDate: new Date('2024-09-01').toISOString(),
    animalType: 'MALE',
    animalAge: 30,
    initialQuantity: 120,
    purchaseWeight: 19200, // 160kg por animal
    carcassYield: 54.0,
    pricePerArroba: 285.00,
    paymentType: 'CASH',
    paymentTerms: 'À vista',
    principalDueDate: new Date('2024-09-05').toISOString(),
    freightCost: 2800,
    freightDistance: 220,
    commission: 1200,
    notes: 'Bois magros para terminação rápida'
  },
  {
    vendorId: null,
    brokerId: null,
    transportCompanyId: null,
    payerAccountId: null,
    location: 'Fazenda Rio Verde',
    city: 'Goiânia',
    state: 'GO',
    farm: 'Fazenda Rio Verde',
    purchaseDate: new Date('2024-09-05').toISOString(),
    animalType: 'MALE',
    animalAge: 26,
    initialQuantity: 90,
    purchaseWeight: 13950, // 155kg por animal
    carcassYield: 52.0,
    pricePerArroba: 270.00,
    paymentType: 'INSTALLMENT',
    paymentTerms: '50% entrada + 30 dias',
    principalDueDate: new Date('2024-10-05').toISOString(),
    freightCost: 3200,
    freightDistance: 350,
    commission: 900,
    notes: 'Lote uniforme, raça Nelore'
  }
];

async function createTestPurchases() {
  try {
    console.log('🚀 Iniciando criação de compras de teste...\n');
    
    // Primeiro, buscar IDs necessários
    console.log('📋 Buscando dados necessários...');
    
    // Buscar parceiros (fornecedores, corretores, transportadoras)
    const partnersRes = await axios.get(`${API_BASE}/partners`);
    const partners = partnersRes.data.data?.items || partnersRes.data.items || partnersRes.data || [];
    
    console.log(`  Total de parceiros encontrados: ${partners.length}`);
    
    const vendors = partners.filter(p => p.type === 'VENDOR' || p.partnerType === 'VENDOR');
    const brokers = partners.filter(p => p.type === 'BROKER' || p.partnerType === 'BROKER');
    const transporters = partners.filter(p => p.type === 'FREIGHT_CARRIER' || p.partnerType === 'FREIGHT_CARRIER');
    
    console.log(`  Fornecedores encontrados: ${vendors.length}`);
    console.log(`  Corretores encontrados: ${brokers.length}`);
    console.log(`  Transportadoras encontradas: ${transporters.length}`);
    
    // Buscar contas pagadoras
    const accountsRes = await axios.get(`${API_BASE}/payer-accounts`);
    const accounts = accountsRes.data.data?.items || accountsRes.data.items || [];
    console.log(`  Contas pagadoras encontradas: ${accounts.length}`);
    
    // Buscar ciclo ativo
    const cyclesRes = await axios.get(`${API_BASE}/cycles`);
    const cycles = cyclesRes.data.data?.items || cyclesRes.data.items || [];
    const activeCycle = cycles.find(c => c.stage === 'active') || cycles[0];
    console.log(`  Ciclo ativo: ${activeCycle?.name || 'Nenhum'}`);
    
    // Atribuir IDs aleatórios aos dados de teste
    const purchasesToCreate = testPurchases.map((purchase, index) => ({
      ...purchase,
      vendorId: vendors[index % vendors.length]?.id || vendors[0]?.id,
      brokerId: brokers.length > 0 ? brokers[index % brokers.length]?.id : null,
      transportCompanyId: transporters.length > 0 ? transporters[index % transporters.length]?.id : null,
      payerAccountId: accounts[index % accounts.length]?.id || accounts[0]?.id,
      cycleId: activeCycle?.id
    }));
    
    console.log('\n📝 Criando compras...\n');
    
    const createdPurchases = [];
    
    for (let i = 0; i < purchasesToCreate.length; i++) {
      const purchase = purchasesToCreate[i];
      
      console.log(`[${i + 1}/5] Criando compra:`);
      console.log(`  Local: ${purchase.farm} - ${purchase.city}/${purchase.state}`);
      console.log(`  Quantidade: ${purchase.initialQuantity} animais`);
      console.log(`  Peso total: ${purchase.purchaseWeight} kg`);
      console.log(`  Tipo: ${purchase.animalType === 'MALE' ? 'Machos' : purchase.animalType === 'FEMALE' ? 'Fêmeas' : 'Misto'}`);
      
      try {
        const response = await axios.post(`${API_BASE}/cattle-purchases`, purchase);
        createdPurchases.push(response.data.data);
        console.log(`  ✅ Criada com sucesso! Código: ${response.data.data.lotCode}`);
      } catch (error) {
        console.error(`  ❌ Erro ao criar:`, error.response?.data?.message || error.message);
      }
      
      console.log('');
    }
    
    // Resumo final
    console.log('📊 Resumo da criação:');
    console.log(`  Total tentado: ${testPurchases.length}`);
    console.log(`  Criadas com sucesso: ${createdPurchases.length}`);
    console.log(`  Falhas: ${testPurchases.length - createdPurchases.length}`);
    
    if (createdPurchases.length > 0) {
      console.log('\n📋 Compras criadas:');
      createdPurchases.forEach(p => {
        console.log(`  - ${p.lotCode}: ${p.initialQuantity} animais (${p.stage})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response) {
      console.error('  Detalhes:', error.response.data);
    }
  }
}

// Executar
createTestPurchases();
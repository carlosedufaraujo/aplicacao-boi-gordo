const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

// Dados de teste para novos lotes
const testLots = [
  {
    // Lote 1 - Pequeno, ideal para Curral 03 ou 04
    vendor: {
      name: 'Fazenda Boa Esperança',
      document: '12.345.678/0001-90',
      type: 'VENDOR',
      email: 'contato@boaesperanca.com.br',
      phone: '11987654321'
    },
    purchase: {
      location: 'Fazenda Boa Esperança',
      city: 'Presidente Prudente',
      state: 'SP',
      farm: 'Fazenda Boa Esperança',
      purchaseDate: new Date('2024-09-10').toISOString(),
      animalType: 'MALE',
      animalAge: 20,
      initialQuantity: 25,
      purchaseWeight: 3750, // 150kg por animal
      carcassYield: 51,
      pricePerArroba: 275,
      paymentType: 'CASH',
      paymentTerms: 'À vista',
      freightCost: 800,
      freightDistance: 120,
      commission: 250,
      notes: 'Lote pequeno para teste - ideal para currais menores'
    }
  },
  {
    // Lote 2 - Médio, ideal para Curral 05 ou 06
    vendor: {
      name: 'Pecuária Vale Verde',
      document: '23.456.789/0001-01',
      type: 'VENDOR',
      email: 'vendas@valeverde.com.br',
      phone: '19976543210'
    },
    purchase: {
      location: 'Sítio Vale Verde',
      city: 'Araçatuba',
      state: 'SP',
      farm: 'Sítio Vale Verde',
      purchaseDate: new Date('2024-09-12').toISOString(),
      animalType: 'FEMALE',
      animalAge: 18,
      initialQuantity: 70,
      purchaseWeight: 9100, // 130kg por animal
      carcassYield: 50,
      pricePerArroba: 265,
      paymentType: 'INSTALLMENT',
      paymentTerms: '30/60 dias',
      freightCost: 1800,
      freightDistance: 200,
      commission: 700,
      notes: 'Novilhas para engorda - lote médio'
    }
  },
  {
    // Lote 3 - Grande, ideal para Curral 01 ou 02
    vendor: {
      name: 'Grupo JBS Agropecuária',
      document: '34.567.890/0001-12',
      type: 'VENDOR',
      email: 'comercial@jbsagro.com.br',
      phone: '16965432109'
    },
    purchase: {
      location: 'Fazenda JBS Unidade Sul',
      city: 'Marília',
      state: 'SP',
      farm: 'Fazenda JBS Sul',
      purchaseDate: new Date('2024-09-08').toISOString(),
      animalType: 'MALE',
      animalAge: 28,
      initialQuantity: 95,
      purchaseWeight: 15200, // 160kg por animal
      carcassYield: 53,
      pricePerArroba: 290,
      paymentType: 'INSTALLMENT',
      paymentTerms: '50% entrada + 30/60 dias',
      freightCost: 2500,
      freightDistance: 280,
      commission: 950,
      notes: 'Bois semi-gordos, excelente genética'
    }
  },
  {
    // Lote 4 - Grande, ideal para Curral 07 ou 08
    vendor: {
      name: 'Fazenda São Pedro',
      document: '45.678.901/0001-23',
      type: 'VENDOR',
      email: 'fazenda@saopedro.agr.br',
      phone: '14954321098'
    },
    purchase: {
      location: 'Fazenda São Pedro',
      city: 'Botucatu',
      state: 'SP',
      farm: 'Fazenda São Pedro',
      purchaseDate: new Date('2024-09-15').toISOString(),
      animalType: 'MIXED',
      animalAge: 24,
      initialQuantity: 110,
      purchaseWeight: 17600, // 160kg por animal
      carcassYield: 52,
      pricePerArroba: 282,
      paymentType: 'CASH',
      paymentTerms: 'À vista com 3% desconto',
      freightCost: 2800,
      freightDistance: 320,
      commission: 1100,
      notes: 'Lote misto (60% machos, 40% fêmeas)'
    }
  },
  {
    // Lote 5 - Médio, ideal para Curral 09
    vendor: {
      name: 'Confinamento Central',
      document: '56.789.012/0001-34',
      type: 'VENDOR',
      email: 'central@confinamento.com.br',
      phone: '18943210987'
    },
    purchase: {
      location: 'Confinamento Central - Unidade 2',
      city: 'Assis',
      state: 'SP',
      farm: 'Confinamento Central',
      purchaseDate: new Date('2024-09-18').toISOString(),
      animalType: 'MALE',
      animalAge: 32,
      initialQuantity: 55,
      purchaseWeight: 9350, // 170kg por animal
      carcassYield: 54,
      pricePerArroba: 295,
      paymentType: 'INSTALLMENT',
      paymentTerms: '30 dias',
      freightCost: 1500,
      freightDistance: 180,
      commission: 550,
      notes: 'Bois gordos para terminação rápida'
    }
  },
  {
    // Lote 6 - Pequeno, ideal para completar espaços
    vendor: {
      name: 'Fazenda Nossa Senhora',
      document: '67.890.123/0001-45',
      type: 'VENDOR',
      email: 'fazenda.ns@gmail.com',
      phone: '15932109876'
    },
    purchase: {
      location: 'Fazenda Nossa Senhora Aparecida',
      city: 'Itapetininga',
      state: 'SP',
      farm: 'Fazenda N.S. Aparecida',
      purchaseDate: new Date('2024-09-20').toISOString(),
      animalType: 'FEMALE',
      animalAge: 16,
      initialQuantity: 40,
      purchaseWeight: 4800, // 120kg por animal
      carcassYield: 49,
      pricePerArroba: 260,
      paymentType: 'CASH',
      paymentTerms: 'À vista',
      freightCost: 1000,
      freightDistance: 150,
      commission: 400,
      notes: 'Novilhas jovens, primeira compra'
    }
  }
];

async function createTestLots() {
  console.log('🚀 Iniciando criação de lotes de teste...\n');
  
  let createdCount = 0;
  let errorCount = 0;
  
  // Buscar conta pagadora padrão
  let payerAccountId;
  let payerAccountName;
  try {
    const payerRes = await axios.get(`${API_BASE}/payer-accounts`);
    const payers = payerRes.data.data?.items || [];
    payerAccountId = payers[0]?.id;
    payerAccountName = payers[0]?.accountName;
    
    if (!payerAccountId) {
      console.log('❌ Nenhuma conta pagadora encontrada');
      return;
    }
    console.log(`✅ Usando conta pagadora: ${payerAccountName}\n`);
  } catch (error) {
    console.error('❌ Erro ao buscar conta pagadora:', error.message);
    return;
  }
  
  for (const lotData of testLots) {
    try {
      console.log(`📦 Criando lote de ${lotData.vendor.name}...`);
      
      // 1. Criar ou buscar fornecedor
      let vendorId;
      try {
        // Tentar buscar fornecedor existente
        const vendorsRes = await axios.get(`${API_BASE}/partners`);
        const vendors = vendorsRes.data.data?.items || [];
        const existingVendor = vendors.find(v => v.document === lotData.vendor.document);
        
        if (existingVendor) {
          vendorId = existingVendor.id;
          console.log(`  ✓ Fornecedor já existe: ${existingVendor.name}`);
        } else {
          // Criar novo fornecedor
          const vendorRes = await axios.post(`${API_BASE}/partners`, lotData.vendor);
          vendorId = vendorRes.data.data.id;
          console.log(`  ✓ Fornecedor criado: ${lotData.vendor.name}`);
        }
      } catch (error) {
        console.log(`  ⚠️ Erro com fornecedor:`, error.response?.data?.message || error.message);
        console.log(`  Tentando criar fornecedor sem verificação...`);
        try {
          const vendorRes = await axios.post(`${API_BASE}/partners`, lotData.vendor);
          vendorId = vendorRes.data.data.id;
          console.log(`  ✓ Fornecedor criado: ${lotData.vendor.name}`);
        } catch (err) {
          console.log(`  ❌ Não foi possível criar fornecedor:`, err.response?.data?.message || err.message);
          continue;
        }
      }
      
      // 2. Criar compra/lote
      const purchaseData = {
        ...lotData.purchase,
        vendorId,
        payerAccountId,
        principalDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const purchaseRes = await axios.post(`${API_BASE}/cattle-purchases`, purchaseData);
      const purchase = purchaseRes.data.data;
      
      console.log(`  ✓ Lote criado: ${purchase.lotCode}`);
      console.log(`    - Quantidade: ${purchase.initialQuantity} animais`);
      console.log(`    - Peso total: ${purchase.purchaseWeight} kg`);
      console.log(`    - Localização: ${purchase.city}/${purchase.state}`);
      console.log(`    - Status: ${purchase.stage || purchase.status}`);
      console.log(`    ➡️ Pronto para recepção e alocação manual\n`);
      
      createdCount++;
      
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Erro ao criar lote:`, error.response?.data?.message || error.message);
      if (error.response?.data?.details) {
        console.error(`     Detalhes:`, JSON.stringify(error.response.data.details, null, 2));
      }
      console.log('');
    }
  }
  
  console.log('═'.repeat(60));
  console.log(`✅ Processo concluído!`);
  console.log(`   ${createdCount} lotes criados com sucesso`);
  console.log(`   ${errorCount} erros encontrados`);
  console.log('');
  console.log('📋 Sugestão de alocação:');
  console.log('   • 25 animais  → Currais 03 ou 04 (capacidade 30-50)');
  console.log('   • 40 animais  → Curral 09 (capacidade 60)');
  console.log('   • 55 animais  → Currais 05 ou 06 (capacidade 80)');
  console.log('   • 70 animais  → Currais 05 ou 06 (capacidade 80)');
  console.log('   • 95 animais  → Currais 01 ou 02 (capacidade 100)');
  console.log('   • 110 animais → Currais 07 ou 08 (capacidade 120)');
  console.log('');
  console.log('💡 Use a página de Compras para fazer a recepção e alocação!');
}

// Executar
createTestLots().catch(console.error);
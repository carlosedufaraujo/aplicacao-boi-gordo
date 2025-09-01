const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

// IDs dos fornecedores criados
const vendors = {
  'Fazenda Boa Esperança': 'cmf0zgvum0006yzrft0wlvf3j',
  'Pecuária Vale Verde': 'cmf0zgvy70007yzrfs9g2za0q',
  'Grupo JBS Agropecuária': 'cmf0zfrqs0002yzrfhapy0nuz',
  'Fazenda São Pedro': 'cmf0zfrue0003yzrfotxdie8j',
  'Confinamento Central': 'cmf0zfrxv0004yzrfg6vjod90',
  'Fazenda Nossa Senhora': 'cmf0zfs1g0005yzrfx4s7osuh'
};

// Conta pagadora
const payerAccountId = 'cmf0i05up00016jgvwx7pwbpj';

// Dados dos lotes
const lots = [
  {
    vendorId: vendors['Fazenda Boa Esperança'],
    payerAccountId,
    city: 'Presidente Prudente',
    state: 'SP',
    farm: 'Fazenda Boa Esperança',
    purchaseDate: new Date('2024-09-10').toISOString(),
    animalType: 'MALE',
    animalAge: 20,
    initialQuantity: 25,
    purchaseWeight: 3750,
    carcassYield: 51,
    pricePerArroba: 275,
    paymentType: 'CASH',
    paymentTerms: 'À vista',
    freightCost: 800,
    freightDistance: 120,
    commission: 250,
    notes: 'Lote pequeno para teste - ideal para Curral 03 ou 04'
  },
  {
    vendorId: vendors['Pecuária Vale Verde'],
    payerAccountId,
    city: 'Araçatuba',
    state: 'SP',
    farm: 'Sítio Vale Verde',
    purchaseDate: new Date('2024-09-12').toISOString(),
    animalType: 'FEMALE',
    animalAge: 18,
    initialQuantity: 70,
    purchaseWeight: 9100,
    carcassYield: 50,
    pricePerArroba: 265,
    paymentType: 'INSTALLMENT',
    paymentTerms: '30/60 dias',
    freightCost: 1800,
    freightDistance: 200,
    commission: 700,
    notes: 'Novilhas para engorda - ideal para Curral 05 ou 06'
  },
  {
    vendorId: vendors['Grupo JBS Agropecuária'],
    payerAccountId,
    city: 'Marília',
    state: 'SP',
    farm: 'Fazenda JBS Sul',
    purchaseDate: new Date('2024-09-08').toISOString(),
    animalType: 'MALE',
    animalAge: 28,
    initialQuantity: 95,
    purchaseWeight: 15200,
    carcassYield: 53,
    pricePerArroba: 290,
    paymentType: 'INSTALLMENT',
    paymentTerms: '50% entrada + 30/60 dias',
    freightCost: 2500,
    freightDistance: 280,
    commission: 950,
    notes: 'Bois semi-gordos - ideal para Curral 01 ou 02'
  },
  {
    vendorId: vendors['Fazenda São Pedro'],
    payerAccountId,
    city: 'Botucatu',
    state: 'SP',
    farm: 'Fazenda São Pedro',
    purchaseDate: new Date('2024-09-15').toISOString(),
    animalType: 'MIXED',
    animalAge: 24,
    initialQuantity: 110,
    purchaseWeight: 17600,
    carcassYield: 52,
    pricePerArroba: 282,
    paymentType: 'CASH',
    paymentTerms: 'À vista com 3% desconto',
    freightCost: 2800,
    freightDistance: 320,
    commission: 1100,
    notes: 'Lote misto - ideal para Curral 07 ou 08'
  },
  {
    vendorId: vendors['Confinamento Central'],
    payerAccountId,
    city: 'Assis',
    state: 'SP',
    farm: 'Confinamento Central',
    purchaseDate: new Date('2024-09-18').toISOString(),
    animalType: 'MALE',
    animalAge: 32,
    initialQuantity: 55,
    purchaseWeight: 9350,
    carcassYield: 54,
    pricePerArroba: 295,
    paymentType: 'INSTALLMENT',
    paymentTerms: '30 dias',
    freightCost: 1500,
    freightDistance: 180,
    commission: 550,
    notes: 'Bois gordos - ideal para Curral 09'
  },
  {
    vendorId: vendors['Fazenda Nossa Senhora'],
    payerAccountId,
    city: 'Itapetininga',
    state: 'SP',
    farm: 'Fazenda N.S. Aparecida',
    purchaseDate: new Date('2024-09-20').toISOString(),
    animalType: 'FEMALE',
    animalAge: 16,
    initialQuantity: 40,
    purchaseWeight: 4800,
    carcassYield: 49,
    pricePerArroba: 260,
    paymentType: 'CASH',
    paymentTerms: 'À vista',
    freightCost: 1000,
    freightDistance: 150,
    commission: 400,
    notes: 'Novilhas jovens - pode completar espaços em currais'
  }
];

async function createLots() {
  console.log('🚀 Criando lotes de teste...\n');
  
  let created = 0;
  let errors = 0;
  
  for (const lot of lots) {
    try {
      const response = await axios.post(`${API_BASE}/cattle-purchases`, lot);
      const purchase = response.data.data;
      
      console.log(`✅ Lote ${purchase.lotCode} criado com sucesso!`);
      console.log(`   Fornecedor: ${purchase.vendor?.name || 'N/A'}`);
      console.log(`   Quantidade: ${purchase.initialQuantity} animais`);
      console.log(`   Local: ${purchase.city}/${purchase.state}`);
      console.log(`   Notas: ${purchase.notes}`);
      console.log('');
      
      created++;
    } catch (error) {
      console.error(`❌ Erro ao criar lote:`, error.response?.data?.message || error.message);
      if (error.response?.data?.details) {
        console.error('   Detalhes:', error.response.data.details);
      }
      console.log('');
      errors++;
    }
  }
  
  console.log('═'.repeat(60));
  console.log(`✅ Processo concluído!`);
  console.log(`   ${created} lotes criados`);
  console.log(`   ${errors} erros`);
  console.log('');
  console.log('📋 Próximos passos:');
  console.log('1. Acesse a página de Compras');
  console.log('2. Para cada lote, clique em "Receber e Alocar"');
  console.log('3. Escolha o curral apropriado conforme sugestões:');
  console.log('   • 25 animais  → Curral 03 ou 04');
  console.log('   • 40 animais  → Curral 09');
  console.log('   • 55 animais  → Curral 05 ou 06');
  console.log('   • 70 animais  → Curral 05 ou 06');
  console.log('   • 95 animais  → Curral 01 ou 02');
  console.log('   • 110 animais → Curral 07 ou 08');
}

createLots().catch(console.error);
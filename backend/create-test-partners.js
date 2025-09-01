const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

// Dados de teste para parceiros
const testPartners = [
  // Fornecedores
  {
    name: 'João Silva Pecuária',
    type: 'VENDOR',
    partnerType: 'VENDOR',
    documentType: 'CPF',
    documentNumber: '123.456.789-00',
    email: 'joao.silva@fazenda.com',
    phone: '16987654321',
    address: 'Fazenda Esperança, Rodovia SP-330, Km 120',
    city: 'Ribeirão Preto',
    state: 'SP',
    zipCode: '14000-000',
    isActive: true
  },
  {
    name: 'Agropecuária Bela Vista Ltda',
    type: 'VENDOR',
    partnerType: 'VENDOR',
    documentType: 'CNPJ',
    documentNumber: '12.345.678/0001-90',
    email: 'contato@belavista.com.br',
    phone: '3433125678',
    address: 'Rodovia BR-050, Km 78',
    city: 'Uberaba',
    state: 'MG',
    zipCode: '38000-000',
    isActive: true
  },
  {
    name: 'Fazenda Santa Clara',
    type: 'VENDOR',
    partnerType: 'VENDOR',
    documentType: 'CNPJ',
    documentNumber: '98.765.432/0001-10',
    email: 'santa.clara@agro.com',
    phone: '6733259876',
    address: 'Estrada Municipal, Km 45',
    city: 'Campo Grande',
    state: 'MS',
    zipCode: '79000-000',
    isActive: true
  },
  // Corretores
  {
    name: 'Carlos Corretor de Gado',
    type: 'BROKER',
    partnerType: 'BROKER',
    documentType: 'CPF',
    documentNumber: '987.654.321-00',
    email: 'carlos.corretor@gmail.com',
    phone: '17998765432',
    address: 'Rua dos Pecuaristas, 100',
    city: 'Barretos',
    state: 'SP',
    zipCode: '14780-000',
    commission: 2.5,
    isActive: true
  },
  {
    name: 'Corretora Boi Gordo',
    type: 'BROKER',
    partnerType: 'BROKER',
    documentType: 'CNPJ',
    documentNumber: '55.666.777/0001-88',
    email: 'contato@boigordo.com',
    phone: '6233334444',
    address: 'Av. Goiás, 1500',
    city: 'Goiânia',
    state: 'GO',
    zipCode: '74000-000',
    commission: 3.0,
    isActive: true
  },
  // Transportadoras
  {
    name: 'Transporte Rápido Ltda',
    type: 'FREIGHT_CARRIER',
    partnerType: 'FREIGHT_CARRIER',
    documentType: 'CNPJ',
    documentNumber: '11.222.333/0001-44',
    email: 'frete@transrapido.com',
    phone: '1633332222',
    address: 'Rod. Anhanguera, Km 310',
    city: 'Ribeirão Preto',
    state: 'SP',
    zipCode: '14000-000',
    isActive: true
  },
  {
    name: 'Logística Pecuária MS',
    type: 'FREIGHT_CARRIER',
    partnerType: 'FREIGHT_CARRIER',
    documentType: 'CNPJ',
    documentNumber: '44.555.666/0001-77',
    email: 'transporte@pecuariams.com',
    phone: '6733445566',
    address: 'BR-163, Km 500',
    city: 'Campo Grande',
    state: 'MS',
    zipCode: '79000-000',
    isActive: true
  }
];

async function createTestPartners() {
  try {
    console.log('🚀 Criando parceiros de teste...\n');
    
    const createdPartners = {
      vendors: [],
      brokers: [],
      transporters: []
    };
    
    for (const partner of testPartners) {
      console.log(`📝 Criando ${partner.partnerType}: ${partner.name}`);
      
      try {
        const response = await axios.post(`${API_BASE}/partners`, partner);
        
        if (partner.partnerType === 'VENDOR') {
          createdPartners.vendors.push(response.data.data);
        } else if (partner.partnerType === 'BROKER') {
          createdPartners.brokers.push(response.data.data);
        } else if (partner.partnerType === 'FREIGHT_CARRIER') {
          createdPartners.transporters.push(response.data.data);
        }
        
        console.log(`  ✅ Criado com sucesso!`);
      } catch (error) {
        console.error(`  ❌ Erro:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n📊 Resumo:');
    console.log(`  Fornecedores criados: ${createdPartners.vendors.length}`);
    console.log(`  Corretores criados: ${createdPartners.brokers.length}`);
    console.log(`  Transportadoras criadas: ${createdPartners.transporters.length}`);
    
    return createdPartners;
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response) {
      console.error('  Detalhes:', error.response.data);
    }
  }
}

// Executar
createTestPartners();
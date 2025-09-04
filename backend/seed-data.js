const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsaWVudF9pZF8xIiwibmFtZSI6IkFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImlhdCI6MTczMjgzNjI2NywiZXhwIjoxNzQxNDc2MjY3fQ.K1tM6CamNqLLX2y0L8qTPFEyAqm2tLq39JfUY0yl-is';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

// Função para criar parceiros
async function createPartners() {
  console.log('📝 Criando 10 parceiros...');
  
  const partnerTypes = ['SELLER', 'BUYER', 'BROKER', 'BUYER']; // Removido PARTNER pois não é válido
  const partners = [];
  
  for (let i = 1; i <= 10; i++) {
    const partnerData = {
      name: `Parceiro ${i} - ${new Date().toLocaleDateString('pt-BR')}`,
      type: partnerTypes[i % 4], // Campo correto: type em vez de partnerType
      cpfCnpj: `${String(10000000000 + i).padStart(14, '0')}`, // Apenas números
      contact: `(11) 9${String(8000 + i).padStart(4, '0')}-${String(1000 + i).padStart(4, '0')}`,
      email: `parceiro${i}@exemplo.com.br`,
      address: `Rua dos Parceiros, ${i * 100} - São Paulo/SP`,
      city: 'São Paulo',
      state: 'SP',
      zipCode: `${String(1000 + i).padStart(5, '0')}-000`,
      commission: partnerTypes[i % 4] === 'BROKER' ? 2.5 : 0,
      paymentTerms: 30,
      creditLimit: 1000000 + (i * 100000),
      isActive: true,
      notes: `Parceiro cadastrado via script - ${new Date().toLocaleString('pt-BR')}`
    };
    
    partners.push(partnerData);
  }
  
  let createdCount = 0;
  for (const partner of partners) {
    try {
      const response = await axios.post(`${API_URL}/partners`, partner, { headers });
      console.log(`✅ Parceiro criado: ${partner.name} (${partner.type})`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Erro ao criar parceiro ${partner.name}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log(`\n✅ ${createdCount} parceiros criados com sucesso!\n`);
}

// Função para criar currais
async function createPens() {
  console.log('🐂 Criando 50 currais...');
  
  const pens = [];
  const sections = ['Setor A', 'Setor B', 'Setor C', 'Setor D', 'Setor E'];
  
  for (let i = 1; i <= 50; i++) {
    const penData = {
      penNumber: String(i), // Campo obrigatório: penNumber como string
      name: `Curral ${i}`,
      location: sections[Math.floor((i - 1) / 10)], // 10 currais por setor
      capacity: 50 + (i % 3) * 10, // Capacidades de 50, 60 ou 70
      currentOccupancy: 0,
      type: i <= 35 ? 'FATTENING' : i <= 45 ? 'QUARANTINE' : 'RECEPTION', // Tipos válidos
      status: 'AVAILABLE',
      waterAvailable: true,
      troughCount: 4 + (i % 2), // 4 ou 5 cochos
      area: 500 + (i * 10), // Área entre 510m² e 1000m²
      observations: `Curral ${i <= 35 ? 'de engorda' : i <= 45 ? 'de quarentena' : 'de recepção'} - ${new Date().toLocaleDateString('pt-BR')}`,
      isActive: true
    };
    
    pens.push(penData);
  }
  
  let createdCount = 0;
  for (const pen of pens) {
    try {
      const response = await axios.post(`${API_URL}/pens`, pen, { headers });
      console.log(`✅ Curral criado: ${pen.name} - Nº ${pen.penNumber} (${pen.type})`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Erro ao criar curral ${pen.name}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log(`\n✅ ${createdCount} currais criados com sucesso!\n`);
}

// Função para criar contas pagadoras
async function createPayerAccounts() {
  console.log('💰 Criando 3 contas pagadoras com R$ 5 milhões cada...');
  
  const accounts = [
    {
      accountName: 'Conta Principal - Banco do Brasil',
      accountType: 'CHECKING', // Tipo válido em inglês
      bankName: 'Banco do Brasil',
      accountNumber: '12345-6',
      agency: '1234',
      balance: 5000000,
      holderName: 'Fazenda Boi Gordo LTDA',
      holderDocument: '12.345.678/0001-90',
      isActive: true,
      isPrimary: true,
      notes: 'Conta principal para operações do confinamento'
    },
    {
      accountName: 'Conta Operacional - Bradesco',
      accountType: 'CHECKING', // Tipo válido em inglês
      bankName: 'Bradesco',
      accountNumber: '54321-0',
      agency: '5678',
      balance: 5000000,
      holderName: 'Fazenda Boi Gordo LTDA',
      holderDocument: '12.345.678/0001-90',
      isActive: true,
      isPrimary: false,
      notes: 'Conta para pagamentos operacionais'
    },
    {
      accountName: 'Conta Reserva - Santander',
      accountType: 'SAVINGS', // Tipo válido em inglês
      bankName: 'Santander',
      accountNumber: '98765-4',
      agency: '9876',
      balance: 5000000,
      holderName: 'Fazenda Boi Gordo LTDA',
      holderDocument: '12.345.678/0001-90',
      isActive: true,
      isPrimary: false,
      notes: 'Conta reserva para emergências'
    }
  ];
  
  let createdCount = 0;
  for (const account of accounts) {
    try {
      const response = await axios.post(`${API_URL}/payer-accounts`, account, { headers });
      console.log(`✅ Conta criada: ${account.accountName} - Saldo: R$ ${account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Erro ao criar conta ${account.accountName}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log(`\n✅ ${createdCount} contas pagadoras criadas com sucesso!`);
  console.log(`💵 Total em contas: R$ ${(createdCount * 5000000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`);
}

// Função principal
async function seedDatabase() {
  console.log('🚀 Iniciando cadastro de dados...\n');
  console.log('================================\n');
  
  try {
    // Criar parceiros
    await createPartners();
    
    // Aguardar um pouco entre as operações
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Criar currais
    await createPens();
    
    // Aguardar um pouco entre as operações
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Criar contas pagadoras
    await createPayerAccounts();
    
    console.log('================================');
    console.log('✅ PROCESSO CONCLUÍDO COM SUCESSO!');
    console.log('================================\n');
    
    console.log('📊 Resumo:');
    console.log('- 10 parceiros de diferentes tipos');
    console.log('- 50 currais (40 confinamento + 10 quarentena)');
    console.log('- 3 contas pagadoras com R$ 5 milhões cada');
    console.log(`- Total em contas: R$ 15.000.000,00\n`);
    
  } catch (error) {
    console.error('❌ Erro geral durante o processo:', error.message);
  }
}

// Executar
seedDatabase();
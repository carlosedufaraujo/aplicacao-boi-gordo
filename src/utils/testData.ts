import { useAppStore } from '../stores/useAppStore';

export const createTestData = () => {
  const store = useAppStore.getState();
  
  // Limpar dados existentes
  store.clearAllTestData();
  
  // ===== CRIAR 5 CICLOS =====
  store.addCycle({
    name: 'Ciclo 2024/Q1',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    status: 'active',
    description: 'Primeiro trimestre de 2024',
    budget: 5000000,
    targetAnimals: 1000
  });
  
  store.addCycle({
    name: 'Ciclo 2024/Q2',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-06-30'),
    status: 'planned',
    description: 'Segundo trimestre de 2024',
    budget: 6000000,
    targetAnimals: 1200
  });
  
  store.addCycle({
    name: 'Ciclo 2023/Q4',
    startDate: new Date('2023-10-01'),
    endDate: new Date('2023-12-31'),
    status: 'completed',
    description: 'Último trimestre de 2023',
    budget: 4500000,
    targetAnimals: 900
  });
  
  store.addCycle({
    name: 'Ciclo Especial 2024',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-05-31'),
    status: 'planned',
    description: 'Ciclo especial para animais premium',
    budget: 3000000,
    targetAnimals: 500
  });
  
  store.addCycle({
    name: 'Ciclo 2024/Q3',
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-09-30'),
    status: 'planned',
    description: 'Terceiro trimestre de 2024',
    budget: 5500000,
    targetAnimals: 1100
  });
  
  // ===== CRIAR 5 VENDEDORES =====
  store.addPartner({
    name: 'Fazenda São João',
    type: 'vendor',
    city: 'Ribeirão Preto',
    state: 'SP',
    phone: '(16) 99999-9999',
    email: 'contato@fazendajoao.com.br',
    cpfCnpj: '12.345.678/0001-90',
    address: 'Rodovia SP-330, Km 298',
    bankName: 'Banco do Brasil',
    bankAgency: '1234-5',
    bankAccount: '12345-6',
    bankAccountType: 'checking',
    observations: 'Fornecedor premium - sempre tem animais de qualidade',
    isActive: true
  });
  
  store.addPartner({
    name: 'Fazenda Boa Vista',
    type: 'vendor',
    city: 'Barretos',
    state: 'SP',
    phone: '(17) 88888-8888',
    email: 'vendas@boavista.com.br',
    cpfCnpj: '23.456.789/0001-01',
    address: 'Estrada Municipal BRT-050, Km 15',
    bankName: 'Bradesco',
    bankAgency: '2345-6',
    bankAccount: '23456-7',
    bankAccountType: 'checking',
    observations: 'Especializada em nelore',
    isActive: true
  });
  
  store.addPartner({
    name: 'Pecuária Três Irmãos',
    type: 'vendor',
    city: 'Araçatuba',
    state: 'SP',
    phone: '(18) 77777-7777',
    email: 'contato@3irmaos.com.br',
    cpfCnpj: '34.567.890/0001-12',
    address: 'Fazenda Três Irmãos, s/n',
    bankName: 'Sicoob',
    bankAgency: '3456',
    bankAccount: '34567-8',
    bankAccountType: 'checking',
    isActive: true
  });
  
  store.addPartner({
    name: 'Rancho Alegre Pecuária',
    type: 'vendor',
    city: 'Presidente Prudente',
    state: 'SP',
    phone: '(18) 66666-6666',
    email: 'rancho@alegre.com.br',
    cpfCnpj: '45.678.901/0001-23',
    address: 'Rod. Raposo Tavares, Km 572',
    bankName: 'Santander',
    bankAgency: '4567',
    bankAccount: '45678-9',
    bankAccountType: 'checking',
    observations: 'Trabalha com lotes grandes',
    isActive: true
  });
  
  store.addPartner({
    name: 'Agropecuária Santa Maria',
    type: 'vendor',
    city: 'São José do Rio Preto',
    state: 'SP',
    phone: '(17) 55555-5555',
    email: 'santamaria@agro.com.br',
    cpfCnpj: '56.789.012/0001-34',
    address: 'Fazenda Santa Maria, Zona Rural',
    bankName: 'Itaú',
    bankAgency: '5678',
    bankAccount: '56789-0',
    bankAccountType: 'checking',
    isActive: true
  });
  
  // ===== CRIAR 5 CORRETORES =====
  store.addPartner({
    name: 'José Silva Corretor',
    type: 'broker',
    city: 'Barretos',
    state: 'SP',
    phone: '(17) 98888-8888',
    email: 'jose@corretor.com',
    cpfCnpj: '123.456.789-00',
    address: 'Rua dos Pecuaristas, 100',
    bankName: 'Banco do Brasil',
    bankAgency: '1111-1',
    bankAccount: '11111-1',
    bankAccountType: 'checking',
    observations: 'Corretor experiente, 20 anos de mercado',
    isActive: true
  });
  
  store.addPartner({
    name: 'Maria Santos Corretora',
    type: 'broker',
    city: 'Ribeirão Preto',
    state: 'SP',
    phone: '(16) 97777-7777',
    email: 'maria@corretora.com',
    cpfCnpj: '234.567.890-11',
    address: 'Av. Bandeirantes, 1500',
    bankName: 'Bradesco',
    bankAgency: '2222-2',
    bankAccount: '22222-2',
    bankAccountType: 'checking',
    observations: 'Especialista em gado nelore',
    isActive: true
  });
  
  store.addPartner({
    name: 'Pedro Oliveira Negócios',
    type: 'broker',
    city: 'Araçatuba',
    state: 'SP',
    phone: '(18) 96666-6666',
    email: 'pedro@negocios.com',
    cpfCnpj: '345.678.901-22',
    address: 'Rua do Comércio, 250',
    bankName: 'Santander',
    bankAgency: '3333',
    bankAccount: '33333-3',
    bankAccountType: 'checking',
    isActive: true
  });
  
  store.addPartner({
    name: 'Ana Costa Intermediações',
    type: 'broker',
    city: 'Presidente Prudente',
    state: 'SP',
    phone: '(18) 95555-5555',
    email: 'ana@intermediacoes.com',
    cpfCnpj: '456.789.012-33',
    address: 'Praça Central, 50',
    bankName: 'Caixa',
    bankAgency: '4444',
    bankAccount: '44444-4',
    bankAccountType: 'checking',
    observations: 'Atende toda região oeste paulista',
    isActive: true
  });
  
  store.addPartner({
    name: 'Carlos Mendes Corretor',
    type: 'broker',
    city: 'São José do Rio Preto',
    state: 'SP',
    phone: '(17) 94444-4444',
    email: 'carlos@corretor.com',
    cpfCnpj: '567.890.123-44',
    address: 'Av. Alberto Andaló, 3000',
    bankName: 'Banco Inter',
    bankAgency: '0001',
    bankAccount: '55555-5',
    bankAccountType: 'checking',
    isActive: true
  });
  
  // ===== CRIAR 5 FRIGORÍFICOS =====
  store.addPartner({
    name: 'Frigorífico Central',
    type: 'slaughterhouse',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 3333-3333',
    email: 'vendas@frigorificocentral.com.br',
    cpfCnpj: '98.765.432/0001-10',
    address: 'Av. Industrial, 5000',
    bankName: 'Banco do Brasil',
    bankAgency: '9999-9',
    bankAccount: '99999-9',
    bankAccountType: 'checking',
    observations: 'Principal parceiro - melhores preços',
    isActive: true
  });
  
  store.addPartner({
    name: 'JBS Unidade Barretos',
    type: 'slaughterhouse',
    city: 'Barretos',
    state: 'SP',
    phone: '(17) 3322-1100',
    email: 'compras.barretos@jbs.com.br',
    cpfCnpj: '02.916.265/0001-60',
    address: 'Rod. Brigadeiro Faria Lima, Km 1',
    bankName: 'Itaú',
    bankAgency: '8888',
    bankAccount: '88888-8',
    bankAccountType: 'checking',
    isActive: true
  });
  
  store.addPartner({
    name: 'Minerva Foods',
    type: 'slaughterhouse',
    city: 'Barretos',
    state: 'SP',
    phone: '(17) 3321-3000',
    email: 'compras@minervafoods.com',
    cpfCnpj: '67.620.377/0001-14',
    address: 'Av. Antonio Pires, 400',
    bankName: 'Bradesco',
    bankAgency: '7777',
    bankAccount: '77777-7',
    bankAccountType: 'checking',
    observations: 'Bom pagador, preferência por lotes grandes',
    isActive: true
  });
  
  store.addPartner({
    name: 'Marfrig Unidade SP',
    type: 'slaughterhouse',
    city: 'Promissão',
    state: 'SP',
    phone: '(14) 3541-1000',
    email: 'promissao@marfrig.com.br',
    cpfCnpj: '03.853.896/0001-40',
    address: 'Rod. BR-153, Km 123',
    bankName: 'Santander',
    bankAgency: '6666',
    bankAccount: '66666-6',
    bankAccountType: 'checking',
    isActive: true
  });
  
  store.addPartner({
    name: 'Frigorífico Regional',
    type: 'slaughterhouse',
    city: 'Araçatuba',
    state: 'SP',
    phone: '(18) 3636-2000',
    email: 'vendas@frigorificoregional.com.br',
    cpfCnpj: '12.123.123/0001-12',
    address: 'Distrito Industrial, Quadra 10',
    bankName: 'Sicoob',
    bankAgency: '5555',
    bankAccount: '55555-5',
    bankAccountType: 'checking',
    observations: 'Atende pequenos e médios produtores',
    isActive: true
  });
  
  // ===== CRIAR 5 TRANSPORTADORAS =====
  store.addTransporter({
    name: 'Transporte Rápido Ltda',
    document: '12.345.678/0001-90',
    phone: '(16) 3333-4444',
    email: 'contato@transporterapido.com.br',
    address: 'Av. dos Caminhões, 1000',
    city: 'Ribeirão Preto',
    state: 'SP',
    zipCode: '14000-000',
    pricePerKm: 2.50,
    minDistance: 50,
    isActive: true
  });
  
  store.addTransporter({
    name: 'Logística Boi Gordo',
    document: '23.456.789/0001-01',
    phone: '(17) 4444-5555',
    email: 'operacao@logisticabg.com.br',
    address: 'Rod. BR-153, Km 45',
    city: 'Barretos',
    state: 'SP',
    zipCode: '14780-000',
    pricePerKm: 2.80,
    minDistance: 30,
    isActive: true
  });
  
  store.addTransporter({
    name: 'Transporte Rural Express',
    document: '34.567.890/0001-12',
    phone: '(19) 5555-6666',
    email: 'frete@ruralexpress.com.br',
    address: 'Estrada Municipal, 500',
    city: 'Campinas',
    state: 'SP',
    zipCode: '13000-000',
    pricePerKm: 3.00,
    minDistance: 100,
    isActive: true
  });
  
  store.addTransporter({
    name: 'Rodovias do Gado',
    document: '45.678.901/0001-23',
    phone: '(18) 6666-7777',
    email: 'transporte@rodoviasdogado.com.br',
    address: 'BR-374, Km 200',
    city: 'Presidente Prudente',
    state: 'SP',
    zipCode: '19000-000',
    pricePerKm: 2.60,
    minDistance: 80,
    isActive: true
  });
  
  store.addTransporter({
    name: 'Transporte Seguro Pecuária',
    document: '56.789.012/0001-34',
    phone: '(17) 7777-8888',
    email: 'seguro@transportepecuaria.com.br',
    address: 'Av. dos Transportadores, 2000',
    city: 'São José do Rio Preto',
    state: 'SP',
    zipCode: '15000-000',
    pricePerKm: 2.70,
    minDistance: 60,
    isActive: true
  });
  
  // ===== CRIAR 5 INSTITUIÇÕES FINANCEIRAS =====
  store.addFinancialInstitution({
    name: 'Banco do Brasil',
    code: '001',
    type: 'bank',
    isActive: true
  });
  
  store.addFinancialInstitution({
    name: 'Bradesco',
    code: '237',
    type: 'bank',
    isActive: true
  });
  
  store.addFinancialInstitution({
    name: 'Sicoob',
    code: '756',
    type: 'cooperative',
    isActive: true
  });
  
  store.addFinancialInstitution({
    name: 'Santander',
    code: '033',
    type: 'bank',
    isActive: true
  });
  
  store.addFinancialInstitution({
    name: 'Nubank',
    code: '260',
    type: 'fintech',
    isActive: true
  });
  
  // ===== CRIAR 5 CONTAS PAGADORAS =====
  const bbId = store.financialInstitutions.find(fi => fi.code === '001')?.id || '';
  const bradescoId = store.financialInstitutions.find(fi => fi.code === '237')?.id || '';
  const sicoobId = store.financialInstitutions.find(fi => fi.code === '756')?.id || '';
  const santanderId = store.financialInstitutions.find(fi => fi.code === '033')?.id || '';
  const nubankId = store.financialInstitutions.find(fi => fi.code === '260')?.id || '';
  
  store.addPayerAccount({
    institutionId: bbId,
    accountName: 'Conta Principal - Operações',
    bankName: 'Banco do Brasil',
    agency: '1234-5',
    accountNumber: '12345-6',
    accountType: 'checking',
    balance: 1500000,
    isActive: true,
    isDefault: true
  });
  
  store.addPayerAccount({
    institutionId: bradescoId,
    accountName: 'Conta Pagamento Fornecedores',
    bankName: 'Bradesco',
    agency: '2345-6',
    accountNumber: '23456-7',
    accountType: 'checking',
    balance: 800000,
    isActive: true,
    isDefault: false
  });
  
  store.addPayerAccount({
    institutionId: sicoobId,
    accountName: 'Conta Cooperativa',
    bankName: 'Sicoob',
    agency: '3456',
    accountNumber: '34567-8',
    accountType: 'checking',
    balance: 600000,
    isActive: true,
    isDefault: false
  });
  
  store.addPayerAccount({
    institutionId: santanderId,
    accountName: 'Conta Investimentos',
    bankName: 'Santander',
    agency: '4567',
    accountNumber: '45678-9',
    accountType: 'savings',
    balance: 2000000,
    isActive: true,
    isDefault: false
  });
  
  store.addPayerAccount({
    institutionId: nubankId,
    accountName: 'Conta Digital - Reserva',
    bankName: 'Nubank',
    agency: '0001',
    accountNumber: '567890-1',
    accountType: 'checking',
    balance: 300000,
    isActive: true,
    isDefault: false
  });
  
  // ===== CRIAR APENAS 1 ORDEM DE COMPRA COMPLETA =====
  const cycleId = store.cycles.find(c => c.status === 'active')?.id || '';
  const vendorId = store.partners.find(p => p.type === 'vendor' && p.name === 'Fazenda São João')?.id || '';
  const brokerId = store.partners.find(p => p.type === 'broker' && p.name === 'José Silva Corretor')?.id || '';
  const transporterId = store.transporters.find(t => t.name === 'Transporte Rápido Ltda')?.id || '';
  const payerAccountId = store.payerAccounts.find(a => a.isDefault)?.id || '';
  
  store.addPurchaseOrder({
    code: store.generatePurchaseOrderCode(),
    cycleId,
    date: new Date('2024-01-15'),
    vendorId,
    brokerId,
    city: 'Ribeirão Preto',
    state: 'SP',
    quantity: 120,
    animalType: 'male',
    estimatedAge: 24,
    totalWeight: 48000, // 400kg por animal
    rcPercentage: 52, // Rendimento de carcaça 52%
    pricePerArroba: 300,
    commission: 6000,
    commissionPaymentType: 'installment',
    commissionPaymentDate: new Date('2024-02-15'),
    otherCosts: 2000,
    otherCostsDescription: 'Despesas com documentação e veterinário',
    otherCostsPaymentType: 'installment',
    otherCostsPaymentDate: new Date('2024-02-15'),
    status: 'order',
    paymentValidated: false,
    paymentType: 'installment',
    paymentDate: new Date('2024-02-15'),
    payerAccountId,
    observations: 'Lote de alta qualidade - Nelore PO',
    freightKm: 150,
    freightCostPerKm: 2.50,
    transportCompanyId: transporterId
  });
  
  // Criar notificação sobre os dados criados
  store.addNotification({
    title: 'Dados de teste criados',
    message: 'Cadastros básicos e 1 ordem de compra foram criados com sucesso',
    type: 'success',
    actionUrl: '/pipeline'
  });
  
  console.log('✅ Dados de teste criados com sucesso!');
  console.log('📋 Resumo:');
  console.log('- 5 Ciclos');
  console.log('- 5 Vendedores');
  console.log('- 5 Corretores');
  console.log('- 5 Frigoríficos');
  console.log('- 5 Transportadoras');
  console.log('- 5 Instituições Financeiras');
  console.log('- 5 Contas Pagadoras');
  console.log('- 1 Ordem de Compra completa');
}; 
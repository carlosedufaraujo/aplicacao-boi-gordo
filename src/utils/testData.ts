import { useAppStore } from '../stores/useAppStore';

export const createTestData = () => {
  const store = useAppStore.getState();
  
  // Criar ciclo
  store.addCycle({
    name: 'Ciclo 2024/01',
    startDate: new Date('2024-01-01'),
    status: 'active',
    description: 'Ciclo de engorda Q1 2024',
    budget: 5000000,
    targetAnimals: 1000
  });
  
  const cycleId = store.cycles[0]?.id || '';
  
  // Criar transportadoras
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
  
  // Criar instituições financeiras
  store.addFinancialInstitution({
    name: 'Banco do Brasil',
    code: '001',
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
    name: 'Nubank',
    code: '260',
    type: 'fintech',
    isActive: true
  });
  
  // Criar contas pagadoras
  const bbId = store.financialInstitutions.find(fi => fi.code === '001')?.id || '';
  const sicoobId = store.financialInstitutions.find(fi => fi.code === '756')?.id || '';
  const nubankId = store.financialInstitutions.find(fi => fi.code === '260')?.id || '';
  
  store.addPayerAccount({
    institutionId: bbId,
    accountName: 'Conta Principal',
    bankName: 'Banco do Brasil',
    agency: '1234-5',
    accountNumber: '12345-6',
    accountType: 'checking',
    balance: 1000000,
    isActive: true,
    isDefault: true
  });
  
  store.addPayerAccount({
    institutionId: sicoobId,
    accountName: 'Conta Operacional',
    bankName: 'Sicoob',
    agency: '4321',
    accountNumber: '54321-0',
    accountType: 'checking',
    balance: 500000,
    isActive: true,
    isDefault: false
  });
  
  store.addPayerAccount({
    institutionId: nubankId,
    accountName: 'Conta Reserva',
    bankName: 'Nubank',
    agency: '0001',
    accountNumber: '987654-3',
    accountType: 'savings',
    balance: 250000,
    isActive: true,
    isDefault: false
  });
  
  // Criar parceiros
  store.addPartner({
    name: 'Fazenda São João',
    type: 'vendor',
    city: 'Ribeirão Preto',
    state: 'SP',
    phone: '(16) 99999-9999',
    email: 'contato@fazendajoao.com.br',
    cpfCnpj: '12.345.678/0001-90',
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
    isActive: true
  });
  
  store.addPartner({
    name: 'José Silva Corretor',
    type: 'broker',
    city: 'Barretos',
    state: 'SP',
    phone: '(17) 98888-8888',
    email: 'jose@corretor.com',
    cpfCnpj: '123.456.789-00',
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
    isActive: true
  });
  
  store.addPartner({
    name: 'Frigorífico Central',
    type: 'slaughterhouse',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 3333-3333',
    email: 'vendas@frigorificocentral.com.br',
    cpfCnpj: '98.765.432/0001-10',
    isActive: true
  });
  
  const vendors = store.partners.filter(p => p.type === 'vendor');
  const brokers = store.partners.filter(p => p.type === 'broker');
  const transporters = store.transporters;
  const payerAccounts = store.payerAccounts;
  
  // Criar ordens de compra - todas na etapa "order"
  // Ordem 1 - À vista
  store.addPurchaseOrder({
    code: store.generatePurchaseOrderCode(),
    cycleId,
    date: new Date('2024-01-10'),
    vendorId: vendors[0]?.id || '',
    brokerId: brokers[0]?.id || '',
    city: 'Ribeirão Preto',
    state: 'SP',
    quantity: 100,
    animalType: 'male',
    estimatedAge: 24,
    totalWeight: 45000, // Peso maior para simular quebra
    rcPercentage: 52,
    pricePerArroba: 300,
    commission: 5000,
    commissionPaymentType: 'cash',
    otherCosts: 1000,
    otherCostsPaymentType: 'cash',
    status: 'order',
    paymentValidated: false,
    paymentType: 'cash',
    payerAccountId: payerAccounts[0]?.id,
    observations: 'Lote premium - pagamento à vista',
    freightKm: 150,
    freightCostPerKm: 2.50,
    transportCompanyId: transporters[0]?.id
  });
  
  // Ordem 2 - A prazo (tudo mesmo vencimento)
  const vencimentoPrazo = new Date('2024-02-15');
  store.addPurchaseOrder({
    code: store.generatePurchaseOrderCode(),
    cycleId,
    date: new Date('2024-01-12'),
    vendorId: vendors[1]?.id || '',
    brokerId: brokers[1]?.id || '',
    city: 'Barretos',
    state: 'SP',
    quantity: 150,
    animalType: 'male',
    estimatedAge: 20,
    totalWeight: 55000, // Peso maior para simular quebra
    rcPercentage: 50,
    pricePerArroba: 295,
    commission: 7000,
    commissionPaymentType: 'installment',
    commissionPaymentDate: vencimentoPrazo,
    otherCosts: 1500,
    otherCostsDescription: 'Custos administrativos e veterinário',
    otherCostsPaymentType: 'installment',
    otherCostsPaymentDate: vencimentoPrazo,
    status: 'order',
    paymentValidated: false,
    paymentType: 'installment',
    paymentDate: vencimentoPrazo,
    payerAccountId: payerAccounts[1]?.id,
    observations: 'Pagamento 30 dias',
    freightKm: 200,
    freightCostPerKm: 2.80,
    transportCompanyId: transporters[1]?.id
  });
  
  // Ordem 3 - À vista
  store.addPurchaseOrder({
    code: store.generatePurchaseOrderCode(),
    cycleId,
    date: new Date('2024-01-15'),
    vendorId: vendors[2]?.id || '',
    city: 'Araçatuba',
    state: 'SP',
    quantity: 80,
    animalType: 'female',
    estimatedAge: 18,
    totalWeight: 28000, // Peso maior para simular quebra
    rcPercentage: 48,
    pricePerArroba: 280,
    commission: 3000,
    commissionPaymentType: 'cash',
    otherCosts: 800,
    otherCostsPaymentType: 'cash',
    status: 'order',
    paymentValidated: false,
    paymentType: 'cash',
    payerAccountId: payerAccounts[2]?.id,
    observations: 'Lote de fêmeas - pagamento à vista',
    freightKm: 180,
    freightCostPerKm: 3.00,
    transportCompanyId: transporters[2]?.id
  });
  
  // Ordem 4 - A prazo (mesmo vencimento)
  store.addPurchaseOrder({
    code: store.generatePurchaseOrderCode(),
    cycleId,
    date: new Date('2024-01-18'),
    vendorId: vendors[0]?.id || '',
    brokerId: brokers[0]?.id || '',
    city: 'Sertãozinho',
    state: 'SP',
    quantity: 120,
    animalType: 'male',
    estimatedAge: 22,
    totalWeight: 50000, // Peso maior para simular quebra
    rcPercentage: 51,
    pricePerArroba: 298,
    commission: 6000,
    commissionPaymentType: 'installment',
    commissionPaymentDate: vencimentoPrazo,
    otherCosts: 2000,
    otherCostsDescription: 'Despesas com documentação e transporte interno',
    otherCostsPaymentType: 'installment',
    otherCostsPaymentDate: vencimentoPrazo,
    status: 'order',
    paymentValidated: false,
    paymentType: 'installment',
    paymentDate: vencimentoPrazo,
    payerAccountId: payerAccounts[0]?.id,
    observations: 'Lote grande - pagamento 30 dias',
    freightKm: 120,
    freightCostPerKm: 2.50,
    transportCompanyId: transporters[0]?.id
  });
  
  // Ordem 5 - À vista
  store.addPurchaseOrder({
    code: store.generatePurchaseOrderCode(),
    cycleId,
    date: new Date('2024-01-20'),
    vendorId: vendors[1]?.id || '',
    city: 'Guaíra',
    state: 'SP',
    quantity: 90,
    animalType: 'male',
    estimatedAge: 26,
    totalWeight: 42000, // Peso maior para simular quebra
    rcPercentage: 53,
    pricePerArroba: 305,
    commission: 4500,
    commissionPaymentType: 'cash',
    otherCosts: 0,
    otherCostsPaymentType: 'cash',
    status: 'order',
    paymentValidated: false,
    paymentType: 'cash',
    payerAccountId: payerAccounts[1]?.id,
    observations: 'Animais pesados - à vista',
    freightKm: 250,
    freightCostPerKm: 2.80,
    transportCompanyId: transporters[1]?.id
  });
  
  // Criar algumas notificações
  store.addNotification({
    title: 'Novas ordens criadas',
    message: '5 ordens de compra foram criadas aguardando validação',
    type: 'info',
    actionUrl: '/pipeline'
  });
  
  store.addNotification({
    title: 'Transportadoras cadastradas',
    message: '3 novas transportadoras foram cadastradas no sistema',
    type: 'success'
  });
  
  store.addNotification({
    title: 'Contas bancárias configuradas',
    message: '3 contas pagadoras foram configuradas com sucesso',
    type: 'success'
  });
  
  store.addNotification({
    title: 'Atenção: Pagamentos pendentes',
    message: 'Existem ordens aguardando validação de pagamento',
    type: 'warning',
    actionUrl: '/pipeline'
  });
  
  console.log('Dados de teste criados com sucesso!');
  console.log('- 5 ordens de compra (todas na etapa inicial)');
  console.log('- 3 transportadoras');
  console.log('- 3 instituições financeiras');
  console.log('- 3 contas pagadoras');
  console.log('- Mix de pagamentos à vista e a prazo');
  console.log('- Pesos configurados para simular quebra na recepção');
  console.log('- Mortes serão registradas durante o transporte/recepção');
}; 
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
    name: 'Frigorífico Central',
    type: 'slaughterhouse',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 3333-3333',
    email: 'vendas@frigorificocentral.com.br',
    cpfCnpj: '98.765.432/0001-10',
    isActive: true
  });
  
  const vendorId = store.partners.find(p => p.type === 'vendor')?.id || '';
  const brokerId = store.partners.find(p => p.type === 'broker')?.id || '';
  
  // Criar ordens de compra
  store.addPurchaseOrder({
    code: store.generatePurchaseOrderCode(),
    cycleId,
    date: new Date('2024-01-10'),
    vendorId,
    brokerId,
    city: 'Ribeirão Preto',
    state: 'SP',
    quantity: 100,
    animalType: 'male',
    estimatedAge: 24,
    totalWeight: 40000,
    rcPercentage: 52,
    pricePerArroba: 300,
    commission: 5000,
    taxes: 2000,
    otherCosts: 1000,
    status: 'confined',
    paymentValidated: true,
    paymentType: 'cash',
    observations: 'Lote de alta qualidade'
  });
  
  store.addPurchaseOrder({
    code: store.generatePurchaseOrderCode(),
    cycleId,
    date: new Date('2024-01-15'),
    vendorId,
    city: 'Barretos',
    state: 'SP',
    quantity: 150,
    animalType: 'male',
    estimatedAge: 20,
    totalWeight: 52500,
    rcPercentage: 50,
    pricePerArroba: 295,
    commission: 7000,
    taxes: 3000,
    otherCosts: 1500,
    status: 'order',
    paymentValidated: false,
    paymentType: 'installment',
    paymentDate: new Date('2024-02-15')
  });
  
  const purchaseOrderId = store.purchaseOrders[0]?.id || '';
  
  // Criar lotes
  if (purchaseOrderId) {
    store.addCattleLot({
      lotNumber: store.generateLotNumber(),
      purchaseOrderId,
      entryWeight: 40000,
      entryQuantity: 100,
      freightKm: 150,
      freightCostPerKm: 2.5,
      entryDate: new Date('2024-01-12'),
      estimatedGmd: 1.5,
      deaths: 0,
      status: 'active',
      custoAcumulado: {
        aquisicao: 0,
        sanidade: 0,
        alimentacao: 0,
        operacional: 0,
        frete: 0,
        outros: 0,
        total: 0
      }
    });
  }
  
  // Criar algumas notificações
  store.addNotification({
    title: 'Nova ordem de compra',
    message: 'Ordem ACXENG0002 criada com 150 animais',
    type: 'info',
    actionUrl: '/pipeline'
  });
  
  store.addNotification({
    title: 'Lote recebido',
    message: 'Lote L0001 recebido com sucesso - 100 animais',
    type: 'success',
    actionUrl: '/lots'
  });
  
  store.addNotification({
    title: 'Atenção: Pesagem pendente',
    message: 'Lote L0001 está há 15 dias sem pesagem',
    type: 'warning',
    actionUrl: '/lots'
  });
  
  console.log('Dados de teste criados com sucesso!');
}; 
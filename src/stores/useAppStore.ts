import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  FatteningCycle, Partner, PurchaseOrder, CattleLot, WeightReading, 
  HealthRecord, FeedCost, LotMovement, SaleSimulation, FinancialAccount,
  KPI, PenStatus, Debt, ZootechnicalPerformance, BankStatement, 
  FinancialReconciliation, CostCenter, CostAllocation, Expense, 
  BudgetPlan, FinancialReport, PenRegistration, PenAllocation, 
  PayerAccount, SaleRecord, Notification, LoteCurralLink, 
  CostProportionalAllocation, SaleDesignation,
  Transporter, FinancialInstitution,
  SystemUpdate, UpdateFeedback,
  // 🆕 TIPOS DO DRC
  CashFlowEntry, CashFlowPeriod, CashFlowProjection, WorkingCapital,
  FinancialContribution, CashFlowEntryFormData, FinancialContributionFormData,
  // 🆕 TIPOS DE LANÇAMENTOS NÃO-CAIXA
  NonCashExpense,
  // 🆕 TIPOS DO DRE
  DREStatement, DREGenerationParams, DREComparison,
  // 🆕 TIPOS DE RATEIO DE CUSTOS INDIRETOS
  IndirectCostAllocation, AllocationTemplate, IndirectCostCenter,
  AllocationGenerationParams, IndirectCostSummary
} from '../types';
import { addDays, subDays, format } from 'date-fns';

interface AppState {
  // Estado
  currentPage: string;
  darkMode: boolean;
  sidebarCollapsed: boolean;
  
  // Dados
  cycles: FatteningCycle[];
  partners: Partner[];
  purchaseOrders: PurchaseOrder[];
  cattleLots: CattleLot[];
  weightReadings: WeightReading[];
  healthRecords: HealthRecord[];
  feedCosts: FeedCost[];
  lotMovements: LotMovement[];
  financialAccounts: FinancialAccount[];
  kpis: KPI[];
  penRegistrations: PenRegistration[];
  penAllocations: PenAllocation[];
  penStatuses: PenStatus[];
  debts: Debt[];
  bankStatements: BankStatement[];
  financialReconciliations: FinancialReconciliation[];
  costCenters: CostCenter[];
  costAllocations: CostAllocation[];
  expenses: Expense[];
  budgetPlans: BudgetPlan[];
  financialReports: FinancialReport[];
  payerAccounts: PayerAccount[];
  saleRecords: SaleRecord[];
  notifications: Notification[];
  loteCurralLinks: LoteCurralLink[];
  costProportionalAllocations: CostProportionalAllocation[];
  saleDesignations: SaleDesignation[];
  transporters: Transporter[];
  financialInstitutions: FinancialInstitution[];
  
  // Estados de Atualizações do Sistema
  systemUpdates: SystemUpdate[];
  updateFeedbacks: UpdateFeedback[];
  lastViewedUpdateDate?: Date;
  
  // 🆕 ESTADOS DO DRC
  cashFlowEntries: CashFlowEntry[];
  financialContributions: FinancialContribution[];
  cashFlowPeriods: CashFlowPeriod[];
  cashFlowProjections: CashFlowProjection[];
  workingCapitalHistory: WorkingCapital[];
  
  // 🆕 ESTADOS DE LANÇAMENTOS NÃO-CAIXA
  nonCashExpenses: NonCashExpense[];
  
  // 🆕 ESTADOS DO DRE
  dreStatements: DREStatement[];
  dreComparisons: DREComparison[];
  
  // 🆕 ESTADOS DE RATEIO DE CUSTOS INDIRETOS
  indirectCostAllocations: IndirectCostAllocation[];
  allocationTemplates: AllocationTemplate[];
  indirectCostCenters: IndirectCostCenter[];
  
  // Ações - Navegação
  setCurrentPage: (page: string) => void;
  setDarkMode: (darkMode: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Ações - Ciclos
  addCycle: (cycle: Omit<FatteningCycle, 'id' | 'createdAt'>) => void;
  updateCycle: (id: string, data: Partial<FatteningCycle>) => void;
  deleteCycle: (id: string) => void;
  
  // Ações - Parceiros
  addPartner: (partner: Omit<Partner, 'id' | 'createdAt'>) => void;
  updatePartner: (id: string, data: Partial<Partner>) => void;
  deletePartner: (id: string) => void;
  
  // Ações - Ordens de Compra
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  movePurchaseOrderToNextStage: (id: string) => void;
  movePurchaseOrderToPreviousStage: (id: string) => void;
  generatePurchaseOrderCode: () => string;
  
  // Ações - Lotes
  addCattleLot: (lot: Omit<CattleLot, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCattleLot: (id: string, data: Partial<CattleLot>) => void;
  deleteCattleLot: (id: string) => void;
  generateLotNumber: () => string;
  
  // Ações - Pesagens
  addWeightReading: (reading: Omit<WeightReading, 'id' | 'createdAt'>) => void;
  updateWeightReading: (id: string, data: Partial<WeightReading>) => void;
  deleteWeightReading: (id: string) => void;
  
  // Ações - Protocolos Sanitários
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'createdAt'>) => void;
  updateHealthRecord: (id: string, data: Partial<HealthRecord>) => void;
  deleteHealthRecord: (id: string) => void;
  
  // Ações - Custos de Alimentação
  addFeedCost: (cost: Omit<FeedCost, 'id' | 'createdAt'>) => void;
  updateFeedCost: (id: string, data: Partial<FeedCost>) => void;
  deleteFeedCost: (id: string) => void;
  
  // Ações - Movimentações de Lote
  addLotMovement: (movement: Omit<LotMovement, 'id' | 'createdAt'>) => void;
  updateLotMovement: (id: string, data: Partial<LotMovement>) => void;
  deleteLotMovement: (id: string) => void;
  
  // Ações - Contas Financeiras
  addFinancialAccount: (account: Omit<FinancialAccount, 'id' | 'createdAt'>) => void;
  updateFinancialAccount: (id: string, data: Partial<FinancialAccount>) => void;
  deleteFinancialAccount: (id: string) => void;
  
  // Ações - KPIs
  updateKPIs: () => void;
  
  // Ações - Currais
  addPenRegistration: (pen: Omit<PenRegistration, 'id' | 'createdAt'>) => void;
  updatePenRegistration: (id: string, data: Partial<PenRegistration>) => void;
  deletePenRegistration: (id: string) => void;
  
  // Ações - Alocações de Curral (LEGACY - mantido para compatibilidade)
  addPenAllocation: (allocation: Omit<PenAllocation, 'id' | 'createdAt'>) => void;
  updatePenAllocation: (id: string, data: Partial<PenAllocation>) => void;
  deletePenAllocation: (id: string) => void;
  
  // Ações - Modelo Operacional Lote-Curral
  addLoteCurralLink: (link: Omit<LoteCurralLink, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLoteCurralLink: (id: string, data: Partial<LoteCurralLink>) => void;
  removeLoteCurralLink: (id: string) => void;
  allocateLotToPens: (loteId: string, allocations: { curralId: string; quantidade: number }[]) => void;
  
  // Ações - Alocação Proporcional de Custos
  allocateCostProportionally: (custoOrigemId: string, custoOrigemTipo: 'health' | 'feed' | 'operational' | 'other', curralId: string, valorTotal: number) => void;
  getCostAllocationsByLot: (loteId: string) => CostProportionalAllocation[];
  
  // Ações - Pipeline de Vendas
  addSaleDesignation: (designation: Omit<SaleDesignation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSaleDesignation: (id: string, data: Partial<SaleDesignation>) => void;
  moveSaleDesignationToNextStage: (id: string) => void;
  
  // Consultas - Modelo Operacional
  getLotesInCurral: (curralId: string) => { lote: CattleLot; link: LoteCurralLink }[];
  getCurraisOfLote: (loteId: string) => { curral: PenRegistration; link: LoteCurralLink }[];
  calculateLotCostsByCategory: (loteId: string) => CattleLot['custoAcumulado'];
  
  // Ações - Dívidas
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDebt: (id: string, data: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  
  // Ações - Extratos Bancários
  addBankStatement: (statement: Omit<BankStatement, 'id' | 'createdAt'>) => void;
  updateBankStatement: (id: string, data: Partial<BankStatement>) => void;
  deleteBankStatement: (id: string) => void;
  
  // Ações - Conciliações Financeiras
  addFinancialReconciliation: (reconciliation: Omit<FinancialReconciliation, 'id' | 'createdAt'>) => void;
  updateFinancialReconciliation: (id: string, data: Partial<FinancialReconciliation>) => void;
  deleteFinancialReconciliation: (id: string) => void;
  
  // Ações - Centros de Custo
  addCostCenter: (center: Omit<CostCenter, 'id' | 'createdAt'>) => void;
  updateCostCenter: (id: string, data: Partial<CostCenter>) => void;
  deleteCostCenter: (id: string) => void;
  
  // Ações - Alocações de Custo
  addCostAllocation: (allocation: Omit<CostAllocation, 'id' | 'createdAt'>) => void;
  updateCostAllocation: (id: string, data: Partial<CostAllocation>) => void;
  deleteCostAllocation: (id: string) => void;
  
  // Ações - Despesas
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  // Ações - Planos de Orçamento
  addBudgetPlan: (plan: Omit<BudgetPlan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBudgetPlan: (id: string, data: Partial<BudgetPlan>) => void;
  deleteBudgetPlan: (id: string) => void;
  
  // Ações - Relatórios Financeiros
  addFinancialReport: (report: Omit<FinancialReport, 'id'>) => void;
  updateFinancialReport: (id: string, data: Partial<FinancialReport>) => void;
  deleteFinancialReport: (id: string) => void;
  
  // Ações - Contas Pagadoras
  addPayerAccount: (account: Omit<PayerAccount, 'id' | 'createdAt'>) => void;
  updatePayerAccount: (id: string, data: Partial<PayerAccount>) => void;
  deletePayerAccount: (id: string) => void;
  
  // Ações - Registros de Venda
  addSaleRecord: (record: Omit<SaleRecord, 'id' | 'createdAt'>) => void;
  updateSaleRecord: (id: string, data: Partial<SaleRecord>) => void;
  deleteSaleRecord: (id: string) => void;
  
  // Ações - Notificações
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  getUnreadNotificationsCount: () => number;
  
  // Funções de Utilidade
  calculateLotCosts: (lotId: string) => number;
  calculateLotProfit: (lotId: string, pricePerArroba: number) => SaleSimulation;
  calculateZootechnicalPerformance: (lotId: string) => ZootechnicalPerformance;
  getTotalConfinedAnimals: () => number;
  getUnallocatedAnimals: () => number;
  getAvailablePens: () => PenStatus[];

  // 🆕 NOVO: Função helper para calcular arrobas de carcaça
  calculateCarcassArrobas: (order: PurchaseOrder) => number;
  
  // 🆕 AÇÕES DO DRC
  // Ações - DRC/Fluxo de Caixa
  addCashFlowEntry: (entry: CashFlowEntryFormData) => void;
  updateCashFlowEntry: (id: string, data: Partial<CashFlowEntryFormData>) => void;
  deleteCashFlowEntry: (id: string) => void;
  
  // Ações - Contribuições Financeiras
  addFinancialContribution: (contribution: FinancialContributionFormData) => void;
  updateFinancialContribution: (id: string, data: Partial<FinancialContributionFormData>) => void;
  confirmFinancialContribution: (id: string) => void;
  
  // Ações - Análises e Projeções
  generateCashFlowProjection: (horizonDays: number) => void;
  calculateWorkingCapital: () => void;
  
  // 🆕 AÇÕES DE LANÇAMENTOS NÃO-CAIXA
  addNonCashExpense: (expense: Omit<NonCashExpense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNonCashExpense: (id: string, data: Partial<NonCashExpense>) => void;
  deleteNonCashExpense: (id: string) => void;
  recordMortality: (lotId: string, quantity: number, cause: 'disease' | 'accident' | 'stress' | 'unknown', notes?: string) => void;
  recordWeightLoss: (lotId: string, expectedWeight: number, actualWeight: number, notes?: string) => void;
  
  // 🆕 AÇÕES DO DRE
  generateDREStatement: (params: DREGenerationParams) => DREStatement | null;
  saveDREStatement: (dre: DREStatement) => void;
  deleteDREStatement: (id: string) => void;
  compareDREs: (entityIds: string[], entityType: 'lot' | 'pen', periodStart: Date, periodEnd: Date) => DREComparison | null;
  getDREByEntity: (entityType: 'lot' | 'pen', entityId: string) => DREStatement[];
  
  // 🆕 AÇÕES DE RATEIO DE CUSTOS INDIRETOS
  generateIndirectCostAllocation: (params: AllocationGenerationParams) => IndirectCostAllocation | null;
  saveIndirectCostAllocation: (allocation: IndirectCostAllocation) => void;
  approveIndirectCostAllocation: (id: string, approvedBy: string) => void;
  applyIndirectCostAllocation: (id: string) => void;
  deleteIndirectCostAllocation: (id: string) => void;
  getIndirectCostSummary: (entityType: 'lot' | 'pen' | 'global', entityId: string, periodStart: Date, periodEnd: Date) => IndirectCostSummary | null;
  // Templates
  createAllocationTemplate: (template: Omit<AllocationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAllocationTemplate: (id: string, data: Partial<AllocationTemplate>) => void;
  deleteAllocationTemplate: (id: string) => void;
  // Centros de Custo
  createIndirectCostCenter: (center: Omit<IndirectCostCenter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIndirectCostCenter: (id: string, data: Partial<IndirectCostCenter>) => void;
  deleteIndirectCostCenter: (id: string) => void;
  
  // 🆕 FUNÇÃO PARA LIMPAR DADOS DE TESTE
  clearAllTestData: () => void;
  
  // Ações - Transportadoras
  addTransporter: (transporter: Omit<Transporter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransporter: (id: string, data: Partial<Transporter>) => void;
  deleteTransporter: (id: string) => void;
  
  // Ações - Instituições Financeiras
  addFinancialInstitution: (institution: Omit<FinancialInstitution, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFinancialInstitution: (id: string, data: Partial<FinancialInstitution>) => void;
  deleteFinancialInstitution: (id: string) => void;
  
  // Estados de Atualizações do Sistema
  
  // Ações - Atualizações do Sistema
  setLastViewedUpdateDate: (date: Date) => void;
  addSystemUpdate: (update: Omit<SystemUpdate, 'id' | 'createdAt'>) => void;
  updateSystemUpdate: (id: string, data: Partial<SystemUpdate>) => void;
  deleteSystemUpdate: (id: string) => void;
  addUpdateFeedback: (feedback: Omit<UpdateFeedback, 'id' | 'createdAt'>) => void;
  getUnviewedUpdatesCount: () => number;
}

// Helper function to generate 50 pens
const generateInitialPens = () => {
  const penRegistrations: PenRegistration[] = [];
  const penStatuses: PenStatus[] = [];
  
  // Criar 15 currais por linha, total de 60 currais (4 linhas)
  const pensPerLine = 15;
  const totalLines = 4;
  const totalPens = pensPerLine * totalLines;
  
  // Letras para as linhas
  const lineLetters = ['A', 'B', 'C', 'D'];
  
  for (let i = 1; i <= totalPens; i++) {
    const penNumber = i.toString();
    const lineIndex = Math.floor((i - 1) / pensPerLine);
    const lineLetter = lineLetters[lineIndex];
    
    // Create pen registration
    penRegistrations.push({
      id: `pen-${i}`,
      penNumber,
      capacity: 130, // Mantido temporariamente para compatibilidade
      location: `Linha ${lineLetter}`,
      description: '-',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create pen status
    penStatuses.push({
      penNumber,
      capacity: 130, // Mantido temporariamente para compatibilidade
      currentAnimals: 0,
      status: 'available'
    });
  }
  
  return { penRegistrations, penStatuses };
};

// Generate initial pens
const initialPens = generateInitialPens();

export const useAppStore = create<AppState>((set, get) => ({
  // Estado inicial
  currentPage: 'dashboard',
  darkMode: false,
  sidebarCollapsed: false,
  
  // Dados iniciais
  cycles: [],
  partners: [],
  purchaseOrders: [],
  cattleLots: [],
  weightReadings: [],
  healthRecords: [],
  feedCosts: [],
  lotMovements: [],
  financialAccounts: [],
  kpis: [
    {
      label: 'Animais Confinados',
      value: '0',
      icon: 'Beef'
    },
    {
      label: 'Média Dia/Confinado',
      value: '0',
      icon: 'Clock'
    },
    {
      label: 'Média Quebra de Peso',
      value: '0%',
      icon: 'TrendingDown'
    },
    {
      label: 'Mortalidade Acumulada',
      value: '0%',
      icon: 'AlertTriangle'
    }
  ],
  penRegistrations: initialPens.penRegistrations,
  penAllocations: [],
  penStatuses: initialPens.penStatuses,
  debts: [],
  bankStatements: [],
  financialReconciliations: [],
  costCenters: [],
  costAllocations: [],
  expenses: [],
  budgetPlans: [],
  financialReports: [],
  payerAccounts: [],
  saleRecords: [],
  notifications: [],
  loteCurralLinks: [],
  costProportionalAllocations: [],
  saleDesignations: [],
  transporters: [],
  financialInstitutions: [],
  
  // Estados de Atualizações do Sistema
  systemUpdates: [],
  updateFeedbacks: [],
  lastViewedUpdateDate: undefined,
  
  // 🆕 ESTADOS DO DRC
  cashFlowEntries: [],
  financialContributions: [],
  cashFlowPeriods: [],
  cashFlowProjections: [],
  workingCapitalHistory: [],
  
  // 🆕 ESTADOS DE LANÇAMENTOS NÃO-CAIXA
  nonCashExpenses: [],
  
  // 🆕 ESTADOS DO DRE
  dreStatements: [],
  dreComparisons: [],
  
  // 🆕 ESTADOS DE RATEIO DE CUSTOS INDIRETOS
  indirectCostAllocations: [],
  allocationTemplates: [],
  indirectCostCenters: [],
  
  // Ações - Navegação
  setCurrentPage: (page) => set({ currentPage: page }),
  setDarkMode: (darkMode) => set({ darkMode }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  
  // Ações - Ciclos
  addCycle: (cycle) => set((state) => ({
    cycles: [...state.cycles, { ...cycle, id: uuidv4(), createdAt: new Date() }]
  })),
  updateCycle: (id, data) => set((state) => ({
    cycles: state.cycles.map(cycle => 
      cycle.id === id ? { ...cycle, ...data } : cycle
    )
  })),
  deleteCycle: (id) => set((state) => ({
    cycles: state.cycles.filter(cycle => cycle.id !== id)
  })),
  
  // Ações - Parceiros
  addPartner: (partner) => set((state) => ({
    partners: [...state.partners, { ...partner, id: uuidv4(), createdAt: new Date() }]
  })),
  updatePartner: (id, data) => set((state) => ({
    partners: state.partners.map(partner => 
      partner.id === id ? { ...partner, ...data } : partner
    )
  })),
  deletePartner: (id) => set((state) => ({
    partners: state.partners.map(partner => 
      partner.id === id ? { ...partner, isActive: false } : partner
    )
  })),
  
  // Ações - Ordens de Compra
  addPurchaseOrder: (order) => set((state) => {
    const orderId = uuidv4();
    const orderWithId = { 
      ...order, 
      id: orderId, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 🆕 NOVO: Calcular valor dos animais com base no RC% e preço por arroba
    const rcPercentage = order.rcPercentage || 50;
    const carcassWeight = order.totalWeight * (rcPercentage / 100);
    const arrobas = carcassWeight / 15;
    const animalValue = arrobas * order.pricePerArroba;
    
    // 🆕 NOVO: Criar lote automaticamente ao criar a ordem
    const newLot: CattleLot = {
      id: uuidv4(),
      lotNumber: order.code,
      purchaseOrderId: orderId,
      entryWeight: order.totalWeight,
      entryQuantity: order.quantity,
      freightKm: 0,
      freightCostPerKm: 0,
      entryDate: new Date(),
      estimatedGmd: 1.5,
      deaths: 0,
      status: 'active',
      observations: 'Lote pendente - Aguardando validação de pagamento',
      custoAcumulado: {
        aquisicao: animalValue,
        sanidade: 0,
        alimentacao: 0,
        operacional: 0,
        frete: 0,
        outros: 0,
        total: animalValue
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 🆕 NOVO: Criar contas a pagar ao criar a ordem
    const newAccounts: FinancialAccount[] = [];
    const newExpenses: Expense[] = [];
    
    // Conta principal - valor dos animais
    const mainAccount: FinancialAccount = {
      id: uuidv4(),
      type: 'payable',
      description: `Compra de gado - ${order.code} - ${order.quantity} animais`,
      amount: animalValue,
      dueDate: order.paymentDate || new Date(),
      status: 'pending',
      relatedEntityType: 'purchase_order',
      relatedEntityId: orderId,
      createdAt: new Date()
    };
    newAccounts.push(mainAccount);
    
    // Despesa de aquisição
    const acquisitionExpense: Expense = {
      id: uuidv4(),
      date: order.date,
      description: `Aquisição de gado - ${order.code}`,
      category: 'animal_purchase',
      totalAmount: animalValue,
      supplierId: order.vendorId,
      paymentStatus: 'pending',
      paymentDate: order.paymentDate,
      allocations: [],
      impactsCashFlow: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    newExpenses.push(acquisitionExpense);
    
    // Conta para comissão
    if (order.commission > 0) {
      const commissionAccount: FinancialAccount = {
        id: uuidv4(),
        type: 'payable',
        description: `Comissão - ${order.code}`,
        amount: order.commission,
        dueDate: order.commissionPaymentDate || order.paymentDate || new Date(),
        status: 'pending',
        relatedEntityType: 'commission',
        relatedEntityId: orderId,
        createdAt: new Date()
      };
      newAccounts.push(commissionAccount);
      
      // Despesa de comissão
      const commissionExpense: Expense = {
        id: uuidv4(),
        date: order.date,
        description: `Comissão - ${order.code}`,
        category: 'commission',
        totalAmount: order.commission,
        supplierId: order.brokerId,
        paymentStatus: 'pending',
        paymentDate: order.commissionPaymentDate,
        allocations: [],
        impactsCashFlow: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      newExpenses.push(commissionExpense);
    }
    
    // Conta para outros custos
    if (order.otherCosts > 0) {
      const otherCostsAccount: FinancialAccount = {
        id: uuidv4(),
        type: 'payable',
        description: `${order.otherCostsDescription || 'Outros custos'} - ${order.code}`,
        amount: order.otherCosts,
        dueDate: order.otherCostsPaymentDate || order.paymentDate || new Date(),
        status: 'pending',
        relatedEntityType: 'other_costs',
        relatedEntityId: orderId,
        createdAt: new Date()
      };
      newAccounts.push(otherCostsAccount);
      
      // Despesa de outros custos
      const otherCostsExpense: Expense = {
        id: uuidv4(),
        date: order.date,
        description: `${order.otherCostsDescription || 'Outros custos'} - ${order.code}`,
        category: 'acquisition_other',
        totalAmount: order.otherCosts,
        paymentStatus: 'pending',
        paymentDate: order.otherCostsPaymentDate,
        allocations: [],
        impactsCashFlow: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      newExpenses.push(otherCostsExpense);
    }
    
    // Notificação
    const notification: Notification = {
      id: uuidv4(),
      title: 'Nova Ordem de Compra',
      message: `Ordem ${order.code} criada com sucesso. Lote e contas a pagar foram gerados automaticamente.`,
      type: 'success',
      isRead: false,
      relatedEntityType: 'purchase_order',
      relatedEntityId: orderId,
      createdAt: new Date()
    };
    
    return {
      purchaseOrders: [...state.purchaseOrders, orderWithId],
      cattleLots: [...state.cattleLots, newLot],
      financialAccounts: [...state.financialAccounts, ...newAccounts],
      expenses: [...state.expenses, ...newExpenses],
      notifications: [...state.notifications, notification]
    };
  }),
  updatePurchaseOrder: (id, data) => set((state) => ({
    purchaseOrders: state.purchaseOrders.map(order => 
      order.id === id ? { ...order, ...data, updatedAt: new Date() } : order
    )
  })),
  deletePurchaseOrder: (id) => set((state) => ({
    purchaseOrders: state.purchaseOrders.filter(order => order.id !== id)
  })),
  movePurchaseOrderToNextStage: (id) => set((state) => {
    const order = state.purchaseOrders.find(o => o.id === id);
    if (!order) return state;
    
    let nextStatus: PurchaseOrder['status'] = 'order';
    let updatedState = { ...state };
    
    switch (order.status) {
      case 'order':
        nextStatus = 'payment_validation';
        break;
        
      case 'payment_validation':
        nextStatus = 'reception';
        
        // 🆕 INTEGRAÇÃO FINANCEIRA: Marcar contas como pagas se validado
        if (order.paymentValidated) {
          updatedState.financialAccounts = updatedState.financialAccounts.map(account => 
            account.relatedEntityId === order.id && account.status === 'pending'
              ? { ...account, status: 'paid', paymentDate: new Date() }
              : account
          );
          
          // Atualizar status das despesas
          updatedState.expenses = updatedState.expenses.map(expense => 
            expense.description?.includes(order.code) && expense.paymentStatus === 'pending'
              ? { ...expense, paymentStatus: 'paid', paymentDate: new Date() }
              : expense
          );
        }
        
        break;
        
      case 'reception':
        nextStatus = 'confined';
        
        // 🆕 NOVO: Criar conta de frete ao recepcionar (quando temos o KM real)
        const freightCost = (order.freightKm || 0) * (order.freightCostPerKm || 0);
        if (freightCost > 0) {
          const freightAccount: FinancialAccount = {
            id: uuidv4(),
            type: 'payable',
            description: `Frete - ${order.code} - ${order.freightKm || 0} km`,
            amount: freightCost,
            dueDate: order.paymentDate || new Date(),
            status: 'pending',
            relatedEntityType: 'freight',
            relatedEntityId: order.id,
            createdAt: new Date()
          };
          updatedState.financialAccounts = [...updatedState.financialAccounts, freightAccount];
          
          // Criar despesa de frete
          const freightExpense: Expense = {
            id: uuidv4(),
            date: new Date(),
            description: `Frete - ${order.code} - ${order.freightKm || 0} km`,
            category: 'freight',
            totalAmount: freightCost,
            supplierId: order.transportCompanyId,
            paymentStatus: 'pending',
            paymentDate: order.paymentDate,
            allocations: [],
            impactsCashFlow: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          updatedState.expenses = [...updatedState.expenses, freightExpense];
          
          // Atualizar custo do lote com o frete
          const lot = updatedState.cattleLots.find(l => l.purchaseOrderId === order.id);
          if (lot) {
            updatedState.cattleLots = updatedState.cattleLots.map(l => 
              l.id === lot.id 
                ? {
                    ...l,
                    freightKm: order.freightKm || 0,
                    freightCostPerKm: order.freightCostPerKm || 0,
                    custoAcumulado: {
                      ...l.custoAcumulado,
                      frete: freightCost,
                      total: l.custoAcumulado.total + freightCost
                    },
                    updatedAt: new Date()
                  }
                : l
            );
          }
          
          // Notificação sobre frete
          const freightNotification: Notification = {
            id: uuidv4(),
            title: 'Frete Adicionado',
            message: `Frete de R$ ${freightCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} adicionado à ordem ${order.code}`,
            type: 'info',
            isRead: false,
            relatedEntityType: 'purchase_order',
            relatedEntityId: order.id,
            createdAt: new Date()
          };
          updatedState.notifications = [...updatedState.notifications, freightNotification];
        }
        
        break;
        
      default:
        return state;
    }
    
    updatedState.purchaseOrders = updatedState.purchaseOrders.map(o => 
      o.id === id ? { ...o, status: nextStatus, updatedAt: new Date() } : o
    );
    
    return updatedState;
  }),
  movePurchaseOrderToPreviousStage: (id) => set((state) => {
    const order = state.purchaseOrders.find(o => o.id === id);
    if (!order) return state;
    
    let prevStatus: PurchaseOrder['status'] = 'order';
    
    switch (order.status) {
      case 'payment_validation':
        prevStatus = 'order';
        break;
      case 'reception':
        prevStatus = 'payment_validation';
        break;
      case 'confined':
        prevStatus = 'reception';
        break;
      default:
        return state;
    }
    
    return {
      purchaseOrders: state.purchaseOrders.map(o => 
        o.id === id ? { ...o, status: prevStatus, updatedAt: new Date() } : o
      )
    };
  }),
  generatePurchaseOrderCode: () => {
    const { purchaseOrders } = get();
    const orderCount = purchaseOrders.length + 1;
    return `X${orderCount.toString().padStart(4, '0')}`;
  },
  
  // Ações - Lotes
  addCattleLot: (lot) => set((state) => {
    const newLot = { 
      ...lot, 
      id: uuidv4(), 
      createdAt: new Date(),
      updatedAt: new Date(),
      custoAcumulado: {
        aquisicao: 0,
        sanidade: 0,
        alimentacao: 0,
        operacional: 0,
        frete: 0,
        outros: 0,
        total: 0
      }
    };
    
    return {
      cattleLots: [...state.cattleLots, newLot]
    };
  }),
  updateCattleLot: (id, data) => set((state) => {
    // Encontrar o lote atual
    const currentLot = state.cattleLots.find(lot => lot.id === id);
    if (!currentLot) return state;
    
    // Criar o lote atualizado
    const updatedLot = { ...currentLot, ...data, updatedAt: new Date() };
    
    // Atualizar a lista de lotes
    const updatedLots = state.cattleLots.map(lot => 
      lot.id === id ? updatedLot : lot
    );
    
    return {
      cattleLots: updatedLots
    };
  }),
  deleteCattleLot: (id) => set((state) => {
    // Encontrar o lote a ser excluído
    const lotToDelete = state.cattleLots.find(lot => lot.id === id);
    if (!lotToDelete) return state;
    
    // Remover alocações do lote
    const updatedPenAllocations = state.penAllocations.filter(alloc => alloc.lotId !== id);
    
    return {
      cattleLots: state.cattleLots.filter(lot => lot.id !== id),
      penAllocations: updatedPenAllocations
    };
  }),
  generateLotNumber: () => {
    const { purchaseOrders } = get();
    const orderCount = purchaseOrders.length + 1;
    return `X${orderCount.toString().padStart(4, '0')}`;
  },
  
  // Ações - Pesagens
  addWeightReading: (reading) => set((state) => ({
    weightReadings: [...state.weightReadings, { ...reading, id: uuidv4(), createdAt: new Date() }]
  })),
  updateWeightReading: (id, data) => set((state) => ({
    weightReadings: state.weightReadings.map(reading => 
      reading.id === id ? { ...reading, ...data } : reading
    )
  })),
  deleteWeightReading: (id) => set((state) => ({
    weightReadings: state.weightReadings.filter(reading => reading.id !== id)
  })),
  
  // Ações - Protocolos Sanitários
  addHealthRecord: (record) => set((state) => {
    const newRecord = { ...record, id: uuidv4(), createdAt: new Date() };
    
    // 🆕 INTEGRAÇÃO FINANCEIRA: Criar conta a pagar para o protocolo sanitário
    const financialAccount: FinancialAccount = {
      id: uuidv4(),
      type: 'payable',
      description: `Protocolo Sanitário - ${record.protocol} - Lote ${state.cattleLots.find(l => l.id === record.lotId)?.lotNumber || record.lotId}`,
      amount: record.cost,
      dueDate: new Date(), // Pagamento imediato para protocolos
      status: 'pending',
      relatedEntityType: 'health_record',
      relatedEntityId: newRecord.id,
      createdAt: new Date()
    };
    
    // 🆕 INTEGRAÇÃO CENTRO DE CUSTOS: Criar despesa de sanidade
    const healthExpense: Expense = {
      id: uuidv4(),
      date: record.date,
      description: `Protocolo Sanitário - ${record.protocol}`,
      category: 'health_costs',
      totalAmount: record.cost,
      supplierId: record.supplier,
      paymentStatus: 'pending',
      allocations: [],
      impactsCashFlow: true, // Sanidade impacta o caixa
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 🆕 INTEGRAÇÃO MODELO OPERACIONAL: Alocar custo proporcionalmente aos lotes no curral
    const curralId = record.penNumber;
    const linksNoCurral = state.loteCurralLinks.filter(
      link => link.curralId === curralId && link.status === 'active'
    );
    
    const totalAnimaisNoCurral = linksNoCurral.reduce((sum, link) => sum + link.quantidade, 0);
    
    const costAllocations: CostProportionalAllocation[] = [];
    if (totalAnimaisNoCurral > 0) {
      // Criar alocações proporcionais para cada lote no curral
      linksNoCurral.forEach(link => {
        const allocation: CostProportionalAllocation = {
          id: uuidv4(),
          custoOrigemId: newRecord.id,
          custoOrigemTipo: 'health',
          curralId,
          loteId: link.loteId,
          valorOriginal: record.cost,
          valorAlocado: (link.quantidade / totalAnimaisNoCurral) * record.cost,
          percentualAlocado: (link.quantidade / totalAnimaisNoCurral) * 100,
          dataAlocacao: new Date(),
          createdAt: new Date()
        };
        costAllocations.push(allocation);
      });
    }
    
    // Atualizar custos acumulados nos lotes
    const updatedLots = state.cattleLots.map(lot => {
      const alocacoesDoLote = costAllocations.filter(alloc => alloc.loteId === lot.id);
      if (alocacoesDoLote.length === 0) return lot;
      
      const valorAlocadoTotal = alocacoesDoLote.reduce((sum, alloc) => sum + alloc.valorAlocado, 0);
      
      const custoAcumulado = { ...lot.custoAcumulado };
      custoAcumulado.sanidade += valorAlocadoTotal;
      custoAcumulado.total = 
        custoAcumulado.aquisicao +
        custoAcumulado.sanidade +
        custoAcumulado.alimentacao +
        custoAcumulado.operacional +
        custoAcumulado.frete +
        custoAcumulado.outros;
      
      return {
        ...lot,
        custoAcumulado,
        updatedAt: new Date()
      };
    });
    
    // Adicionar notificação
    const notification: Notification = {
      id: uuidv4(),
      title: 'Protocolo Sanitário Aplicado',
      message: `Protocolo ${record.protocol} aplicado no curral ${curralId}. Custo: R$ ${record.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      type: 'info',
      isRead: false,
      relatedEntityType: 'health_record',
      relatedEntityId: newRecord.id,
      createdAt: new Date()
    };
    
    return {
      healthRecords: [...state.healthRecords, newRecord],
      financialAccounts: [...state.financialAccounts, financialAccount],
      expenses: [...state.expenses, healthExpense],
      costProportionalAllocations: [...state.costProportionalAllocations, ...costAllocations],
      cattleLots: updatedLots,
      notifications: [...state.notifications, notification]
    };
  }),
  updateHealthRecord: (id, data) => set((state) => ({
    healthRecords: state.healthRecords.map(record => 
      record.id === id ? { ...record, ...data } : record
    )
  })),
  deleteHealthRecord: (id) => set((state) => ({
    healthRecords: state.healthRecords.filter(record => record.id !== id)
  })),
  
  // Ações - Custos de Alimentação
  addFeedCost: (cost) => set((state) => {
    const newCost = { ...cost, id: uuidv4(), createdAt: new Date() };
    
    // 🆕 INTEGRAÇÃO FINANCEIRA: Criar conta a pagar para alimentação
    const financialAccount: FinancialAccount = {
      id: uuidv4(),
      type: 'payable',
      description: `Alimentação - ${cost.feedType} - Lote ${state.cattleLots.find(l => l.id === cost.lotId)?.lotNumber || cost.lotId}`,
      amount: cost.totalCost,
      dueDate: new Date(), // Pagamento imediato para alimentação
      status: 'pending',
      relatedEntityType: 'feed_cost',
      relatedEntityId: newCost.id,
      createdAt: new Date()
    };
    
    // 🆕 INTEGRAÇÃO CENTRO DE CUSTOS: Criar despesa de alimentação
    const feedExpense: Expense = {
      id: uuidv4(),
      date: cost.date,
      description: `Alimentação - ${cost.feedType} - ${cost.quantity}kg`,
      category: 'feed',
      totalAmount: cost.totalCost,
      supplierId: cost.supplier,
      paymentStatus: 'pending',
      allocations: [],
      impactsCashFlow: true, // Alimentação impacta o caixa
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 🆕 INTEGRAÇÃO MODELO OPERACIONAL: Alocar custo proporcionalmente aos lotes no curral
    const curralId = cost.penNumber;
    const linksNoCurral = state.loteCurralLinks.filter(
      link => link.curralId === curralId && link.status === 'active'
    );
    
    const totalAnimaisNoCurral = linksNoCurral.reduce((sum, link) => sum + link.quantidade, 0);
    
    const costAllocations: CostProportionalAllocation[] = [];
    if (totalAnimaisNoCurral > 0) {
      // Criar alocações proporcionais para cada lote no curral
      linksNoCurral.forEach(link => {
        const allocation: CostProportionalAllocation = {
          id: uuidv4(),
          custoOrigemId: newCost.id,
          custoOrigemTipo: 'feed',
          curralId,
          loteId: link.loteId,
          valorOriginal: cost.totalCost,
          valorAlocado: (link.quantidade / totalAnimaisNoCurral) * cost.totalCost,
          percentualAlocado: (link.quantidade / totalAnimaisNoCurral) * 100,
          dataAlocacao: new Date(),
          createdAt: new Date()
        };
        costAllocations.push(allocation);
      });
    }
    
    // Atualizar custos acumulados nos lotes
    const updatedLots = state.cattleLots.map(lot => {
      const alocacoesDoLote = costAllocations.filter(alloc => alloc.loteId === lot.id);
      if (alocacoesDoLote.length === 0) return lot;
      
      const valorAlocadoTotal = alocacoesDoLote.reduce((sum, alloc) => sum + alloc.valorAlocado, 0);
      
      const custoAcumulado = { ...lot.custoAcumulado };
      custoAcumulado.alimentacao += valorAlocadoTotal;
      custoAcumulado.total = 
        custoAcumulado.aquisicao +
        custoAcumulado.sanidade +
        custoAcumulado.alimentacao +
        custoAcumulado.operacional +
        custoAcumulado.frete +
        custoAcumulado.outros;
      
      return {
        ...lot,
        custoAcumulado,
        updatedAt: new Date()
      };
    });
    
          return {
       feedCosts: [...state.feedCosts, newCost],
       financialAccounts: [...state.financialAccounts, financialAccount],
       expenses: [...state.expenses, feedExpense],
       costProportionalAllocations: [...state.costProportionalAllocations, ...costAllocations],
       cattleLots: updatedLots
     };
   }),
  updateFeedCost: (id, data) => set((state) => ({
    feedCosts: state.feedCosts.map(cost => 
      cost.id === id ? { ...cost, ...data } : cost
    )
  })),
  deleteFeedCost: (id) => set((state) => ({
    feedCosts: state.feedCosts.filter(cost => cost.id !== id)
  })),
  
  // Ações - Movimentações de Lote
  addLotMovement: (movement) => set((state) => {
    const newMovement = { ...movement, id: uuidv4(), createdAt: new Date() };
    
    // Atualizar status dos currais
    const updatedPenStatuses = [...state.penStatuses];
    
    // Reduzir quantidade no curral de origem
    if (movement.fromPen) {
      const fromPenIndex = updatedPenStatuses.findIndex(p => p.penNumber === movement.fromPen);
      if (fromPenIndex >= 0) {
        updatedPenStatuses[fromPenIndex] = {
          ...updatedPenStatuses[fromPenIndex],
          currentAnimals: Math.max(0, updatedPenStatuses[fromPenIndex].currentAnimals - movement.quantity),
          status: updatedPenStatuses[fromPenIndex].currentAnimals - movement.quantity > 0 ? 'occupied' : 'available'
        };
      }
    }
    
    // Aumentar quantidade no curral de destino
    const toPenIndex = updatedPenStatuses.findIndex(p => p.penNumber === movement.toPen);
    if (toPenIndex >= 0) {
      updatedPenStatuses[toPenIndex] = {
        ...updatedPenStatuses[toPenIndex],
        currentAnimals: updatedPenStatuses[toPenIndex].currentAnimals + movement.quantity,
        status: 'occupied'
      };
    }
    
    // Atualizar o curral do lote
    const updatedLots = state.cattleLots.map(lot => 
      lot.id === movement.lotId ? { ...lot, penNumber: movement.toPen } : lot
    );
    
    return {
      lotMovements: [...state.lotMovements, newMovement],
      penStatuses: updatedPenStatuses,
      cattleLots: updatedLots
    };
  }),
  updateLotMovement: (id, data) => set((state) => ({
    lotMovements: state.lotMovements.map(movement => 
      movement.id === id ? { ...movement, ...data } : movement
    )
  })),
  deleteLotMovement: (id) => set((state) => ({
    lotMovements: state.lotMovements.filter(movement => movement.id !== id)
  })),
  
  // Ações - Contas Financeiras
  addFinancialAccount: (account) => set((state) => ({
    financialAccounts: [...state.financialAccounts, { ...account, id: uuidv4(), createdAt: new Date() }]
  })),
  updateFinancialAccount: (id, data) => set((state) => ({
    financialAccounts: state.financialAccounts.map(account => 
      account.id === id ? { ...account, ...data } : account
    )
  })),
  deleteFinancialAccount: (id) => set((state) => ({
    financialAccounts: state.financialAccounts.filter(account => account.id !== id)
  })),
  
  // Ações - KPIs
  updateKPIs: () => set((state) => {
    const totalAnimals = state.cattleLots.reduce((sum, lot) => sum + lot.entryQuantity, 0);
    const totalDeaths = state.cattleLots.reduce((sum, lot) => sum + lot.deaths, 0);
    const mortalityRate = totalAnimals > 0 ? (totalDeaths / totalAnimals) * 100 : 0;
    
    // Calcular média de dias em confinamento
    const activeLots = state.cattleLots.filter(lot => lot.status === 'active');
    let avgDaysInConfinement = 0;
    
    if (activeLots.length > 0) {
      const totalDays = activeLots.reduce((sum, lot) => {
        const daysInConfinement = Math.floor((new Date().getTime() - lot.entryDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + daysInConfinement;
      }, 0);
      avgDaysInConfinement = totalDays / activeLots.length;
    }
    
    // Calcular média de quebra de peso
    let avgWeightLoss = 0;
    
    if (activeLots.length > 0) {
      const totalWeightLoss = activeLots.reduce((sum, lot) => {
        const order = state.purchaseOrders.find(o => o.id === lot.purchaseOrderId);
        if (!order) return sum;
        
        const weightLoss = ((order.totalWeight - lot.entryWeight) / order.totalWeight) * 100;
        return sum + weightLoss;
      }, 0);
      avgWeightLoss = totalWeightLoss / activeLots.length;
    }
    
    return {
      kpis: [
        {
          label: 'Animais Confinados',
          value: totalAnimals.toString(),
          icon: 'Beef'
        },
        {
          label: 'Média Dia/Confinado',
          value: avgDaysInConfinement.toFixed(0),
          icon: 'Clock'
        },
        {
          label: 'Média Quebra de Peso',
          value: `${avgWeightLoss.toFixed(1)}%`,
          icon: 'TrendingDown'
        },
        {
          label: 'Mortalidade Acumulada',
          value: `${mortalityRate.toFixed(1)}%`,
          icon: 'AlertTriangle'
        }
      ]
    };
  }),
  
  // Ações - Currais
  addPenRegistration: (pen) => set((state) => {
    const newPen = { ...pen, id: uuidv4(), createdAt: new Date() };
    
    // Adicionar ao status dos currais
    const updatedPenStatuses = [...state.penStatuses];
    const existingPenIndex = updatedPenStatuses.findIndex(p => p.penNumber === newPen.penNumber);
    
    if (existingPenIndex >= 0) {
      // Atualizar curral existente
      updatedPenStatuses[existingPenIndex] = {
        ...updatedPenStatuses[existingPenIndex],
        capacity: newPen.capacity
      };
    } else {
      // Adicionar novo curral
      updatedPenStatuses.push({
        penNumber: newPen.penNumber,
        capacity: newPen.capacity,
        currentAnimals: 0,
        status: 'available'
      });
    }
    
    return {
      penRegistrations: [...state.penRegistrations, newPen],
      penStatuses: updatedPenStatuses
    };
  }),
  updatePenRegistration: (id, data) => set((state) => {
    const penToUpdate = state.penRegistrations.find(pen => pen.id === id);
    if (!penToUpdate) return state;
    
    // Atualizar o registro do curral
    const updatedPens = state.penRegistrations.map(pen => 
      pen.id === id ? { ...pen, ...data } : pen
    );
    
    // Atualizar status dos currais se necessário
    let updatedPenStatuses = [...state.penStatuses];
    
    if (data.capacity !== undefined) {
      updatedPenStatuses = updatedPenStatuses.map(status => 
        status.penNumber === penToUpdate.penNumber 
          ? { ...status, capacity: data.capacity as number } 
          : status
      );
    }
    
    return {
      penRegistrations: updatedPens,
      penStatuses: updatedPenStatuses
    };
  }),
  deletePenRegistration: (id) => set((state) => {
    const pen = state.penRegistrations.find(p => p.id === id);
    if (!pen) return state;
    
    // Marcar como inativo em vez de excluir
    const updatedPens = state.penRegistrations.map(p => 
      p.id === id ? { ...p, isActive: false } : p
    );
    
    // Atualizar status dos currais
    const updatedPenStatuses = state.penStatuses.filter(status => 
      status.penNumber !== pen.penNumber
    );
    
    return {
      penRegistrations: updatedPens,
      penStatuses: updatedPenStatuses
    };
  }),
  
  // Ações - Alocações de Curral (LEGACY - mantido para compatibilidade)
  addPenAllocation: (allocation) => set((state) => ({
    penAllocations: [...state.penAllocations, { ...allocation, id: uuidv4(), createdAt: new Date() }],
    penStatuses: state.penStatuses.map(pen => 
      pen.penNumber === allocation.penNumber 
        ? { 
            ...pen, 
            currentAnimals: pen.currentAnimals + allocation.quantity,
            status: 'occupied' as PenStatus['status']
          }
        : pen
    )
  })),
  updatePenAllocation: (id, data) => set((state) => {
    const currentAllocation = state.penAllocations.find(a => a.id === id);
    if (!currentAllocation) return state;
    
    const updatedAllocations = state.penAllocations.map(alloc => 
      alloc.id === id ? { ...alloc, ...data } : alloc
    );
    
    // Recalcular animais nos currais se a quantidade mudou
    if (data.quantity) {
      const difference = (data.quantity || 0) - currentAllocation.quantity;
      const updatedPenStatuses = state.penStatuses.map(pen => 
        pen.penNumber === currentAllocation.penNumber
          ? { 
              ...pen, 
              currentAnimals: Math.max(0, pen.currentAnimals + difference),
              status: (pen.currentAnimals + difference > 0 ? 'occupied' : 'available') as PenStatus['status']
            }
          : pen
      );
      
      return {
        penAllocations: updatedAllocations,
        penStatuses: updatedPenStatuses
      };
    }
    
    return {
      penAllocations: updatedAllocations
    };
  }),
  deletePenAllocation: (id) => set((state) => {
    const allocation = state.penAllocations.find(a => a.id === id);
    if (!allocation) return state;
    
    return {
      penAllocations: state.penAllocations.filter(a => a.id !== id),
      penStatuses: state.penStatuses.map(pen => 
        pen.penNumber === allocation.penNumber
          ? { 
              ...pen, 
              currentAnimals: Math.max(0, pen.currentAnimals - allocation.quantity),
              status: (pen.currentAnimals - allocation.quantity > 0 ? 'occupied' : 'available') as PenStatus['status']
            }
          : pen
      )
    };
  }),
  
  // Ações - Modelo Operacional Lote-Curral
  addLoteCurralLink: (link) => set((state) => {
    const newLink = { 
      ...link, 
      id: uuidv4(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    
    // Atualizar status do curral
    const updatedPenStatuses = state.penStatuses.map(pen => 
      pen.penNumber === link.curralId
        ? {
            ...pen,
            currentAnimals: pen.currentAnimals + link.quantidade,
            status: 'occupied' as PenStatus['status']
          }
        : pen
    );
    
    return {
      loteCurralLinks: [...state.loteCurralLinks, newLink],
      penStatuses: updatedPenStatuses
    };
  }),
  updateLoteCurralLink: (id, data) => set((state) => ({
    loteCurralLinks: state.loteCurralLinks.map(link => 
      link.id === id ? { ...link, ...data, updatedAt: new Date() } : link
    )
  })),
  removeLoteCurralLink: (id) => set((state) => {
    const link = state.loteCurralLinks.find(l => l.id === id);
    if (!link) return state;
    
    // Atualizar status do curral
    const updatedPenStatuses = state.penStatuses.map(pen => 
      pen.penNumber === link.curralId
        ? {
            ...pen,
            currentAnimals: Math.max(0, pen.currentAnimals - link.quantidade),
            status: (pen.currentAnimals - link.quantidade > 0 ? 'occupied' : 'available') as PenStatus['status']
          }
        : pen
    );
    
    return {
      loteCurralLinks: state.loteCurralLinks.map(l => 
        l.id === id ? { ...l, status: 'removed' as LoteCurralLink['status'], dataRemocao: new Date() } : l
      ),
      penStatuses: updatedPenStatuses
    };
  }),
  allocateLotToPens: (loteId, allocations) => set((state) => {
    const lot = state.cattleLots.find(l => l.id === loteId);
    if (!lot) return state;
    
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.quantidade, 0);
    
    // Criar links para cada alocação
    const newLinks = allocations.map(alloc => ({
      id: uuidv4(),
      loteId,
      curralId: alloc.curralId,
      quantidade: alloc.quantidade,
      percentualDoLote: (alloc.quantidade / totalAllocated) * 100,
      percentualDoCurral: 0, // Será calculado abaixo
      dataAlocacao: new Date(),
      status: 'active' as LoteCurralLink['status'],
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Atualizar status dos currais e calcular percentual do curral
    const updatedPenStatuses = [...state.penStatuses];
    newLinks.forEach(link => {
      const penIndex = updatedPenStatuses.findIndex(p => p.penNumber === link.curralId);
      if (penIndex >= 0) {
        const pen = updatedPenStatuses[penIndex];
        const newTotal = pen.currentAnimals + link.quantidade;
        link.percentualDoCurral = (link.quantidade / pen.capacity) * 100;
        
        updatedPenStatuses[penIndex] = {
          ...pen,
          currentAnimals: newTotal,
          status: 'occupied' as PenStatus['status']
        };
      }
    });
    
    // Atualizar alocações atuais do lote
    const updatedLots = state.cattleLots.map(l => 
      l.id === loteId
        ? {
            ...l,
            alocacoesAtuais: allocations.map(alloc => ({
              curralId: alloc.curralId,
              quantidade: alloc.quantidade,
              percentual: (alloc.quantidade / totalAllocated) * 100
            })),
            updatedAt: new Date()
          }
        : l
    );
    
    return {
      loteCurralLinks: [...state.loteCurralLinks, ...newLinks],
      penStatuses: updatedPenStatuses,
      cattleLots: updatedLots
    };
  }),
  
  // Ações - Alocação Proporcional de Custos
  allocateCostProportionally: (custoOrigemId, custoOrigemTipo, curralId, valorTotal) => set((state) => {
    // Obter todos os links ativos para o curral
    const linksNoCurral = state.loteCurralLinks.filter(
      link => link.curralId === curralId && link.status === 'active'
    );
    
    const totalAnimaisNoCurral = linksNoCurral.reduce((sum, link) => sum + link.quantidade, 0);
    
    if (totalAnimaisNoCurral === 0) return state;
    
    // Criar alocações proporcionais para cada lote no curral
    const newAllocations = linksNoCurral.map(link => ({
      id: uuidv4(),
      custoOrigemId,
      custoOrigemTipo,
      curralId,
      loteId: link.loteId,
      valorOriginal: valorTotal,
      valorAlocado: (link.quantidade / totalAnimaisNoCurral) * valorTotal,
      percentualAlocado: (link.quantidade / totalAnimaisNoCurral) * 100,
      dataAlocacao: new Date(),
      createdAt: new Date()
    }));
    
    // Atualizar custos acumulados nos lotes
    const updatedLots = state.cattleLots.map(lot => {
      const alocacoesDoLote = newAllocations.filter(alloc => alloc.loteId === lot.id);
      if (alocacoesDoLote.length === 0) return lot;
      
      const valorAlocadoTotal = alocacoesDoLote.reduce((sum, alloc) => sum + alloc.valorAlocado, 0);
      
      let custoAcumulado = { ...lot.custoAcumulado };
      
      switch (custoOrigemTipo) {
        case 'health':
          custoAcumulado.sanidade += valorAlocadoTotal;
          break;
        case 'feed':
          custoAcumulado.alimentacao += valorAlocadoTotal;
          break;
        case 'operational':
          custoAcumulado.operacional += valorAlocadoTotal;
          break;
        case 'other':
          custoAcumulado.outros += valorAlocadoTotal;
          break;
      }
      
      custoAcumulado.total = 
        custoAcumulado.aquisicao +
        custoAcumulado.sanidade +
        custoAcumulado.alimentacao +
        custoAcumulado.operacional +
        custoAcumulado.frete +
        custoAcumulado.outros;
      
      return {
        ...lot,
        custoAcumulado,
        updatedAt: new Date()
      };
    });
    
    return {
      costProportionalAllocations: [...state.costProportionalAllocations, ...newAllocations],
      cattleLots: updatedLots
    };
  }),
  getCostAllocationsByLot: (loteId) => {
    const { costProportionalAllocations } = get();
    return costProportionalAllocations.filter(allocation => allocation.loteId === loteId);
  },
  
  // Ações - Pipeline de Vendas
  addSaleDesignation: (designation) => set((state) => ({
    saleDesignations: [...state.saleDesignations, { ...designation, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() }]
  })),
  updateSaleDesignation: (id, data) => set((state) => ({
    saleDesignations: state.saleDesignations.map(designation => 
      designation.id === id ? { ...designation, ...data, updatedAt: new Date() } : designation
    )
  })),
  moveSaleDesignationToNextStage: (id) => set((state) => {
    const designation = state.saleDesignations.find(d => d.id === id);
    if (!designation) return state;
    
    let nextStatus: SaleDesignation['status'] = designation.status;
    
    switch (designation.status) {
      case 'next_slaughter':
        nextStatus = 'scheduled';
        break;
      case 'scheduled':
        nextStatus = 'shipped';
        break;
      case 'shipped':
        nextStatus = 'slaughtered';
        break;
      case 'slaughtered':
        nextStatus = 'reconciled';
        break;
    }
    
    return {
      saleDesignations: state.saleDesignations.map(d => 
        d.id === id ? { ...d, status: nextStatus, updatedAt: new Date() } : d
      )
    };
  }),
  
  // Consultas - Modelo Operacional
  getLotesInCurral: (curralId) => {
    const { cattleLots, loteCurralLinks } = get();
    return loteCurralLinks
      .filter(link => link.curralId === curralId && link.status === 'active')
      .map(link => {
        const lote = cattleLots.find(lot => lot.id === link.loteId);
        return {
          lote: lote!,
          link
        };
      })
      .filter(item => item.lote);
  },
  getCurraisOfLote: (loteId) => {
    const { penRegistrations, loteCurralLinks } = get();
    return loteCurralLinks
      .filter(link => link.loteId === loteId && link.status === 'active')
      .map(link => {
        const curral = penRegistrations.find(pen => pen.penNumber === link.curralId);
        return {
          curral: curral!,
          link
        };
      })
      .filter(item => item.curral);
  },
  calculateLotCostsByCategory: (loteId) => {
    const { cattleLots, purchaseOrders, costProportionalAllocations } = get();
    
    const lot = cattleLots.find(l => l.id === loteId);
    if (!lot) {
      return {
        aquisicao: 0,
        sanidade: 0,
        alimentacao: 0,
        operacional: 0,
        frete: 0,
        outros: 0,
        total: 0
      };
    }
    
    // Custo de aquisição
    const order = purchaseOrders.find(o => o.id === lot.purchaseOrderId);
    let acquisitionCost = 0;
    
    if (order) {
      const rcPercentage = order.rcPercentage || 50; // Default 50% se não informado
      const carcassWeight = order.totalWeight * (rcPercentage / 100);
      const arrobas = carcassWeight / 15;
      const animalValue = arrobas * order.pricePerArroba;
      acquisitionCost = animalValue + order.commission + order.otherCosts;
    }
    
    // Custos alocados proporcionalmente
    const allocations = costProportionalAllocations.filter(alloc => alloc.loteId === loteId);
    
    const healthCosts = allocations
      .filter(alloc => alloc.custoOrigemTipo === 'health')
      .reduce((sum, alloc) => sum + alloc.valorAlocado, 0);
    
    const feedingCosts = allocations
      .filter(alloc => alloc.custoOrigemTipo === 'feed')
      .reduce((sum, alloc) => sum + alloc.valorAlocado, 0);
    
    const operationalCosts = allocations
      .filter(alloc => alloc.custoOrigemTipo === 'operational')
      .reduce((sum, alloc) => sum + alloc.valorAlocado, 0);
    
    const otherCosts = allocations
      .filter(alloc => alloc.custoOrigemTipo === 'other')
      .reduce((sum, alloc) => sum + alloc.valorAlocado, 0);
    
    // Custos de frete
    const freightCost = lot.freightKm * lot.freightCostPerKm;
    
    const total = acquisitionCost + healthCosts + feedingCosts + freightCost + otherCosts;
    
    return {
      aquisicao: acquisitionCost,
      sanidade: healthCosts,
      alimentacao: feedingCosts,
      operacional: operationalCosts,
      frete: freightCost,
      outros: otherCosts,
      total
    };
  },
  
  // Ações - Dívidas
  addDebt: (debt) => set((state) => ({
    debts: [...state.debts, { 
      ...debt, 
      id: uuidv4(), 
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  })),
  updateDebt: (id, data) => set((state) => ({
    debts: state.debts.map(debt => 
      debt.id === id ? { ...debt, ...data, updatedAt: new Date() } : debt
    )
  })),
  deleteDebt: (id) => set((state) => ({
    debts: state.debts.filter(debt => debt.id !== id)
  })),
  
  // Ações - Extratos Bancários
  addBankStatement: (statement) => set((state) => ({
    bankStatements: [...state.bankStatements, { ...statement, id: uuidv4(), createdAt: new Date() }]
  })),
  updateBankStatement: (id, data) => set((state) => ({
    bankStatements: state.bankStatements.map(statement => 
      statement.id === id ? { ...statement, ...data } : statement
    )
  })),
  deleteBankStatement: (id) => set((state) => ({
    bankStatements: state.bankStatements.filter(statement => statement.id !== id)
  })),
  
  // Ações - Conciliações Financeiras
  addFinancialReconciliation: (reconciliation) => set((state) => ({
    financialReconciliations: [...state.financialReconciliations, { ...reconciliation, id: uuidv4(), createdAt: new Date() }]
  })),
  updateFinancialReconciliation: (id, data) => set((state) => ({
    financialReconciliations: state.financialReconciliations.map(reconciliation => 
      reconciliation.id === id ? { ...reconciliation, ...data } : reconciliation
    )
  })),
  deleteFinancialReconciliation: (id) => set((state) => ({
    financialReconciliations: state.financialReconciliations.filter(reconciliation => reconciliation.id !== id)
  })),
  
  // Ações - Centros de Custo
  addCostCenter: (center) => set((state) => ({
    costCenters: [...state.costCenters, { ...center, id: uuidv4(), createdAt: new Date() }]
  })),
  updateCostCenter: (id, data) => set((state) => ({
    costCenters: state.costCenters.map(center => 
      center.id === id ? { ...center, ...data } : center
    )
  })),
  deleteCostCenter: (id) => set((state) => ({
    costCenters: state.costCenters.map(center => 
      center.id === id ? { ...center, isActive: false } : center
    )
  })),
  
  // Ações - Alocações de Custo
  addCostAllocation: (allocation) => set((state) => ({
    costAllocations: [...state.costAllocations, { ...allocation, id: uuidv4(), createdAt: new Date() }]
  })),
  updateCostAllocation: (id, data) => set((state) => ({
    costAllocations: state.costAllocations.map(allocation => 
      allocation.id === id ? { ...allocation, ...data } : allocation
    )
  })),
  deleteCostAllocation: (id) => set((state) => ({
    costAllocations: state.costAllocations.filter(allocation => allocation.id !== id)
  })),
  
  // Ações - Despesas
  addExpense: (expense) => set((state) => ({
    expenses: [...state.expenses, { 
      ...expense, 
      id: uuidv4(), 
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  })),
  updateExpense: (id, data) => set((state) => ({
    expenses: state.expenses.map(expense => 
      expense.id === id ? { ...expense, ...data, updatedAt: new Date() } : expense
    )
  })),
  deleteExpense: (id) => set((state) => ({
    expenses: state.expenses.filter(expense => expense.id !== id)
  })),
  
  // Ações - Planos de Orçamento
  addBudgetPlan: (plan) => set((state) => ({
    budgetPlans: [...state.budgetPlans, { 
      ...plan, 
      id: uuidv4(), 
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  })),
  updateBudgetPlan: (id, data) => set((state) => ({
    budgetPlans: state.budgetPlans.map(plan => 
      plan.id === id ? { ...plan, ...data, updatedAt: new Date() } : plan
    )
  })),
  deleteBudgetPlan: (id) => set((state) => ({
    budgetPlans: state.budgetPlans.filter(plan => plan.id !== id)
  })),
  
  // Ações - Relatórios Financeiros
  addFinancialReport: (report) => set((state) => ({
    financialReports: [...state.financialReports, { ...report, id: uuidv4() }]
  })),
  updateFinancialReport: (id, data) => set((state) => ({
    financialReports: state.financialReports.map(report => 
      report.id === id ? { ...report, ...data } : report
    )
  })),
  deleteFinancialReport: (id) => set((state) => ({
    financialReports: state.financialReports.filter(report => report.id !== id)
  })),
  
  // Ações - Contas Pagadoras
  addPayerAccount: (account) => set((state) => {
    // Se a nova conta for definida como padrão, remover o padrão das outras
    let updatedAccounts = [...state.payerAccounts];
    if (account.isDefault) {
      updatedAccounts = updatedAccounts.map(acc => ({
        ...acc,
        isDefault: false
      }));
    }
    
    return {
      payerAccounts: [...updatedAccounts, { ...account, id: uuidv4(), createdAt: new Date() }]
    };
  }),
  updatePayerAccount: (id, data) => set((state) => {
    // Se a conta for definida como padrão, remover o padrão das outras
    let updatedAccounts = [...state.payerAccounts];
    if (data.isDefault) {
      updatedAccounts = updatedAccounts.map(acc => ({
        ...acc,
        isDefault: acc.id === id
      }));
    }
    
    return {
      payerAccounts: updatedAccounts.map(account => 
        account.id === id ? { ...account, ...data } : account
      )
    };
  }),
  deletePayerAccount: (id) => set((state) => ({
    payerAccounts: state.payerAccounts.map(account => 
      account.id === id ? { ...account, isActive: false } : account
    )
  })),
  
  // Ações - Registros de Venda
  addSaleRecord: (record) => set((state) => {
    const newRecord = { ...record, id: uuidv4(), createdAt: new Date() };
    
    // Marcar o lote como vendido
    const updatedLots = state.cattleLots.map(lot => 
      lot.id === record.lotId 
        ? { ...lot, status: 'slaughtered' as CattleLot['status'], updatedAt: new Date() }
        : lot
    );
    
    return {
      saleRecords: [...state.saleRecords, newRecord],
      cattleLots: updatedLots
    };
  }),
  updateSaleRecord: (id, data) => set((state) => {
    const currentRecord = state.saleRecords.find(record => record.id === id);
    if (!currentRecord) return state;
    
    // Se o status de conciliação mudou, atualizar o lote
    if (data.reconciled !== undefined && data.reconciled !== currentRecord.reconciled) {
      const updatedLots = state.cattleLots.map(lot => 
        lot.id === currentRecord.lotId 
          ? { ...lot, status: 'sold' as CattleLot['status'], updatedAt: new Date() }
          : lot
      );
      
      return {
        saleRecords: state.saleRecords.map(record => 
          record.id === id ? { ...record, ...data } : record
        ),
        cattleLots: updatedLots
      };
    }
    
    return {
      saleRecords: state.saleRecords.map(record => 
        record.id === id ? { ...record, ...data } : record
      )
    };
  }),
  deleteSaleRecord: (id) => set((state) => {
    const record = state.saleRecords.find(r => r.id === id);
    if (!record) return state;
    
    // Restaurar o status do lote para 'active'
    const updatedLots = state.cattleLots.map(lot => 
      lot.id === record.lotId ? { ...lot, status: 'active' as CattleLot['status'] } : lot
    );
    
    return {
      saleRecords: state.saleRecords.filter(r => r.id !== id),
      cattleLots: updatedLots
    };
  }),
  
  // Ações - Notificações
  addNotification: (notification) => set((state) => ({
    notifications: [
      { 
        ...notification, 
        id: uuidv4(), 
        isRead: false, 
        createdAt: new Date() 
      },
      ...state.notifications
    ]
  })),
  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    )
  })),
  markAllNotificationsAsRead: () => set((state) => ({
    notifications: state.notifications.map(notification => ({ ...notification, isRead: true }))
  })),
  deleteNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(notification => notification.id !== id)
  })),
  clearAllNotifications: () => set({ notifications: [] }),
  getUnreadNotificationsCount: () => {
    const { notifications } = get();
    return notifications.filter(notification => !notification.isRead).length;
  },
  
  // Funções de Utilidade
  calculateLotCosts: (lotId) => {
    const { cattleLots, purchaseOrders, healthRecords, feedCosts } = get();
    
    const lot = cattleLots.find(l => l.id === lotId);
    if (!lot) return 0;
    
    // Custo de aquisição
    const order = purchaseOrders.find(o => o.id === lot.purchaseOrderId);
    let acquisitionCost = 0;
    
    if (order) {
      const rcPercentage = order.rcPercentage || 50; // Default 50% se não informado
      const carcassWeight = order.totalWeight * (rcPercentage / 100);
      const arrobas = carcassWeight / 15;
      const animalValue = arrobas * order.pricePerArroba;
      acquisitionCost = animalValue + order.commission + order.otherCosts;
    }
    
    // Custos sanitários
    const healthCosts = healthRecords
      .filter(record => record.lotId === lotId)
      .reduce((sum, record) => sum + record.cost, 0);
    
    // Custos de alimentação
    const feedingCosts = feedCosts
      .filter(cost => cost.lotId === lotId)
      .reduce((sum, cost) => sum + cost.totalCost, 0);
    
    // Custos de frete
    const freightCost = lot.freightKm * lot.freightCostPerKm;
    
    return acquisitionCost + healthCosts + feedingCosts + freightCost;
  },
  calculateLotProfit: (lotId, pricePerArroba) => {
    const { cattleLots, purchaseOrders, healthRecords, feedCosts } = get();
    
    const lot = cattleLots.find(l => l.id === lotId);
    if (!lot) {
      return {
        lotId,
        saleDate: new Date(),
        pricePerArroba,
        estimatedWeight: 0,
        grossRevenue: 0,
        totalCosts: 0,
        netProfit: 0,
        profitPerAnimal: 0,
        profitMargin: 0,
        daysInConfinement: 0,
        costBreakdown: {
          acquisition: 0,
          feed: 0,
          health: 0,
          freight: 0,
          financing: 0,
          other: 0
        }
      };
    }
    
    // Calcular dias em confinamento
    const daysInConfinement = Math.floor((new Date().getTime() - lot.entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Estimar peso atual
    const estimatedWeight = lot.entryWeight + (lot.estimatedGmd * lot.entryQuantity * daysInConfinement);
    
    // Calcular receita bruta
    const grossRevenue = (estimatedWeight / 15) * pricePerArroba;
    
    // Custo de aquisição
    const order = purchaseOrders.find(o => o.id === lot.purchaseOrderId);
    let acquisitionCost = 0;
    
    if (order) {
      const rcPercentage = order.rcPercentage || 50; // Default 50% se não informado
      const carcassWeight = order.totalWeight * (rcPercentage / 100);
      const arrobas = carcassWeight / 15;
      const animalValue = arrobas * order.pricePerArroba;
      acquisitionCost = animalValue + order.commission + order.otherCosts;
    }
    
    // Custos sanitários
    const healthCosts = healthRecords
      .filter(record => record.lotId === lotId)
      .reduce((sum, record) => sum + record.cost, 0);
    
    // Custos de alimentação
    const feedingCosts = feedCosts
      .filter(cost => cost.lotId === lotId)
      .reduce((sum, cost) => sum + cost.totalCost, 0);
    
    // Custos de frete
    const freightCost = lot.freightKm * lot.freightCostPerKm;
    
    // Outros custos (financiamento, etc.)
    const financingCost = acquisitionCost * 0.01 * (daysInConfinement / 30); // 1% ao mês
    const otherCosts = 0;
    
    // Custo total
    const totalCosts = acquisitionCost + healthCosts + feedingCosts + freightCost + financingCost + otherCosts;
    
    // Lucro líquido
    const netProfit = grossRevenue - totalCosts;
    
    // Lucro por animal
    const profitPerAnimal = lot.entryQuantity > 0 ? netProfit / lot.entryQuantity : 0;
    
    // Margem de lucro
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    
    return {
      lotId,
      saleDate: new Date(),
      pricePerArroba,
      estimatedWeight,
      grossRevenue,
      totalCosts,
      netProfit,
      profitPerAnimal,
      profitMargin,
      daysInConfinement,
      costBreakdown: {
        acquisition: acquisitionCost,
        feed: feedingCosts,
        health: healthCosts,
        freight: freightCost,
        financing: financingCost,
        other: otherCosts
      }
    };
  },
  calculateZootechnicalPerformance: (lotId) => {
    const { cattleLots, weightReadings, healthRecords } = get();
    
    const lot = cattleLots.find(l => l.id === lotId);
    if (!lot) {
      return {
        lotId,
        gmd: 0,
        feedConversion: 0,
        daysInConfinement: 0,
        mortality: 0,
        averageEntryWeight: 0,
        averageCurrentWeight: 0,
        projectedExitWeight: 0,
        efficiency: 0
      };
    }
    
    // Calcular dias em confinamento
    const daysInConfinement = Math.floor((new Date().getTime() - lot.entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcular GMD (ganho médio diário)
    const gmd = lot.estimatedGmd; // Usar o GMD estimado como fallback
    
    // Calcular peso médio de entrada
    const averageEntryWeight = lot.entryQuantity > 0 ? lot.entryWeight / lot.entryQuantity : 0;
    
    // Calcular peso médio atual
    const averageCurrentWeight = averageEntryWeight + (gmd * daysInConfinement);
    
    // Calcular peso projetado de saída (após 90 dias)
    const projectedExitWeight = averageEntryWeight + (gmd * 90);
    
    // Calcular taxa de mortalidade
    const mortality = lot.entryQuantity > 0 ? (lot.deaths / lot.entryQuantity) * 100 : 0;
    
    // Calcular conversão alimentar (kg de alimento / kg de ganho de peso)
    const feedConversion = 6.5; // Valor padrão
    
    // Calcular eficiência (ganho de peso / consumo de alimento * 100)
    const efficiency = 100 / feedConversion;
    
    return {
      lotId,
      gmd,
      feedConversion,
      daysInConfinement,
      mortality,
      averageEntryWeight,
      averageCurrentWeight,
      projectedExitWeight,
      efficiency
    };
  },
  getTotalConfinedAnimals: () => {
    const { cattleLots } = get();
    return cattleLots
      .filter(lot => lot.status === 'active')
      .reduce((sum, lot) => sum + lot.entryQuantity, 0);
  },
  getUnallocatedAnimals: () => {
    const { cattleLots, penAllocations } = get();
    
    // Total de animais em lotes ativos
    const totalAnimals = cattleLots
      .filter(lot => lot.status === 'active')
      .reduce((sum, lot) => sum + lot.entryQuantity, 0);
    
    // Total de animais alocados em currais
    const allocatedAnimals = penAllocations.reduce((sum, allocation) => sum + allocation.quantity, 0);
    
    return totalAnimals - allocatedAnimals;
  },
  getAvailablePens: () => {
    const { penStatuses } = get();
    return penStatuses.filter(pen => 
      pen.status === 'available' || pen.currentAnimals < pen.capacity
    );
  },

  // 🆕 NOVO: Função helper para calcular arrobas de carcaça
  calculateCarcassArrobas: (order) => {
    const rcPercentage = order.rcPercentage || 50; // Default 50% se não informado
    const carcassWeight = order.totalWeight * (rcPercentage / 100);
    return carcassWeight / 15;
  },
  
  // 🆕 AÇÕES DO DRC
  // Ações - DRC/Fluxo de Caixa
  addCashFlowEntry: (entry) => set((state) => {
    const newEntry: CashFlowEntry = {
      ...entry,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Se for uma entrada realizada, criar/atualizar conta financeira correspondente
    if (entry.status === 'realizado' && entry.actualAmount) {
      const financialAccount: FinancialAccount = {
        id: uuidv4(),
        type: ['aporte', 'receita', 'financiamento'].includes(entry.type) ? 'receivable' : 'payable',
        description: entry.description,
        amount: entry.actualAmount,
        dueDate: entry.date,
        status: 'paid',
        paymentDate: entry.date,
        relatedEntityType: 'other_costs',
        relatedEntityId: newEntry.id,
        createdAt: new Date()
      };
      
      return {
        cashFlowEntries: [...state.cashFlowEntries, newEntry],
        financialAccounts: [...state.financialAccounts, financialAccount]
      };
    }
    
    return {
      cashFlowEntries: [...state.cashFlowEntries, newEntry]
    };
  }),
  
  updateCashFlowEntry: (id, data) => set((state) => ({
    cashFlowEntries: state.cashFlowEntries.map(entry => 
      entry.id === id 
        ? { ...entry, ...data, updatedAt: new Date() }
        : entry
    )
  })),
  
  deleteCashFlowEntry: (id) => set((state) => ({
    cashFlowEntries: state.cashFlowEntries.filter(entry => entry.id !== id)
  })),
  
  // Ações - Contribuições Financeiras
  addFinancialContribution: (contribution) => set((state) => {
    const newContribution: FinancialContribution = {
      ...contribution,
      id: uuidv4(),
      status: contribution.status || 'projetado',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Criar entrada no fluxo de caixa
    const cashFlowEntry: CashFlowEntry = {
      id: uuidv4(),
      date: contribution.date,
      type: 'aporte',
      category: 'Contribuição',
      subcategory: contribution.type,
      description: `${contribution.contributorName} - ${contribution.type}`,
      plannedAmount: contribution.amount,
      actualAmount: contribution.status === 'realizado' ? contribution.amount : undefined,
      status: contribution.status === 'realizado' ? 'realizado' : 'projetado',
      relatedEntityType: 'loan',
      relatedEntityId: newContribution.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return {
      financialContributions: [...state.financialContributions, newContribution],
      cashFlowEntries: [...state.cashFlowEntries, cashFlowEntry]
    };
  }),
  
  updateFinancialContribution: (id, data) => set((state) => ({
    financialContributions: state.financialContributions.map(contribution => 
      contribution.id === id 
        ? { ...contribution, ...data, updatedAt: new Date() }
        : contribution
    )
  })),
  
  confirmFinancialContribution: (id) => set((state) => {
    const contribution = state.financialContributions.find(c => c.id === id);
    if (!contribution) return state;
    
    // Atualizar status da contribuição
    const updatedContributions = state.financialContributions.map(c => 
      c.id === id ? { ...c, status: 'confirmado' as const } : c
    );
    
    // Atualizar entrada do fluxo de caixa para realizado
    const updatedCashFlow = state.cashFlowEntries.map(entry => 
      entry.relatedEntityId === id && entry.relatedEntityType === 'loan'
        ? { ...entry, status: 'realizado' as const, actualAmount: entry.plannedAmount }
        : entry
    );
    
    return {
      financialContributions: updatedContributions,
      cashFlowEntries: updatedCashFlow
    };
  }),
  
  // Ações - Análises e Projeções
  generateCashFlowProjection: (horizonDays) => set((state) => {
    // Calcular projeção baseada nos dados atuais
    const projection: CashFlowProjection = {
      id: uuidv4(),
      projectionDate: new Date(),
      horizonDays,
      scenarios: [
        {
          name: 'pessimista',
          assumptions: {
            salesGrowth: -10,
            costIncrease: 15,
            paymentDelay: 15,
            defaultRate: 5
          },
          projectedBalance: 0, // Calcular baseado nos dados
          minimumBalance: 0,
          capitalNeed: 0
        },
        {
          name: 'realista',
          assumptions: {
            salesGrowth: 5,
            costIncrease: 5,
            paymentDelay: 5,
            defaultRate: 2
          },
          projectedBalance: 0,
          minimumBalance: 0,
          capitalNeed: 0
        },
        {
          name: 'otimista',
          assumptions: {
            salesGrowth: 20,
            costIncrease: 0,
            paymentDelay: 0,
            defaultRate: 0
          },
          projectedBalance: 0,
          minimumBalance: 0,
          capitalNeed: 0
        }
      ],
      createdAt: new Date()
    };
    
    return {
      cashFlowProjections: [...state.cashFlowProjections, projection]
    };
  }),
  
  calculateWorkingCapital: () => set((state) => {
    // Calcular capital de giro atual
    const cashAndEquivalents = state.bankStatements.reduce((sum, s) => 
      s.type === 'credit' ? sum + s.amount : sum - s.amount, 0
    );
    
    const accountsReceivable = state.financialAccounts
      .filter(a => a.type === 'receivable' && a.status === 'pending')
      .reduce((sum, a) => sum + a.amount, 0);
    
    const accountsPayable = state.financialAccounts
      .filter(a => a.type === 'payable' && a.status === 'pending')
      .reduce((sum, a) => sum + a.amount, 0);
    
    // Calcular valor do inventário (animais)
    const inventory = state.cattleLots
      .filter(lot => lot.status === 'active')
      .reduce((sum, lot) => sum + lot.custoAcumulado.total, 0);
    
    const workingCapital: WorkingCapital = {
      id: uuidv4(),
      date: new Date(),
      cashAndEquivalents,
      accountsReceivable,
      inventory,
      otherCurrentAssets: 0,
      accountsPayable,
      shortTermDebt: 0,
      accruedExpenses: 0,
      otherCurrentLiabilities: 0,
      workingCapital: (cashAndEquivalents + accountsReceivable + inventory) - accountsPayable,
      currentRatio: accountsPayable > 0 ? (cashAndEquivalents + accountsReceivable + inventory) / accountsPayable : 1,
      quickRatio: accountsPayable > 0 ? (cashAndEquivalents + accountsReceivable) / accountsPayable : 1,
      cashConversionCycle: 0, // Implementar cálculo específico
      createdAt: new Date()
    };
    
    return {
      workingCapitalHistory: [...state.workingCapitalHistory, workingCapital]
    };
  }),
  
  // 🆕 IMPLEMENTAÇÃO DE LANÇAMENTOS NÃO-CAIXA
  addNonCashExpense: (expense) => set((state) => {
    const newExpense: NonCashExpense = {
      ...expense,
      id: uuidv4(),
      affectsCashFlow: false, // Sempre false para non-cash
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Criar despesa correspondente com flag impactsCashFlow = false
    const correspondingExpense: Expense = {
      id: uuidv4(),
      date: expense.date,
      description: expense.description,
      category: expense.type === 'mortality' ? 'deaths' : 'financial_other',
      totalAmount: expense.monetaryValue,
      paymentStatus: 'paid', // Não há pagamento real
      allocations: [],
      impactsCashFlow: false,
      nonCashExpenseId: newExpense.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Se for mortalidade, atualizar o lote
    if (expense.type === 'mortality' && expense.quantity !== undefined) {
      const updatedLots = state.cattleLots.map(lot => 
        lot.id === expense.relatedEntityId
          ? { 
              ...lot, 
              deaths: (lot.deaths || 0) + expense.quantity!,
              updatedAt: new Date()
            }
          : lot
      );
      
      return {
        nonCashExpenses: [...state.nonCashExpenses, newExpense],
        expenses: [...state.expenses, correspondingExpense],
        cattleLots: updatedLots
      };
    }
    
    return {
      nonCashExpenses: [...state.nonCashExpenses, newExpense],
      expenses: [...state.expenses, correspondingExpense]
    };
  }),
  
  updateNonCashExpense: (id, data) => set((state) => ({
    nonCashExpenses: state.nonCashExpenses.map(expense => 
      expense.id === id 
        ? { ...expense, ...data, updatedAt: new Date() }
        : expense
    )
  })),
  
  deleteNonCashExpense: (id) => set((state) => ({
    nonCashExpenses: state.nonCashExpenses.filter(expense => expense.id !== id),
    expenses: state.expenses.filter(expense => expense.nonCashExpenseId !== id)
  })),
  
  recordMortality: (lotId, quantity, cause, notes) => {
    const state = get();
    const lot = state.cattleLots.find(l => l.id === lotId);
    if (!lot) return;
    
    const order = state.purchaseOrders.find(o => o.id === lot.purchaseOrderId);
    if (!order) return;
    
    // Calcular valor monetário da perda (baseado no custo médio por animal)
    const costPerAnimal = lot.custoAcumulado.total / lot.entryQuantity;
    const monetaryValue = costPerAnimal * quantity;
    
    const mortalityExpense: Omit<NonCashExpense, 'id' | 'createdAt' | 'updatedAt'> = {
      date: new Date(),
      type: 'mortality',
      description: `Mortalidade de ${quantity} animais - Lote ${lot.lotNumber}`,
      relatedEntityType: 'cattle_lot',
      relatedEntityId: lotId,
      quantity,
      monetaryValue,
      mortalityDetails: {
        cause,
        veterinarianReport: notes
      },
      accountingImpact: 'operational_loss',
      affectsDRE: true,
      affectsCashFlow: false,
      notes
    };
    
    get().addNonCashExpense(mortalityExpense);
  },
  
  recordWeightLoss: (lotId, expectedWeight, actualWeight, notes) => {
    const state = get();
    const lot = state.cattleLots.find(l => l.id === lotId);
    if (!lot) return;
    
    const weightLoss = expectedWeight - actualWeight;
    const lossPercentage = (weightLoss / expectedWeight) * 100;
    
    // Calcular valor monetário da perda (baseado no preço médio de compra)
    const order = state.purchaseOrders.find(o => o.id === lot.purchaseOrderId);
    if (!order) return;
    
    const pricePerKg = (order.pricePerArroba / 15) * (order.rcPercentage || 50) / 100;
    const monetaryValue = weightLoss * pricePerKg;
    
    const weightLossExpense: Omit<NonCashExpense, 'id' | 'createdAt' | 'updatedAt'> = {
      date: new Date(),
      type: 'weight_loss',
      description: `Quebra de peso - Lote ${lot.lotNumber}`,
      relatedEntityType: 'cattle_lot',
      relatedEntityId: lotId,
      weightLoss,
      monetaryValue,
      weightLossDetails: {
        expectedWeight,
        actualWeight,
        lossPercentage
      },
      accountingImpact: 'cost_of_goods_sold',
      affectsDRE: true,
      affectsCashFlow: false,
      notes
    };
    
    get().addNonCashExpense(weightLossExpense);
  },
  
  // 🆕 IMPLEMENTAÇÃO DO DRE
  generateDREStatement: (params) => {
    const state = get();
    const { entityType, entityId, periodStart, periodEnd, includeProjections, pricePerArroba } = params;
    
    let entities: { lot?: CattleLot; pen?: string }[] = [];
    
    // Determinar entidades para o DRE
    if (entityType === 'lot' && entityId) {
      const lot = state.cattleLots.find(l => l.id === entityId);
      if (!lot) return null;
      entities = [{ lot }];
    } else if (entityType === 'pen' && entityId) {
      // Buscar todos os lotes no curral
      const lotsInPen = state.loteCurralLinks
        .filter(link => link.curralId === entityId && link.status === 'active')
        .map(link => state.cattleLots.find(l => l.id === link.loteId))
        .filter(Boolean) as CattleLot[];
      entities = lotsInPen.map(lot => ({ lot, pen: entityId }));
    } else if (entityType === 'global') {
      // Todos os lotes ativos
      entities = state.cattleLots
        .filter(lot => lot.status === 'active' || lot.status === 'sold')
        .map(lot => ({ lot }));
    }
    
    if (entities.length === 0) return null;
    
    // Inicializar estrutura do DRE
    const dre: DREStatement = {
      id: uuidv4(),
      entityType,
      entityId: entityId || 'global',
      entityName: entityType === 'global' ? 'Global' : 
                  entityType === 'lot' ? state.cattleLots.find(l => l.id === entityId)?.lotNumber || entityId :
                  `Curral ${entityId}`,
      periodStart,
      periodEnd,
      revenue: { grossSales: 0, salesDeductions: 0, netSales: 0 },
      costOfGoodsSold: {
        animalPurchase: 0,
        feed: 0,
        health: 0,
        freight: 0,
        mortality: 0,
        weightLoss: 0,
        total: 0
      },
      grossProfit: 0,
      grossMargin: 0,
      operatingExpenses: {
        administrative: 0,
        sales: 0,
        financial: 0,
        depreciation: 0,
        other: 0,
        total: 0
      },
      operatingIncome: 0,
      operatingMargin: 0,
      financialResult: {
        financialRevenue: 0,
        financialExpenses: 0,
        total: 0
      },
      incomeBeforeTaxes: 0,
      taxes: {
        incomeTax: 0,
        socialContribution: 0,
        total: 0
      },
      netIncome: 0,
      netMargin: 0,
      metrics: {
        revenuePerHead: 0,
        costPerHead: 0,
        profitPerHead: 0,
        revenuePerArroba: 0,
        costPerArroba: 0,
        profitPerArroba: 0,
        daysInConfinement: 0,
        roi: 0,
        dailyProfit: 0
      },
      generatedAt: new Date()
    };
    
    let totalHeads = 0;
    let totalArrobas = 0;
    let totalDaysInConfinement = 0;
    
    // Calcular valores para cada entidade
    entities.forEach(({ lot, pen }) => {
      if (!lot) return;
      
      // Verificar se o lote está no período
      const lotStartDate = lot.entryDate;
      const lotEndDate = lot.status === 'sold' ? 
        state.saleRecords.find(s => s.lotId === lot.id)?.saleDate || new Date() : 
        new Date();
      
      // Se o lote não intersecta com o período, pular
      if (lotEndDate < periodStart || lotStartDate > periodEnd) return;
      
      // Calcular receitas (vendas realizadas ou projetadas)
      if (lot.status === 'sold') {
        const saleRecord = state.saleRecords.find(s => s.lotId === lot.id);
        if (saleRecord && saleRecord.saleDate >= periodStart && saleRecord.saleDate <= periodEnd) {
          dre.revenue.grossSales += saleRecord.grossRevenue;
          // Calcular arrobas baseado no peso total e RC%
          const rcPercentage = state.purchaseOrders.find(o => o.id === lot.purchaseOrderId)?.rcPercentage || 50;
          const carcassWeight = saleRecord.totalWeight * (rcPercentage / 100);
          const arrobas = carcassWeight / 15;
          totalArrobas += arrobas;
        }
      } else if (includeProjections && pricePerArroba) {
        // Projetar vendas
        const daysInConfinement = Math.floor((new Date().getTime() - lot.entryDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentWeight = lot.entryWeight + (lot.estimatedGmd * lot.entryQuantity * daysInConfinement);
        const rcPercentage = state.purchaseOrders.find(o => o.id === lot.purchaseOrderId)?.rcPercentage || 50;
        const carcassWeight = currentWeight * (rcPercentage / 100);
        const arrobas = carcassWeight / 15;
        
        dre.revenue.grossSales += arrobas * pricePerArroba;
        totalArrobas += arrobas;
      }
      
      // Calcular custos dos produtos vendidos
      const costs = state.calculateLotCostsByCategory(lot.id);
      dre.costOfGoodsSold.animalPurchase += costs.aquisicao;
      dre.costOfGoodsSold.feed += costs.alimentacao;
      dre.costOfGoodsSold.health += costs.sanidade;
      dre.costOfGoodsSold.freight += costs.frete;
      
      // Adicionar custos não-caixa
      const nonCashExpenses = state.nonCashExpenses.filter(exp => 
        exp.relatedEntityId === lot.id &&
        exp.date >= periodStart &&
        exp.date <= periodEnd
      );
      
      nonCashExpenses.forEach(expense => {
        if (expense.type === 'mortality') {
          dre.costOfGoodsSold.mortality += expense.monetaryValue;
        } else if (expense.type === 'weight_loss') {
          dre.costOfGoodsSold.weightLoss += expense.monetaryValue;
        }
      });
      
      // Calcular despesas operacionais (simplificado - 5% do custo total)
      const operationalCost = costs.total * 0.05;
      dre.operatingExpenses.administrative += operationalCost * 0.4;
      dre.operatingExpenses.sales += operationalCost * 0.2;
      dre.operatingExpenses.financial += operationalCost * 0.2;
      dre.operatingExpenses.other += operationalCost * 0.2;
      
      // Métricas
      totalHeads += lot.entryQuantity;
      const days = Math.floor((lotEndDate.getTime() - lotStartDate.getTime()) / (1000 * 60 * 60 * 24));
      totalDaysInConfinement += days * lot.entryQuantity;
    });
    
    // Calcular totais e margens
    dre.revenue.netSales = dre.revenue.grossSales - dre.revenue.salesDeductions;
    dre.costOfGoodsSold.total = 
      dre.costOfGoodsSold.animalPurchase +
      dre.costOfGoodsSold.feed +
      dre.costOfGoodsSold.health +
      dre.costOfGoodsSold.freight +
      dre.costOfGoodsSold.mortality +
      dre.costOfGoodsSold.weightLoss;
    
    dre.grossProfit = dre.revenue.netSales - dre.costOfGoodsSold.total;
    dre.grossMargin = dre.revenue.netSales > 0 ? (dre.grossProfit / dre.revenue.netSales) * 100 : 0;
    
    dre.operatingExpenses.total = 
      dre.operatingExpenses.administrative +
      dre.operatingExpenses.sales +
      dre.operatingExpenses.financial +
      dre.operatingExpenses.depreciation +
      dre.operatingExpenses.other;
    
    dre.operatingIncome = dre.grossProfit - dre.operatingExpenses.total;
    dre.operatingMargin = dre.revenue.netSales > 0 ? (dre.operatingIncome / dre.revenue.netSales) * 100 : 0;
    
    // Resultado financeiro (simplificado)
    dre.financialResult.financialExpenses = dre.operatingExpenses.financial;
    dre.financialResult.total = dre.financialResult.financialRevenue - dre.financialResult.financialExpenses;
    
    dre.incomeBeforeTaxes = dre.operatingIncome + dre.financialResult.total;
    
    // Impostos (simplificado - 15% IR + 9% CSLL sobre lucro)
    if (dre.incomeBeforeTaxes > 0) {
      dre.taxes.incomeTax = dre.incomeBeforeTaxes * 0.15;
      dre.taxes.socialContribution = dre.incomeBeforeTaxes * 0.09;
      dre.taxes.total = dre.taxes.incomeTax + dre.taxes.socialContribution;
    }
    
    dre.netIncome = dre.incomeBeforeTaxes - dre.taxes.total;
    dre.netMargin = dre.revenue.netSales > 0 ? (dre.netIncome / dre.revenue.netSales) * 100 : 0;
    
    // Calcular métricas
    if (totalHeads > 0) {
      dre.metrics.revenuePerHead = dre.revenue.netSales / totalHeads;
      dre.metrics.costPerHead = dre.costOfGoodsSold.total / totalHeads;
      dre.metrics.profitPerHead = dre.netIncome / totalHeads;
      dre.metrics.daysInConfinement = totalDaysInConfinement / totalHeads;
    }
    
    if (totalArrobas > 0) {
      dre.metrics.revenuePerArroba = dre.revenue.netSales / totalArrobas;
      dre.metrics.costPerArroba = dre.costOfGoodsSold.total / totalArrobas;
      dre.metrics.profitPerArroba = dre.netIncome / totalArrobas;
    }
    
    // ROI
    if (dre.costOfGoodsSold.total > 0) {
      dre.metrics.roi = (dre.netIncome / dre.costOfGoodsSold.total) * 100;
    }
    
    // Lucro diário
    const periodDays = Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    if (periodDays > 0) {
      dre.metrics.dailyProfit = dre.netIncome / periodDays;
    }
    
    return dre;
  },
  
  saveDREStatement: (dre) => set((state) => ({
    dreStatements: [...state.dreStatements, dre]
  })),
  
  deleteDREStatement: (id) => set((state) => ({
    dreStatements: state.dreStatements.filter(dre => dre.id !== id)
  })),
  
  compareDREs: (entityIds, entityType, periodStart, periodEnd) => {
    const state = get();
    const dres: DREStatement[] = [];
    const entities: Array<{ type: 'lot' | 'pen'; id: string; name: string; dre: DREStatement }> = [];
    
    // Gerar DRE para cada entidade
    entityIds.forEach(entityId => {
      const params: DREGenerationParams = {
        entityType,
        entityId,
        periodStart,
        periodEnd,
        includeProjections: true,
        pricePerArroba: 320 // Valor padrão
      };
      
      const dre = get().generateDREStatement(params);
      if (dre) {
        let name = '';
        if (entityType === 'lot') {
          const lot = state.cattleLots.find(l => l.id === entityId);
          name = lot?.lotNumber || entityId;
        } else {
          name = `Curral ${entityId}`;
        }
        
        entities.push({ type: entityType, id: entityId, name, dre });
        dres.push(dre);
      }
    });
    
    if (entities.length === 0) return null;
    
    // Calcular métricas de comparação
    const netMargins = entities.map(e => e.dre.netMargin);
    const rois = entities.map(e => e.dre.metrics.roi);
    const netIncomes = entities.map(e => e.dre.netIncome);
    
    const bestPerformerIndex = netIncomes.indexOf(Math.max(...netIncomes));
    const worstPerformerIndex = netIncomes.indexOf(Math.min(...netIncomes));
    
    const comparison: DREComparison = {
      id: uuidv4(),
      entities,
      comparisonMetrics: {
        bestPerformer: entities[bestPerformerIndex].id,
        worstPerformer: entities[worstPerformerIndex].id,
        averageNetMargin: netMargins.reduce((a, b) => a + b, 0) / netMargins.length,
        averageROI: rois.reduce((a, b) => a + b, 0) / rois.length,
        totalNetIncome: netIncomes.reduce((a, b) => a + b, 0)
      },
      insights: [],
      generatedAt: new Date()
    };
    
    // Gerar insights
    if (comparison.comparisonMetrics.averageNetMargin < 10) {
      comparison.insights.push('Margem líquida média abaixo de 10% - revisar estrutura de custos');
    }
    
    if (comparison.comparisonMetrics.averageROI < 15) {
      comparison.insights.push('ROI médio abaixo de 15% - avaliar eficiência operacional');
    }
    
    const marginVariation = Math.max(...netMargins) - Math.min(...netMargins);
    if (marginVariation > 10) {
      comparison.insights.push(`Grande variação de margem entre entidades (${marginVariation.toFixed(1)}%) - investigar diferenças operacionais`);
    }
    
    return comparison;
  },
  
  getDREByEntity: (entityType, entityId) => {
    const state = get();
    return state.dreStatements.filter(dre => 
      dre.entityType === entityType && dre.entityId === entityId
    );
  },
  
  // 🆕 IMPLEMENTAÇÃO DE RATEIO DE CUSTOS INDIRETOS
  generateIndirectCostAllocation: (params) => {
    const state = get();
    const { costType, period, totalAmount, allocationMethod, includeInactiveLots = false } = params;
    
    // Buscar entidades ativas
    const activeLots = state.cattleLots.filter(lot => 
      includeInactiveLots ? true : lot.status === 'active'
    );
    
    if (activeLots.length === 0) return null;
    
    // Calcular base total para rateio
    let totalBase = 0;
    const entityBases: Map<string, number> = new Map();
    
    activeLots.forEach(lot => {
      let base = 0;
      
      switch (allocationMethod) {
        case 'by_heads':
          base = lot.entryQuantity - (lot.deaths || 0);
          break;
          
        case 'by_value':
          base = state.calculateLotCostsByCategory(lot.id).total;
          break;
          
        case 'by_days':
          const entryDate = lot.entryDate;
          const currentDate = new Date();
          const days = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          base = days * (lot.entryQuantity - (lot.deaths || 0));
          break;
          
        case 'by_weight':
          base = lot.entryWeight;
          break;
      }
      
      entityBases.set(lot.id, base);
      totalBase += base;
    });
    
    if (totalBase === 0) return null;
    
    // Criar alocações
    const allocations = activeLots.map(lot => {
      const base = entityBases.get(lot.id) || 0;
      const percentage = (base / totalBase) * 100;
      const allocatedAmount = (totalAmount * percentage) / 100;
      
      return {
        entityType: 'lot' as const,
        entityId: lot.id,
        entityName: lot.lotNumber,
        heads: lot.entryQuantity - (lot.deaths || 0),
        value: state.calculateLotCostsByCategory(lot.id).total,
        days: Math.floor((new Date().getTime() - lot.entryDate.getTime()) / (1000 * 60 * 60 * 24)),
        weight: lot.entryWeight,
        percentage,
        allocatedAmount
      };
    });
    
    // Criar objeto de alocação
    const allocation: IndirectCostAllocation = {
      id: uuidv4(),
      name: `Rateio de Custos ${costType === 'administrative' ? 'Administrativos' : 
                              costType === 'financial' ? 'Financeiros' : 
                              costType === 'operational' ? 'Operacionais' : 
                              costType === 'marketing' ? 'de Marketing' : 'Outros'}`,
      description: `Rateio automático pelo método ${allocationMethod}`,
      period,
      totalAmount,
      costType,
      allocationMethod,
      allocationBasis: {
        totalHeads: allocationMethod === 'by_heads' ? totalBase : undefined,
        totalValue: allocationMethod === 'by_value' ? totalBase : undefined,
        totalDays: allocationMethod === 'by_days' ? totalBase : undefined,
        totalWeight: allocationMethod === 'by_weight' ? totalBase : undefined
      },
      allocations,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return allocation;
  },
  
  saveIndirectCostAllocation: (allocation) => set((state) => ({
    indirectCostAllocations: [...state.indirectCostAllocations, allocation]
  })),
  
  approveIndirectCostAllocation: (id, approvedBy) => set((state) => ({
    indirectCostAllocations: state.indirectCostAllocations.map(alloc =>
      alloc.id === id
        ? {
            ...alloc,
            status: 'approved' as const,
            approvedBy,
            approvedAt: new Date(),
            updatedAt: new Date()
          }
        : alloc
    )
  })),
  
  applyIndirectCostAllocation: (id) => set((state) => {
    const allocation = state.indirectCostAllocations.find(a => a.id === id);
    if (!allocation || allocation.status !== 'approved') return state;
    
    // Criar despesas para cada alocação
    const newExpenses: Expense[] = allocation.allocations.map(alloc => ({
      id: uuidv4(),
      date: allocation.period.endDate,
      description: `${allocation.name} - ${alloc.entityName}`,
      category: allocation.costType === 'administrative' ? 'general_admin' :
                allocation.costType === 'financial' ? 'financial_management' :
                allocation.costType === 'marketing' ? 'marketing' : 
                'admin_other',
      totalAmount: alloc.allocatedAmount,
      paymentStatus: 'paid',
      allocations: [{
        id: uuidv4(),
        targetType: 'lot',
        targetId: alloc.entityId,
        costCenterId: '',
        expenseId: '',
        amount: alloc.allocatedAmount,
        percentage: 100,
        allocationMethod: 'manual_value',
        createdAt: new Date()
      }],
      impactsCashFlow: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    return {
      ...state,
      expenses: [...state.expenses, ...newExpenses],
      indirectCostAllocations: state.indirectCostAllocations.map(alloc =>
        alloc.id === id
          ? { ...alloc, status: 'applied' as const, appliedAt: new Date(), updatedAt: new Date() }
          : alloc
      )
    };
  }),
  
  deleteIndirectCostAllocation: (id) => set((state) => ({
    indirectCostAllocations: state.indirectCostAllocations.filter(a => a.id !== id)
  })),
  
  getIndirectCostSummary: (entityType, entityId, periodStart, periodEnd) => {
    const state = get();
    
    // Filtrar alocações aplicadas no período
    const relevantAllocations = state.indirectCostAllocations.filter(alloc =>
      alloc.status === 'applied' &&
      alloc.period.startDate >= periodStart &&
      alloc.period.endDate <= periodEnd &&
      (entityType === 'global' || alloc.allocations.some(a => 
        a.entityType === entityType && a.entityId === entityId
      ))
    );
    
    if (relevantAllocations.length === 0) return null;
    
    // Calcular totais por tipo
    const costs = {
      administrative: 0,
      financial: 0,
      operational: 0,
      marketing: 0,
      other: 0,
      total: 0
    };
    
    relevantAllocations.forEach(alloc => {
      const entityAllocation = entityType === 'global'
        ? alloc.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
        : alloc.allocations.find(a => a.entityId === entityId)?.allocatedAmount || 0;
      
      costs[alloc.costType] += entityAllocation;
      costs.total += entityAllocation;
    });
    
    // Buscar informações da entidade
    let entityName = 'Global';
    let heads = 0;
    
    if (entityType === 'lot') {
      const lot = state.cattleLots.find(l => l.id === entityId);
      if (lot) {
        entityName = lot.lotNumber;
        heads = lot.entryQuantity - (lot.deaths || 0);
      }
    }
    
    const days = Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const summary: IndirectCostSummary = {
      entityType,
      entityId: entityId || 'global',
      entityName: entityType === 'global' ? 'Global' : 
                  entityType === 'lot' ? state.cattleLots.find(l => l.id === entityId)?.lotNumber || entityId :
                  `Curral ${entityId || ''}`,
      period: { startDate: periodStart, endDate: periodEnd },
      costs,
      percentageOfTotal: 100, // Será calculado se necessário
      costPerHead: heads > 0 ? costs.total / heads : undefined,
      costPerDay: days > 0 ? costs.total / days : undefined,
      allocations: relevantAllocations
    };
    
    return summary;
  },
  
  // Templates
  createAllocationTemplate: (template) => set((state) => ({
    allocationTemplates: [...state.allocationTemplates, {
      ...template,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  })),
  
  updateAllocationTemplate: (id, data) => set((state) => ({
    allocationTemplates: state.allocationTemplates.map(template =>
      template.id === id
        ? { ...template, ...data, updatedAt: new Date() }
        : template
    )
  })),
  
  deleteAllocationTemplate: (id) => set((state) => ({
    allocationTemplates: state.allocationTemplates.filter(t => t.id !== id)
  })),
  
  // Centros de Custo Indiretos
  createIndirectCostCenter: (center) => set((state) => ({
    indirectCostCenters: [...state.indirectCostCenters, {
      ...center,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  })),
  
  updateIndirectCostCenter: (id, data) => set((state) => ({
    indirectCostCenters: state.indirectCostCenters.map(center =>
      center.id === id
        ? { ...center, ...data, updatedAt: new Date() }
        : center
    )
  })),
  
  deleteIndirectCostCenter: (id) => set((state) => ({
    indirectCostCenters: state.indirectCostCenters.filter(c => c.id !== id)
  })),
  
  // 🆕 IMPLEMENTAÇÃO DA FUNÇÃO PARA LIMPAR DADOS DE TESTE
  clearAllTestData: () => set((state) => ({
    // Manter estado de navegação
    currentPage: state.currentPage,
    darkMode: state.darkMode,
    sidebarCollapsed: state.sidebarCollapsed,
    
    // Limpar todos os dados transacionais
    cycles: [],
    partners: [],
    purchaseOrders: [],
    cattleLots: [],
    weightReadings: [],
    healthRecords: [],
    feedCosts: [],
    lotMovements: [],
    financialAccounts: [],
    
    // Resetar KPIs
    kpis: [
      {
        label: 'Animais Confinados',
        value: '0',
        icon: 'Beef'
      },
      {
        label: 'Média Dia/Confinado',
        value: '0',
        icon: 'Clock'
      },
      {
        label: 'Média Quebra de Peso',
        value: '0%',
        icon: 'TrendingDown'
      },
      {
        label: 'Mortalidade Acumulada',
        value: '0%',
        icon: 'AlertTriangle'
      }
    ],
    
    // Manter estrutura de currais mas limpar alocações
    penRegistrations: state.penRegistrations,
    penAllocations: [],
    penStatuses: state.penStatuses.map(pen => ({
      ...pen,
      currentAnimals: 0,
      status: 'available' as const
    })),
    
    // Limpar dados financeiros
    debts: [],
    bankStatements: [],
    financialReconciliations: [],
    costCenters: [],
    costAllocations: [],
    expenses: [],
    budgetPlans: [],
    financialReports: [],
    
    // Limpar contas pagadoras
    payerAccounts: [],
    
    // Limpar vendas e notificações
    saleRecords: [],
    notifications: [],
    
    // Limpar modelo operacional
    loteCurralLinks: [],
    costProportionalAllocations: [],
    saleDesignations: [],
    
    // Limpar transportadoras e instituições financeiras
    transporters: [],
    financialInstitutions: [],
    
    // Manter estados de atualizações do sistema
    systemUpdates: state.systemUpdates,
    updateFeedbacks: state.updateFeedbacks,
    lastViewedUpdateDate: state.lastViewedUpdateDate,
    
    // Limpar dados do DRC
    cashFlowEntries: [],
    financialContributions: [],
    cashFlowPeriods: [],
    cashFlowProjections: [],
    workingCapitalHistory: [],
    
    // Limpar lançamentos não-caixa
    nonCashExpenses: [],
    
    // Limpar DRE
    dreStatements: [],
    dreComparisons: [],
    
    // Limpar rateio de custos indiretos
    indirectCostAllocations: [],
    allocationTemplates: [],
    indirectCostCenters: []
  })),
  
  // Ações - Transportadoras
  addTransporter: (transporter) => set((state) => ({
    transporters: [...state.transporters, { ...transporter, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() }]
  })),
  updateTransporter: (id, data) => set((state) => ({
    transporters: state.transporters.map(transporter => 
      transporter.id === id ? { ...transporter, ...data, updatedAt: new Date() } : transporter
    )
  })),
  deleteTransporter: (id) => set((state) => ({
    transporters: state.transporters.filter(transporter => transporter.id !== id)
  })),
  
  // Ações - Instituições Financeiras
  addFinancialInstitution: (institution) => set((state) => ({
    financialInstitutions: [...state.financialInstitutions, { ...institution, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() }]
  })),
  updateFinancialInstitution: (id, data) => set((state) => ({
    financialInstitutions: state.financialInstitutions.map(institution => 
      institution.id === id ? { ...institution, ...data, updatedAt: new Date() } : institution
    )
  })),
  deleteFinancialInstitution: (id) => set((state) => ({
    financialInstitutions: state.financialInstitutions.filter(institution => institution.id !== id)
  })),
  
  // Ações - Atualizações do Sistema
  setLastViewedUpdateDate: (date) => set({ lastViewedUpdateDate: date }),
  addSystemUpdate: (update) => set((state) => ({
    systemUpdates: [...state.systemUpdates, { ...update, id: uuidv4(), createdAt: new Date() }]
  })),
  updateSystemUpdate: (id, data) => set((state) => ({
    systemUpdates: state.systemUpdates.map(update => 
      update.id === id ? { ...update, ...data, updatedAt: new Date() } : update
    )
  })),
  deleteSystemUpdate: (id) => set((state) => ({
    systemUpdates: state.systemUpdates.filter(update => update.id !== id)
  })),
  addUpdateFeedback: (feedback) => set((state) => ({
    updateFeedbacks: [...state.updateFeedbacks, { ...feedback, id: uuidv4(), createdAt: new Date() }]
  })),
  getUnviewedUpdatesCount: () => {
    const { systemUpdates, lastViewedUpdateDate } = get();
    if (!lastViewedUpdateDate) return systemUpdates.length;
    return systemUpdates.filter(update => update.releaseDate > lastViewedUpdateDate).length;
  }
}));
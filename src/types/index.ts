export interface FatteningCycle {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'planned';
  description?: string;
  budget?: number;
  targetAnimals?: number;
}

export interface Partner {
  id: string;
  name: string;
  type: 'vendor' | 'broker' | 'slaughterhouse' | 'financial';
  city: string;
  state: string;
  phone?: string;
  email?: string;
  cpfCnpj?: string;
  address?: string;
  // Dados bancários separados
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: 'checking' | 'savings'; // Conta Corrente ou Poupança
  observations?: string;
  isActive: boolean;
  isTransporter?: boolean; // Novo campo para identificar transportadoras
  createdAt: Date;
}

// NOVA INTERFACE: Conta Pagadora
export interface PayerAccount {
  id: string;
  name: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  bankAccountType: 'checking' | 'savings';
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
}

// NOVA INTERFACE: Cadastro de Currais
export interface PenRegistration {
  id: string;
  penNumber: string;
  capacity: number;
  location?: string;
  description?: string;
  isActive: boolean;
  // 🆕 NOVOS CAMPOS
  tipo?: 'recepção' | 'engorda' | 'quarentena' | 'hospital';
  custoDiarioEstimado?: number; // Custo diário estimado do curral
  createdAt: Date;
  updatedAt: Date;
}

// 🆕 NOVA INTERFACE: Alocação de Animais em Currais
export interface PenAllocation {
  id: string;
  penNumber: string;
  lotId: string;
  quantity: number;
  entryWeight: number;
  entryDate: Date;
  createdAt: Date;
}

// 🆕 NOVA INTERFACE: Registro de Venda/Abate
export interface SaleRecord {
  id: string;
  lotId: string;
  slaughterhouseId: string;
  saleDate: Date;
  animalType: 'male' | 'female';
  quantity: number;
  totalWeight: number;
  pricePerArroba: number;
  grossRevenue: number;
  netProfit: number;
  profitMargin: number;
  paymentType: 'cash' | 'installment';
  paymentDate?: Date;
  // Classificação dos animais
  commonAnimals: number;
  chinaAnimals: number;
  angusAnimals: number;
  observations?: string;
  createdAt: Date;
  // Novo campo para pipeline de abate
  reconciled?: boolean;
}

export interface PurchaseOrder {
  id: string;
  code: string; // ACXENG0001, ACXENG0002, etc.
  cycleId: string;
  date: Date;
  vendorId: string;
  brokerId?: string;
  city: string;
  state: string;
  quantity: number;
  animalType: 'male' | 'female';
  estimatedAge: number; // in months
  totalWeight: number; // in kg - PESO VIVO
  // 🆕 NOVO: Rendimento de Carcaça Estimado
  rcPercentage: number; // Rendimento de Carcaça % (ex: 50, 52, 54)
  pricePerArroba: number; // Preço por arroba de CARCAÇA
  commission: number;
  // 🆕 NOVO: Condições de pagamento da comissão
  commissionPaymentType?: 'cash' | 'installment';
  commissionPaymentDate?: Date;
  taxes: number;
  // 🆕 NOVO: Condições de pagamento dos impostos
  taxesPaymentType?: 'cash' | 'installment';
  taxesPaymentDate?: Date;
  otherCosts: number;
  otherCostsDescription?: string;
  // 🆕 NOVO: Condições de pagamento dos outros custos
  otherCostsPaymentType?: 'cash' | 'installment';
  otherCostsPaymentDate?: Date;
  status: 'order' | 'payment_validation' | 'reception' | 'confined';
  paymentValidated: boolean;
  paymentProof?: string;
  // NOVOS CAMPOS PARA PAGAMENTO
  paymentType: 'cash' | 'installment'; // À vista ou a prazo
  paymentDate?: Date; // Data do pagamento (obrigatório se for a prazo)
  payerAccountId?: string; // Conta pagadora selecionada
  observations?: string;
  freightKm?: number;
  freightCostPerKm?: number;
  transportCompanyId?: string; // ID da transportadora
  createdAt: Date;
  updatedAt: Date;
}

export interface CattleLot {
  id: string;
  lotNumber: string;
  purchaseOrderId: string;
  // Dados de entrada (imutáveis após criação)
  entryWeight: number;
  entryQuantity: number;
  quantityDifference?: number;
  quantityDifferenceReason?: string;
  freightKm: number;
  freightCostPerKm: number;
  transportCompany?: string;
  entryDate: Date;
  cocoEntryDate?: Date;
  // Estimativas
  estimatedGmd: number;
  estimatedExitDate?: Date;
  estimatedExitWeight?: number;
  realGmd?: number;
  // Status e contadores
  deaths: number;
  observations?: string;
  status: 'active' | 'sold' | 'slaughtered';
  // 🆕 REMOVIDO: penNumber (agora gerenciado via LoteCurralLink)
  // 🆕 NOVO: Custos acumulados
  custoAcumulado: {
    aquisicao: number;
    sanidade: number;
    alimentacao: number;
    operacional: number;
    frete: number;
    outros: number;
    total: number;
  };
  // 🆕 NOVO: Alocações atuais
  alocacoesAtuais?: {
    curralId: string;
    quantidade: number;
    percentual: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeightReading {
  id: string;
  lotId: string;
  penNumber: string; // NOVO: Curral onde a pesagem foi realizada
  date: Date;
  sampleWeight: number; // total weight of sample
  sampleQuantity: number; // number of animals in sample
  averageWeight: number; // calculated average weight per animal
  technician?: string;
  observations?: string;
  createdAt: Date;
}

export interface HealthRecord {
  id: string;
  lotId: string;
  penNumber: string; // NOVO: Curral onde o protocolo foi aplicado
  date: Date;
  protocol: string;
  description: string;
  cost: number;
  veterinarian?: string;
  supplier?: string;
  observations?: string;
  createdAt: Date;
}

export interface FeedCost {
  id: string;
  lotId: string;
  penNumber: string; // NOVO: Curral onde o alimento foi fornecido
  date: Date;
  feedType: string;
  quantity: number; // in kg or tons
  costPerUnit: number;
  totalCost: number;
  supplier?: string;
  observations?: string;
  createdAt: Date;
}

export interface LotMovement {
  id: string;
  lotId: string;
  penNumber: string; // NOVO: Curral de origem
  fromPen?: string;
  toPen: string;
  date: Date;
  quantity: number;
  reason: string;
  observations?: string;
  createdAt: Date;
}

export interface SaleSimulation {
  lotId: string;
  saleDate: Date;
  pricePerArroba: number;
  estimatedWeight: number;
  grossRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitPerAnimal: number;
  profitMargin: number;
  daysInConfinement: number;
  costBreakdown: {
    acquisition: number;
    feed: number;
    health: number;
    freight: number;
    financing: number;
    other: number;
  };
}

export interface FinancialAccount {
  id: string;
  type: 'payable' | 'receivable';
  description: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue';
  relatedEntityType: 'purchase_order' | 'cattle_lot' | 'health_record' | 'feed_cost' | 'freight' | 'commission' | 'taxes' | 'other_costs' | 'sale_record';
  relatedEntityId: string;
  paymentDate?: Date;
  paymentMethod?: string;
  observations?: string;
  createdAt: Date;
}

export interface KPI {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: string;
  trend?: number[];
}

export interface PenStatus {
  penNumber: string;
  capacity: number;
  currentAnimals: number;
  status: 'available' | 'occupied' | 'maintenance' | 'quarantine';
  lastCleaning?: Date;
  // 🆕 NOVO: Alocações do curral usando LoteCurralLink
  allocations?: LoteCurralLink[];
  // 🆕 NOVO: Resumo de lotes
  loteSummary?: {
    loteId: string;
    loteNumber: string;
    quantidade: number;
    percentualOcupacao: number;
  }[];
}

export interface Debt {
  id: string;
  partnerId: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'negotiating';
  installments?: {
    number: number;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'paid' | 'overdue';
  }[];
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ZootechnicalPerformance {
  lotId: string;
  gmd: number; // daily weight gain
  feedConversion: number;
  daysInConfinement: number;
  mortality: number; // percentage
  averageEntryWeight: number;
  averageCurrentWeight: number;
  projectedExitWeight: number;
  efficiency: number; // percentage
}

// New interfaces for Financial Reconciliation and Cost Control

export interface BankStatement {
  id: string;
  bankAccount: string;
  date: Date;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number;
  reference?: string;
  reconciled: boolean;
  reconciliationId?: string;
  // Novos campos para conciliação automática
  transactionId?: string; // ID da transação no banco
  category?: string; // Categoria da transação
  payee?: string; // Beneficiário/Pagador
  tags?: string[]; // Tags para classificação
  createdAt: Date;
}

export interface FinancialReconciliation {
  id: string;
  date: Date;
  bankAccount: string;
  statementId: string;
  financialAccountId: string;
  amount: number;
  difference: number;
  status: 'pending' | 'reconciled' | 'discrepancy';
  notes?: string;
  reconciledBy?: string;
  reconciledAt?: Date;
  // Novos campos para conciliação automática
  matchConfidence?: number; // Percentual de confiança do match automático (0-100)
  matchReason?: string; // Razão do match (valor, data, descrição, etc)
  autoReconciled?: boolean; // Se foi conciliado automaticamente
  createdAt: Date;
}

// Nova interface para regras de conciliação automática
export interface ReconciliationRule {
  id: string;
  name: string;
  isActive: boolean;
  conditions: {
    field: 'description' | 'amount' | 'date' | 'bankAccount' | 'type';
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between';
    value: string | number | Date | [Date, Date];
  }[];
  actions: {
    type: 'assignCategory' | 'assignTags' | 'linkToAccount' | 'autoReconcile';
    value: string | string[] | boolean;
  }[];
  priority: number; // Ordem de execução das regras
  createdAt: Date;
  updatedAt: Date;
}

// Nova interface para importação de extratos
export interface BankStatementImport {
  id: string;
  bankName: string;
  fileName: string;
  fileFormat: 'csv' | 'ofx' | 'qif' | 'xlsx' | 'pdf' | 'manual';
  importDate: Date;
  startDate: Date;
  endDate: Date;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  importedBy: string;
  createdAt: Date;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  description?: string;
  // ATUALIZADO: Novos tipos de centro de custo
  type: 'acquisition' | 'fattening' | 'administrative' | 'financial';
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CostAllocation {
  id: string;
  // ATUALIZADO: Novo campo para indicar o tipo de destino
  targetType: 'lot' | 'cost_center';
  // Pode ser ID de lote ou ID de centro de custo
  targetId: string;
  costCenterId: string;
  expenseId: string;
  amount: number;
  percentage: number;
  // ATUALIZADO: Novos métodos de alocação
  allocationMethod: 'manual_value' | 'percentage_allocation' | 'equal_split';
  allocationBasis?: string; // e.g., 'animal_count', 'weight', 'area'
  notes?: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  date: Date;
  description: string;
  // ATUALIZADO: Novas categorias de despesa
  category: 
    // Aquisição
    | 'animal_purchase' | 'commission' | 'freight' | 'acquisition_other'
    // Engorda
    | 'feed' | 'health_costs' | 'operational_costs' | 'fattening_other'
    // Administrativo
    | 'general_admin' | 'marketing' | 'accounting' | 'personnel' | 'office' | 'services' | 'technology' | 'admin_other'
    // Financeiro
    | 'taxes' | 'interest' | 'fees' | 'insurance' | 'capital_cost' | 'financial_management' | 'deaths' | 'default' | 'financial_other';
  totalAmount: number;
  supplierId?: string;
  invoiceNumber?: string;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  paymentDate?: Date;
  allocations: CostAllocation[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetPlan {
  id: string;
  cycleId: string;
  costCenterId: string;
  category: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  period: 'monthly' | 'quarterly' | 'annual';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialReport {
  id: string;
  name: string;
  type: 'cost_center' | 'profit_loss' | 'cash_flow' | 'budget_variance';
  period: {
    startDate: Date;
    endDate: Date;
  };
  filters: {
    costCenters?: string[];
    categories?: string[];
    lots?: string[];
  };
  data: any;
  generatedAt: Date;
  generatedBy: string;
}

// 🆕 NOVA INTERFACE: Custo Adicional
export interface AdditionalCost {
  id: string;
  type: 'Outros Custos' | 'Custos de Viagem' | 'Custos Operacionais';
  value: number;
  paymentType: 'cash' | 'installment';
  paymentDate?: Date;
}

// 🆕 NOVA INTERFACE: Notificação
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  relatedEntityType?: 'purchase_order' | 'cattle_lot' | 'health_record' | 'feed_cost' | 'financial_account' | 'sale_record' | 'pen' | 'weight_reading';
  relatedEntityId?: string;
  actionUrl?: string;
  createdAt: Date;
}

// Form types for better type safety
export interface PurchaseOrderFormData {
  cycleId: string;
  date: Date;
  vendorId: string;
  brokerId?: string;
  city: string;
  state: string;
  quantity: number;
  animalType: 'male' | 'female';
  estimatedAge: number;
  totalWeight: number;
  rcPercentage: number; // 🆕 NOVO
  pricePerArroba: number;
  commission: number;
  // 🆕 NOVO: Condições de pagamento da comissão
  commissionPaymentType?: 'cash' | 'installment';
  commissionPaymentDate?: Date;
  taxes: number;
  // 🆕 NOVO: Condições de pagamento dos impostos
  taxesPaymentType?: 'cash' | 'installment';
  taxesPaymentDate?: Date;
  otherCosts: number;
  otherCostsDescription?: string;
  // 🆕 NOVO: Condições de pagamento dos outros custos
  otherCostsPaymentType?: 'cash' | 'installment';
  otherCostsPaymentDate?: Date;
  // NOVOS CAMPOS PARA PAGAMENTO
  paymentType: 'cash' | 'installment';
  paymentDate?: Date;
  observations?: string;
}

export interface CattleLotFormData {
  purchaseOrderId: string;
  entryWeight: number;
  entryQuantity: number;
  quantityDifferenceReason?: string; // NOVO
  freightKm: number;
  freightCostPerKm: number;
  transportCompany?: string; // NOVO: transportadora
  entryDate: Date;
  cocoEntryDate?: Date;
  estimatedGmd: number;
  observations?: string;
}

export interface PartnerFormData {
  name: string;
  type: 'vendor' | 'broker' | 'slaughterhouse' | 'financial';
  city: string;
  state: string;
  phone?: string;
  email?: string;
  cpfCnpj?: string;
  address?: string;
  // Dados bancários separados
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: 'checking' | 'savings';
  observations?: string;
  isTransporter?: boolean; // NOVO: flag para transportadora
}

// NOVA INTERFACE: Form para Conta Pagadora
export interface PayerAccountFormData {
  name: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  bankAccountType: 'checking' | 'savings';
  isDefault: boolean;
}

// NOVA INTERFACE: Form para Cadastro de Curral
export interface PenRegistrationFormData {
  penNumber: string;
  capacity: number;
  location?: string;
  description?: string;
}

// 🆕 NOVA INTERFACE: Form para Alocação de Animais
export interface PenAllocationFormData {
  penNumber: string;
  lotId: string;
  quantity: number;
}

// 🆕 NOVA INTERFACE: Form para Registro de Venda
export interface SaleRecordFormData {
  lotId: string;
  slaughterhouseId: string;
  saleDate: Date;
  animalType: 'male' | 'female';
  quantity: number;
  totalWeight: number;
  pricePerArroba: number;
  paymentType: 'cash' | 'installment';
  paymentDate?: Date;
  commonAnimals: number;
  chinaAnimals: number;
  angusAnimals: number;
  observations?: string;
}

export interface WeightReadingFormData {
  lotId: string;
  penNumber: string; // NOVO: Curral onde a pesagem foi realizada
  date: Date;
  sampleWeight: number;
  sampleQuantity: number;
  technician?: string;
  observations?: string;
}

export interface HealthRecordFormData {
  lotId: string;
  penNumber: string; // NOVO: Curral onde o protocolo foi aplicado
  date: Date;
  protocol: string;
  description: string;
  cost: number;
  veterinarian?: string;
  supplier?: string;
  observations?: string;
}

export interface LotMovementFormData {
  lotId: string;
  penNumber: string; // NOVO: Curral de origem
  fromPen?: string;
  toPen: string;
  quantity: number;
  reason: string;
  observations?: string;
}

// ATUALIZADO: Formulário de despesa com novos campos
export interface ExpenseFormData {
  date: Date;
  description: string;
  // ATUALIZADO: Novas categorias de despesa
  category: 
    // Aquisição
    | 'animal_purchase' | 'commission' | 'freight' | 'acquisition_other'
    // Engorda
    | 'feed' | 'health_costs' | 'operational_costs' | 'fattening_other'
    // Administrativo
    | 'general_admin' | 'marketing' | 'accounting' | 'personnel' | 'office' | 'services' | 'technology' | 'admin_other'
    // Financeiro
    | 'taxes' | 'interest' | 'fees' | 'insurance' | 'capital_cost' | 'financial_management' | 'deaths' | 'default' | 'financial_other';
  totalAmount: number;
  supplierId?: string;
  invoiceNumber?: string;
  // NOVO: Tipo de alocação
  allocationType: 'direct' | 'indirect';
  // ATUALIZADO: Alocações com tipo de destino
  allocations: {
    targetType: 'lot' | 'cost_center';
    targetId: string;
    amount: number;
    percentage: number;
    allocationMethod: 'manual_value' | 'percentage_allocation' | 'equal_split';
  }[];
}

export interface BankStatementFormData {
  bankAccount: string;
  date: Date;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
  // Novos campos para conciliação
  category?: string;
  payee?: string;
  tags?: string[];
}

// Nova interface para importação de extratos
export interface BankStatementImportFormData {
  bankName: string;
  accountId: string;
  fileFormat: 'csv' | 'ofx' | 'qif' | 'xlsx' | 'pdf' | 'manual';
  startDate?: Date;
  endDate?: Date;
  columnMapping?: {
    date: string;
    description: string;
    amount: string;
    type: string;
    balance?: string;
    reference?: string;
  };
  dateFormat?: string;
}

// Nova interface para regras de conciliação
export interface ReconciliationRuleFormData {
  name: string;
  isActive: boolean;
  conditions: {
    field: 'description' | 'amount' | 'date' | 'bankAccount' | 'type';
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between';
    value: string | number | Date | [Date, Date];
  }[];
  actions: {
    type: 'assignCategory' | 'assignTags' | 'linkToAccount' | 'autoReconcile';
    value: string | string[] | boolean;
  }[];
  priority: number;
}

// Nova interface para conciliação manual
export interface ManualReconciliationFormData {
  statementId: string;
  financialAccountId: string;
  notes?: string;
}

// 🆕 NOVA INTERFACE: Tabela de Junção Lote-Curral (Modelo Operacional)
export interface LoteCurralLink {
  id: string;
  loteId: string;
  curralId: string;
  quantidade: number;
  percentualDoLote: number; // Percentual do lote total que está neste curral
  percentualDoCurral: number; // Percentual do curral ocupado por este lote
  dataAlocacao: Date;
  dataRemocao?: Date;
  status: 'active' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}

// 🆕 NOVA INTERFACE: Alocação de Custos Proporcional
export interface CostProportionalAllocation {
  id: string;
  custoOrigemId: string; // ID do custo original (health record, feed cost, etc)
  custoOrigemTipo: 'health' | 'feed' | 'operational' | 'other';
  curralId: string;
  loteId: string;
  valorOriginal: number; // Valor total do custo no curral
  valorAlocado: number; // Valor proporcional alocado ao lote
  percentualAlocado: number; // Percentual do custo alocado
  dataAlocacao: Date;
  createdAt: Date;
}

// 🆕 ATUALIZAR: Interface SaleDesignation para Pipeline de Vendas
export interface SaleDesignation {
  id: string;
  curralId: string;
  quantidadeAnimais: number;
  dataDesignacao: Date;
  status: 'next_slaughter' | 'scheduled' | 'shipped' | 'slaughtered' | 'reconciled';
  // Dados de escalonamento
  plantaFrigorifica?: string;
  dataAbatePrevista?: Date;
  precoVendaEstimado?: number;
  // Dados de embarque
  dataEmbarque?: Date;
  pesoTotalBalancao?: number;
  transportadoraId?: string;
  // Dados de abate
  dataAbate?: Date;
  pesoTotalFrigorifico?: number;
  rendimentoCarcaca?: number; // RC%
  numeroRomaneio?: string;
  // Dados de conciliação
  dataConciliacao?: Date;
  notaFiscal?: string;
  valorFinalRecebido?: number;
  // Rastreabilidade de lotes
  lotesComposicao?: {
    loteId: string;
    quantidade: number;
    percentual: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// 🆕 INTERFACES DO SISTEMA DRC (Demonstrativo de Resultado de Caixa)

export interface CashFlowEntry {
  id: string;
  date: Date;
  type: 'aporte' | 'receita' | 'despesa' | 'financiamento' | 'investimento' | 'transferencia';
  category: string;
  subcategory?: string;
  description: string;
  plannedAmount: number;
  actualAmount?: number;
  status: 'projetado' | 'realizado' | 'parcial' | 'cancelado';
  // Relacionamentos
  relatedAccountId?: string; // ID da conta financeira relacionada
  relatedEntityType?: 'purchase_order' | 'sale_record' | 'expense' | 'loan' | 'investment';
  relatedEntityId?: string;
  // Dados bancários
  bankAccountId?: string;
  reconciled?: boolean;
  // Metadados
  tags?: string[];
  attachments?: string[];
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashFlowPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  openingBalance: number;
  closingBalance: number;
  projectedClosingBalance: number;
  entries: CashFlowEntry[];
  // Totalizadores
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  totalFinancing: number;
  netCashFlow: number;
  // Análises
  liquidityIndex: number;
  workingCapitalNeed: number;
  variance: number; // Diferença entre realizado e projetado
  status: 'open' | 'closed' | 'reconciled';
  createdAt: Date;
  updatedAt: Date;
}

export interface CashFlowProjection {
  id: string;
  projectionDate: Date;
  horizonDays: number; // 30, 60, 90 dias
  scenarios: {
    name: 'pessimista' | 'realista' | 'otimista';
    assumptions: {
      salesGrowth: number; // percentual
      costIncrease: number; // percentual
      paymentDelay: number; // dias
      defaultRate: number; // percentual
    };
    projectedBalance: number;
    minimumBalance: number;
    capitalNeed: number;
  }[];
  recommendations?: string[];
  createdBy?: string;
  createdAt: Date;
}

export interface WorkingCapital {
  id: string;
  date: Date;
  // Ativos circulantes
  cashAndEquivalents: number;
  accountsReceivable: number;
  inventory: number; // Valor dos animais em estoque
  otherCurrentAssets: number;
  // Passivos circulantes
  accountsPayable: number;
  shortTermDebt: number;
  accruedExpenses: number;
  otherCurrentLiabilities: number;
  // Indicadores
  workingCapital: number; // Ativo circulante - Passivo circulante
  currentRatio: number; // Ativo circulante / Passivo circulante
  quickRatio: number; // (Ativo circulante - Estoque) / Passivo circulante
  cashConversionCycle: number; // Dias
  createdAt: Date;
}

export interface FinancialContribution {
  id: string;
  type: 'aporte_socio' | 'emprestimo_socio' | 'financiamento_bancario' | 'investidor';
  contributorName: string;
  contributorDocument?: string;
  date: Date;
  amount: number;
  // Condições
  returnType: 'capital' | 'emprestimo' | 'participacao';
  interestRate?: number; // Taxa de juros (se aplicável)
  paybackPeriod?: number; // Prazo em meses
  participationPercentage?: number; // Percentual de participação (se aplicável)
  // Status
  status: 'pendente' | 'confirmado' | 'devolvido' | 'convertido';
  returnDate?: Date;
  returnAmount?: number;
  // Documentação
  contractNumber?: string;
  attachments?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Formulários do DRC
export interface CashFlowEntryFormData {
  date: Date;
  type: 'aporte' | 'receita' | 'despesa' | 'financiamento' | 'investimento' | 'transferencia';
  category: string;
  subcategory?: string;
  description: string;
  plannedAmount: number;
  actualAmount?: number;
  status: 'projetado' | 'realizado' | 'parcial' | 'cancelado';
  bankAccountId?: string;
  tags?: string[];
  notes?: string;
}

export interface FinancialContributionFormData {
  type: 'aporte_socio' | 'emprestimo_socio' | 'financiamento_bancario' | 'investidor';
  contributorName: string;
  contributorDocument?: string;
  date: Date;
  amount: number;
  returnType: 'capital' | 'emprestimo' | 'participacao';
  interestRate?: number;
  paybackPeriod?: number;
  participationPercentage?: number;
  contractNumber?: string;
  notes?: string;
}
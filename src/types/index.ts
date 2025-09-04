export interface Partner {
  id: string;
  name: string;
  type: 'VENDOR' | 'BROKER' | 'BUYER' | 'INVESTOR' | 'SERVICE_PROVIDER' | 'FREIGHT_CARRIER' | 'OTHER';
  city?: string;
  state?: string;
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
  notes?: string;
  isActive: boolean;
  isTransporter?: boolean; // Campo para compatibilidade, mas agora usamos type === 'FREIGHT_CARRIER'
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para Transportadoras
export interface Transporter {
  id: string;
  name: string;
  document: string; // CNPJ
  phone: string;
  email?: string;
  address?: string;
  city: string;
  state: string;
  zipCode?: string;
  pricePerKm: number;
  minDistance?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para Instituições Financeiras
export interface FinancialInstitution {
  id: string;
  name: string;
  code: string; // Código do banco (ex: 001 para BB)
  type: 'bank' | 'cooperative' | 'fintech';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// NOVA INTERFACE: Conta Pagadora
export interface PayerAccount {
  id: string;
  institutionId?: string; // ID da instituição financeira
  accountName?: string; // Nome da conta
  name?: string; // Nome da conta (compatibilidade)
  bankName: string;
  agency?: string; // Agência
  bankAgency?: string; // Agência (compatibilidade)
  accountNumber?: string; // Número da conta
  bankAccount?: string; // Número da conta (compatibilidade)
  accountType?: 'checking' | 'savings'; // Tipo de conta
  bankAccountType?: 'checking' | 'savings'; // Tipo de conta (compatibilidade)
  balance?: number; // Saldo
  isActive: boolean;
  isDefault?: boolean;
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
  currentQuantity: number;
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
  currentQuantity: number;
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

export interface CattlePurchase {
  id: string;
  code: string; // ACXENG0001, ACXENG0002, etc.
  date: Date;
  vendorId: string;
  brokerId?: string;
  city: string;
  state: string;
  currentQuantity: number;
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

export interface CattlePurchase {
  id: string;
  lotNumber: string;
  purchaseId: string;
  // Dados de entrada (imutáveis após criação)
  entryWeight: number;
  entryQuantity: number;
  currentQuantityDifference?: number;
  currentQuantityDifferenceReason?: string;
  freightKm?: number;
  freightCostPerKm?: number;
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
  status: 'order' | 'payment_validation' | 'reception' | 'confined' | 'active' | 'sold' | 'slaughtered';
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
  sampleWeight: number; // total currentWeight of sample
  sampleQuantity: number; // number of animals in sample
  averageWeight: number; // calculated average currentWeight per animal
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
  currentQuantity: number; // in kg or tons
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
  currentQuantity: number;
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
  gmd: number; // daily currentWeight gain
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
  allocationBasis?: string; // e.g., 'animal_count', 'currentWeight', 'area'
  notes?: string;
  createdAt: Date;
}

// 🆕 NOVA INTERFACE: Lançamento Não-Caixa
export interface NonCashExpense {
  id: string;
  date: Date;
  type: 'mortality' | 'currentWeight_loss' | 'inventory_adjustment' | 'depreciation' | 'provision';
  description: string;
  relatedEntityType: 'cattle_lot' | 'pen' | 'equipment' | 'other';
  relatedEntityId: string;
  // Valores
  currentQuantity?: number; // Para mortalidade
  currentWeightLoss?: number; // Para quebra de peso
  monetaryValue: number; // Valor monetário do prejuízo/ajuste
  // Detalhes específicos
  mortalityDetails?: {
    cause: 'disease' | 'accident' | 'stress' | 'unknown';
    veterinarianReport?: string;
    insuranceClaim?: boolean;
  };
  currentWeightLossDetails?: {
    expectedWeight: number;
    actualWeight: number;
    lossPercentage: number;
  };
  // Impacto contábil
  accountingImpact: 'cost_of_goods_sold' | 'operational_loss' | 'extraordinary_loss';
  affectsDRE: boolean; // Se afeta o DRE
  affectsCashFlow: boolean; // Sempre false para non-cash
  // Metadados
  notes?: string;
  attachments?: string[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ATUALIZAR: Interface Expense para incluir flag de impacto no caixa
export interface Expense {
  id: string;
  date: Date;
  description: string;
  // ATUALIZADO: Novas categorias de despesa
  category: 
    // Aquisição
    | 'animal_purchase' | 'commission' | 'freight' | 'acquisition_other'
    // Engorda
    | 'feed' | 'health_costs' | 'operational_costs' | 'fattening_other' | 'deaths' | 'currentWeight_loss'
    // Administrativo
    | 'general_admin' | 'marketing' | 'accounting' | 'personnel' | 'office' | 'services' | 'technology' | 'admin_other' | 'depreciation'
    // Financeiro
    | 'taxes' | 'interest' | 'fees' | 'insurance' | 'capital_cost' | 'financial_management' | 'default' | 'tax_deductions' | 'slaughterhouse_advance' | 'financial_other'
    // Vendas
    | 'sales_commission' | 'sales_freight' | 'grading_costs' | 'sales_other'
    // Receitas
    | 'cattle_sales' | 'service_revenue' | 'byproduct_sales' | 'other_revenue'
    // Aportes e Financiamentos
    | 'partner_contribution' | 'partner_loan' | 'bank_financing' | 'external_investor';
  purchaseValue: number;
  supplierId?: string;
  invoiceNumber?: string;
  // MODELO HÍBRIDO: Substituindo paymentStatus e paymentDate
  dueDate: Date;          // Data de vencimento (sempre preenchida)
  paymentDate?: Date;     // Data de pagamento (quando realizado)
  isPaid: boolean;        // Flag simples: false = previsto, true = realizado
  allocations: CostAllocation[];
  attachments?: string[];
  // 🆕 NOVO: Flag para indicar se impacta o caixa
  impactsCashFlow: boolean;
  nonCashExpenseId?: string; // Referência para lançamento não-caixa relacionado
  createdAt: Date;
  updatedAt: Date;
}

// 🆕 NOVA INTERFACE: Configuração de categorias de despesa
export interface ExpenseCategoryConfig {
  category: Expense['category'];
  name: string;
  costCenter: 'acquisition' | 'fattening' | 'administrative' | 'financial' | 'sales' | 'revenue' | 'contributions';
  impactsCashFlow: boolean;
  isRevenue?: boolean; // Para diferenciar receitas de despesas
}

// 🆕 CONFIGURAÇÃO DE CATEGORIAS (para uso no sistema)
export const EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  // Aquisição
  { category: 'animal_purchase', name: 'Compra de Animais', costCenter: 'acquisition', impactsCashFlow: true },
  { category: 'commission', name: 'Comissão', costCenter: 'acquisition', impactsCashFlow: true },
  { category: 'freight', name: 'Frete', costCenter: 'acquisition', impactsCashFlow: true },
  { category: 'acquisition_other', name: 'Documentação, Taxas, Etc.', costCenter: 'acquisition', impactsCashFlow: true },
  
  // Engorda
  { category: 'feed', name: 'Alimentação', costCenter: 'fattening', impactsCashFlow: true },
  { category: 'health_costs', name: 'Sanidade', costCenter: 'fattening', impactsCashFlow: true },
  { category: 'operational_costs', name: 'Custos Operacionais', costCenter: 'fattening', impactsCashFlow: true },
  { category: 'deaths', name: 'Mortalidade', costCenter: 'fattening', impactsCashFlow: false },
  { category: 'currentWeight_loss', name: 'Quebra de Peso', costCenter: 'fattening', impactsCashFlow: false },
  { category: 'fattening_other', name: 'Outros Engorda', costCenter: 'fattening', impactsCashFlow: true },
  
  // Administrativo
  { category: 'general_admin', name: 'Administração Geral', costCenter: 'administrative', impactsCashFlow: true },
  { category: 'personnel', name: 'Pessoal', costCenter: 'administrative', impactsCashFlow: true },
  { category: 'office', name: 'Escritório', costCenter: 'administrative', impactsCashFlow: true },
  { category: 'marketing', name: 'Marketing', costCenter: 'administrative', impactsCashFlow: true },
  { category: 'accounting', name: 'Contabilidade', costCenter: 'administrative', impactsCashFlow: true },
  { category: 'services', name: 'Serviços', costCenter: 'administrative', impactsCashFlow: true },
  { category: 'technology', name: 'Tecnologia', costCenter: 'administrative', impactsCashFlow: true },
  { category: 'depreciation', name: 'Depreciação', costCenter: 'administrative', impactsCashFlow: false },
  { category: 'admin_other', name: 'Outros Admin', costCenter: 'administrative', impactsCashFlow: true },
  
  // Financeiro
  { category: 'taxes', name: 'Impostos', costCenter: 'financial', impactsCashFlow: true },
  { category: 'interest', name: 'Juros', costCenter: 'financial', impactsCashFlow: true },
  { category: 'fees', name: 'Taxas', costCenter: 'financial', impactsCashFlow: true },
  { category: 'insurance', name: 'Seguro', costCenter: 'financial', impactsCashFlow: true },
  { category: 'capital_cost', name: 'Custo de Capital', costCenter: 'financial', impactsCashFlow: false },
  { category: 'financial_management', name: 'Gestão Financeira', costCenter: 'financial', impactsCashFlow: true },
  { category: 'default', name: 'Inadimplência', costCenter: 'financial', impactsCashFlow: false },
  { category: 'tax_deductions', name: 'Deduções Fiscais', costCenter: 'financial', impactsCashFlow: false },
  { category: 'slaughterhouse_advance', name: 'Adiantamento Frigorífico', costCenter: 'financial', impactsCashFlow: false },
  { category: 'financial_other', name: 'Outros Financeiro', costCenter: 'financial', impactsCashFlow: true },
  
  // Vendas
  { category: 'sales_commission', name: 'Comissão de Venda', costCenter: 'sales', impactsCashFlow: true },
  { category: 'sales_freight', name: 'Frete de Venda', costCenter: 'sales', impactsCashFlow: true },
  { category: 'grading_costs', name: 'Classificação', costCenter: 'sales', impactsCashFlow: true },
  { category: 'sales_other', name: 'Outros Vendas', costCenter: 'sales', impactsCashFlow: true },
  
  // Receitas
  { category: 'cattle_sales', name: 'Venda de Gado', costCenter: 'revenue', impactsCashFlow: true, isRevenue: true },
  { category: 'service_revenue', name: 'Prestação de Serviço', costCenter: 'revenue', impactsCashFlow: true, isRevenue: true },
  { category: 'byproduct_sales', name: 'Venda de Subprodutos', costCenter: 'revenue', impactsCashFlow: true, isRevenue: true },
  { category: 'other_revenue', name: 'Outras Receitas', costCenter: 'revenue', impactsCashFlow: true, isRevenue: true },
  
  // Aportes e Financiamentos
  { category: 'partner_contribution', name: 'Aporte de Sócio', costCenter: 'contributions', impactsCashFlow: true, isRevenue: true },
  { category: 'partner_loan', name: 'Empréstimo de Sócio', costCenter: 'contributions', impactsCashFlow: true, isRevenue: true },
  { category: 'bank_financing', name: 'Financiamento Bancário', costCenter: 'contributions', impactsCashFlow: true, isRevenue: true },
  { category: 'external_investor', name: 'Investidor Externo', costCenter: 'contributions', impactsCashFlow: true, isRevenue: true },
];

export interface BudgetPlan {
  id: string;
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
  relatedEntityType?: 'purchase_order' | 'cattle_lot' | 'health_record' | 'feed_cost' | 'financial_account' | 'sale_record' | 'pen' | 'currentWeight_reading';
  relatedEntityId?: string;
  actionUrl?: string;
  createdAt: Date;
}

// Interface para Atualizações do Sistema
export interface SystemUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'security' | 'performance';
  category: 'pipeline' | 'financial' | 'reports' | 'ui' | 'api' | 'general';
  changes: {
    id: string;
    description: string;
    icon?: string;
  }[];
  releaseDate: Date;
  author?: string;
  isHighlighted?: boolean;
  imageUrl?: string;
  createdAt: Date;
}

// Interface para Feedback de Atualizações
export interface UpdateFeedback {
  id: string;
  updateId: string;
  userId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: Date;
}

// Form types for better type safety
export interface CattlePurchaseFormData {
  date: Date;
  vendorId: string;
  brokerId?: string;
  city: string;
  state: string;
  currentQuantity: number;
  animalType: 'male' | 'female';
  estimatedAge: number;
  totalWeight: number;
  rcPercentage: number; // 🆕 NOVO
  pricePerArroba: number;
  commission: number;
  // 🆕 NOVO: Condições de pagamento da comissão
  commissionPaymentType?: 'cash' | 'installment';
  commissionPaymentDate?: Date;
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

export interface CattlePurchaseFormData {
  purchaseId: string;
  entryWeight: number;
  entryQuantity: number;
  currentQuantityDifferenceReason?: string; // NOVO
  freightKm?: number;
  freightCostPerKm?: number;
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
  location?: string;
  description?: string;
}

// 🆕 NOVA INTERFACE: Form para Alocação de Animais
export interface PenAllocationFormData {
  penNumber: string;
  lotId: string;
  currentQuantity: number;
}

// 🆕 NOVA INTERFACE: Form para Registro de Venda
export interface SaleRecordFormData {
  lotId: string;
  slaughterhouseId: string;
  saleDate: Date;
  animalType: 'male' | 'female';
  currentQuantity: number;
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
  currentQuantity: number;
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
    | 'feed' | 'health_costs' | 'operational_costs' | 'fattening_other' | 'deaths' | 'currentWeight_loss'
    // Administrativo
    | 'general_admin' | 'marketing' | 'accounting' | 'personnel' | 'office' | 'services' | 'technology' | 'admin_other' | 'depreciation'
    // Financeiro
    | 'taxes' | 'interest' | 'fees' | 'insurance' | 'capital_cost' | 'financial_management' | 'default' | 'tax_deductions' | 'slaughterhouse_advance' | 'financial_other'
    // Vendas
    | 'sales_commission' | 'sales_freight' | 'grading_costs' | 'sales_other'
    // Receitas
    | 'cattle_sales' | 'service_revenue' | 'byproduct_sales' | 'other_revenue'
    // Aportes e Financiamentos
    | 'partner_contribution' | 'partner_loan' | 'bank_financing' | 'external_investor';
  purchaseValue: number;
  supplierId?: string;
  invoiceNumber?: string;
  // MODELO HÍBRIDO
  dueDate: Date;          // Data de vencimento
  isPaid: boolean;        // Se já foi pago
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
  status: 'projetado' | 'realizado' | 'pendente' | 'confirmado' | 'devolvido' | 'convertido';
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
  status?: 'projetado' | 'realizado' | 'pendente' | 'confirmado' | 'devolvido' | 'convertido';
  interestRate?: number;
  paybackPeriod?: number;
  participationPercentage?: number;
  contractNumber?: string;
  notes?: string;
}

// 🆕 NOVA INTERFACE: DRE (Demonstrativo de Resultados)
export interface DREStatement {
  id: string;
  entityType: 'lot' | 'pen' | 'global';
  entityId: string;
  entityName: string; // Nome da entidade (lote ou curral)
  periodStart: Date;
  periodEnd: Date;
  
  // Receitas
  revenue: {
    grossSales: number; // Vendas brutas
    salesDeductions: number; // Deduções (impostos, devoluções)
    netSales: number; // Receita líquida
  };
  
  // Custos dos Produtos Vendidos (CPV)
  costOfGoodsSold: {
    animalPurchase: number; // Custo de aquisição
    feed: number; // Alimentação
    health: number; // Sanidade
    freight: number; // Frete
    mortality: number; // Perdas por mortalidade (não-caixa)
    currentWeightLoss: number; // Perdas por quebra de peso (não-caixa)
    total: number;
  };
  
  // Lucro Bruto
  grossProfit: number;
  grossMargin: number; // Percentual
  
  // Despesas Operacionais
  operatingExpenses: {
    administrative: number; // Despesas administrativas rateadas
    sales: number; // Despesas de vendas
    financial: number; // Despesas financeiras (juros)
    depreciation: number; // Depreciação (não-caixa)
    other: number; // Outras despesas operacionais
    total: number;
  };
  
  // Resultado Operacional
  operatingIncome: number; // EBIT
  operatingMargin: number; // Percentual
  
  // Resultado Financeiro
  financialResult: {
    financialRevenue: number; // Receitas financeiras
    financialExpenses: number; // Despesas financeiras
    total: number;
  };
  
  // Resultado antes dos impostos
  incomeBeforeTaxes: number;
  
  // Impostos
  taxes: {
    incomeTax: number; // Imposto de renda
    socialContribution: number; // Contribuição social
    total: number;
  };
  
  // Resultado Líquido
  netIncome: number;
  netMargin: number; // Percentual
  
  // Métricas adicionais
  metrics: {
    revenuePerHead: number; // Receita por cabeça
    costPerHead: number; // Custo por cabeça
    profitPerHead: number; // Lucro por cabeça
    revenuePerArroba: number; // Receita por arroba
    costPerArroba: number; // Custo por arroba
    profitPerArroba: number; // Lucro por arroba
    daysInConfinement: number; // Dias em confinamento
    roi: number; // Retorno sobre investimento (%)
    dailyProfit: number; // Lucro diário médio
  };
  
  // Metadados
  generatedAt: Date;
  generatedBy?: string;
  notes?: string;
}

// Interface para parâmetros de geração do DRE
export interface DREGenerationParams {
  entityType: 'lot' | 'pen' | 'global';
  entityId?: string; // ID do lote ou curral (não necessário para global)
  periodStart: Date;
  periodEnd: Date;
  includeProjections?: boolean; // Incluir vendas projetadas
  pricePerArroba?: number; // Preço por arroba para projeções
}

// Interface para análise comparativa de DRE
export interface DREComparison {
  id: string;
  entities: Array<{
    type: 'lot' | 'pen';
    id: string;
    name: string;
    dre: DREStatement;
  }>;
  comparisonMetrics: {
    bestPerformer: string; // ID da entidade com melhor desempenho
    worstPerformer: string; // ID da entidade com pior desempenho
    averageNetMargin: number;
    averageROI: number;
    totalNetIncome: number;
  };
  insights: string[]; // Insights automáticos
  generatedAt: Date;
}

// 🆕 NOVA INTERFACE: Rateio de Custos Indiretos
export interface IndirectCostAllocation {
  id: string;
  name: string;
  description: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  purchaseValue: number;
  costType: 'administrative' | 'financial' | 'operational' | 'marketing' | 'other';
  
  // Método de rateio
  allocationMethod: 'by_heads' | 'by_value' | 'by_days' | 'by_currentWeight' | 'custom';
  
  // Base de cálculo para o rateio
  allocationBasis?: {
    totalHeads?: number;
    totalValue?: number;
    totalDays?: number;
    totalWeight?: number;
  };
  
  // Alocações por entidade
  allocations: {
    entityType: 'lot' | 'pen';
    entityId: string;
    entityName: string;
    // Valores base para cálculo
    heads?: number;
    value?: number;
    days?: number;
    currentWeight?: number;
    // Resultado do rateio
    percentage: number;
    allocatedAmount: number;
  }[];
  
  // Status
  status: 'draft' | 'approved' | 'applied';
  approvedBy?: string;
  approvedAt?: Date;
  appliedAt?: Date;
  
  // Metadados
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Definição das categorias de despesas (duplicado - usando a primeira definição)
export const EXPENSE_CATEGORIES_DUPLICATE = [
  // Aquisição
  { category: 'animal_purchase', label: 'Compra de Animais', costCenter: 'acquisition', isRevenue: false },
  { category: 'commission', label: 'Comissão', costCenter: 'acquisition', isRevenue: false },
  { category: 'freight', label: 'Frete', costCenter: 'acquisition', isRevenue: false },
  { category: 'acquisition_other', label: 'Outras - Aquisição', costCenter: 'acquisition', isRevenue: false },
  
  // Engorda
  { category: 'feed', label: 'Alimentação', costCenter: 'fattening', isRevenue: false },
  { category: 'health_costs', label: 'Custos de Saúde', costCenter: 'fattening', isRevenue: false },
  { category: 'operational_costs', label: 'Custos Operacionais', costCenter: 'fattening', isRevenue: false },
  { category: 'fattening_other', label: 'Outras - Engorda', costCenter: 'fattening', isRevenue: false },
  { category: 'deaths', label: 'Mortes', costCenter: 'fattening', isRevenue: false },
  { category: 'currentWeight_loss', label: 'Perda de Peso', costCenter: 'fattening', isRevenue: false },
  
  // Administrativo
  { category: 'general_admin', label: 'Administração Geral', costCenter: 'administrative', isRevenue: false },
  { category: 'marketing', label: 'Marketing', costCenter: 'administrative', isRevenue: false },
  { category: 'accounting', label: 'Contabilidade', costCenter: 'administrative', isRevenue: false },
  { category: 'personnel', label: 'Pessoal', costCenter: 'administrative', isRevenue: false },
  { category: 'office', label: 'Escritório', costCenter: 'administrative', isRevenue: false },
  { category: 'services', label: 'Serviços', costCenter: 'administrative', isRevenue: false },
  { category: 'technology', label: 'Tecnologia', costCenter: 'administrative', isRevenue: false },
  { category: 'admin_other', label: 'Outras - Administrativo', costCenter: 'administrative', isRevenue: false },
  { category: 'depreciation', label: 'Depreciação', costCenter: 'administrative', isRevenue: false },
  
  // Financeiro
  { category: 'taxes', label: 'Impostos', costCenter: 'financial', isRevenue: false },
  { category: 'interest', label: 'Juros', costCenter: 'financial', isRevenue: false },
  { category: 'fees', label: 'Taxas', costCenter: 'financial', isRevenue: false },
  { category: 'insurance', label: 'Seguro', costCenter: 'financial', isRevenue: false },
  { category: 'capital_cost', label: 'Custo de Capital', costCenter: 'financial', isRevenue: false },
  { category: 'financial_management', label: 'Gestão Financeira', costCenter: 'financial', isRevenue: false },
  { category: 'default', label: 'Inadimplência', costCenter: 'financial', isRevenue: false },
  { category: 'tax_deductions', label: 'Deduções Fiscais', costCenter: 'financial', isRevenue: false },
  { category: 'slaughterhouse_advance', label: 'Adiantamento Frigorífico', costCenter: 'financial', isRevenue: false },
  { category: 'financial_other', label: 'Outras - Financeiro', costCenter: 'financial', isRevenue: false },
  
  // Vendas
  { category: 'sales_commission', label: 'Comissão de Vendas', costCenter: 'sales', isRevenue: false },
  { category: 'sales_freight', label: 'Frete de Vendas', costCenter: 'sales', isRevenue: false },
  { category: 'grading_costs', label: 'Custos de Classificação', costCenter: 'sales', isRevenue: false },
  { category: 'sales_other', label: 'Outras - Vendas', costCenter: 'sales', isRevenue: false },
  
  // Receitas
  { category: 'cattle_sales', label: 'Venda de Gado', costCenter: 'revenue', isRevenue: true },
  { category: 'service_revenue', label: 'Receita de Serviços', costCenter: 'revenue', isRevenue: true },
  { category: 'byproduct_sales', label: 'Venda de Subprodutos', costCenter: 'revenue', isRevenue: true },
  { category: 'other_revenue', label: 'Outras Receitas', costCenter: 'revenue', isRevenue: true },
  
  // Aportes e Financiamentos
  { category: 'partner_contribution', label: 'Aporte de Sócio', costCenter: 'financing', isRevenue: true },
  { category: 'partner_loan', label: 'Empréstimo de Sócio', costCenter: 'financing', isRevenue: true },
  { category: 'bank_financing', label: 'Financiamento Bancário', costCenter: 'financing', isRevenue: true },
  { category: 'external_investor', label: 'Investidor Externo', costCenter: 'financing', isRevenue: true }
] as const;

// 🆕 NOVA INTERFACE: Template de Rateio
export interface AllocationTemplate {
  id: string;
  name: string;
  description: string;
  costType: 'administrative' | 'financial' | 'operational' | 'marketing' | 'other';
  allocationMethod: 'by_heads' | 'by_value' | 'by_days' | 'by_currentWeight' | 'custom';
  isActive: boolean;
  // Regras customizadas
  customRules?: {
    field: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
    value: string | number;
    currentWeight: number; // Peso na alocação
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// 🆕 NOVA INTERFACE: Centro de Custo Indireto
export interface IndirectCostCenter {
  id: string;
  name: string;
  code: string;
  type: 'administrative' | 'financial' | 'operational' | 'marketing' | 'other';
  description?: string;
  budget?: {
    monthly: number;
    quarterly: number;
    annual: number;
  };
  responsible?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 🆕 NOVA INTERFACE: Parâmetros para geração de rateio
export interface AllocationGenerationParams {
  costCenterId?: string;
  costType: 'administrative' | 'financial' | 'operational' | 'marketing' | 'other';
  period: {
    startDate: Date;
    endDate: Date;
  };
  purchaseValue: number;
  allocationMethod: 'by_heads' | 'by_value' | 'by_days' | 'by_currentWeight' | 'custom';
  includeInactiveLots?: boolean;
  templateId?: string;
}

// 🆕 NOVA INTERFACE: Resumo de custos indiretos
export interface IndirectCostSummary {
  entityType: 'lot' | 'pen' | 'global';
  entityId: string;
  entityName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  costs: {
    administrative: number;
    financial: number;
    operational: number;
    marketing: number;
    other: number;
    total: number;
  };
  percentageOfTotal: number;
  costPerHead?: number;
  costPerDay?: number;
  allocations: IndirectCostAllocation[];
}
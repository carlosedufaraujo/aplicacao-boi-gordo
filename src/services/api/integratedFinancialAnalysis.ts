import api from '@/lib/api';

export interface FinancialTransaction {
  id: string;
  referenceDate: string;
  description: string;
  amount: number;
  category: string;
  subcategory?: string;
  impactsCash: boolean;
  cashFlowDate?: string;
  cashFlowType?: 'OPERATING' | 'INVESTING' | 'FINANCING';
  isReconciled: boolean;
  notes?: string;
}

export interface CashFlowBreakdown {
  operating: {
    receipts: number;
    payments: number;
    net: number;
  };
  investing: {
    receipts: number;
    payments: number;
    net: number;
  };
  financing: {
    receipts: number;
    payments: number;
    net: number;
  };
}

export interface NonCashBreakdown {
  depreciation: number;
  mortality: number;
  biologicalAdjustments: number;
  other: number;
}

export interface ReconciliationData {
  netIncome: number;
  nonCashAdjustments: number;
  netCashFlow: number;
  difference: number;
}

export interface IntegratedAnalysisResult {
  id: string;
  referenceMonth: string;
  referenceYear: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashReceipts: number;
  cashPayments: number;
  netCashFlow: number;
  nonCashItems: number;
  depreciation: number;
  biologicalAssetChange: number;
  reconciliationDifference: number;
  status: 'DRAFT' | 'REVIEWING' | 'APPROVED' | 'CLOSED';
  isConsolidated: boolean;
  consolidatedAt?: string;
  createdAt: string;
  updatedAt: string;
  cashFlowBreakdown: CashFlowBreakdown;
  nonCashBreakdown: NonCashBreakdown;
  reconciliation: ReconciliationData;
  items: any[];
}

export interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalNetIncome: number;
  totalCashFlow: number;
  totalNonCashItems: number;
  netMargin: number;
  cashFlowMargin: number;
}

export interface QualityMetrics {
  cashConversionRate: number;
  nonCashPortion: number;
  reconciliationAccuracy: number;
}

export interface MonthlyTrend {
  month: number;
  revenue: number;
  expenses: number;
  netIncome: number;
  cashFlow: number;
  reconciliationDifference: number;
}

export interface CategoryBreakdown {
  cashRevenue: number;
  cashExpenses: number;
  depreciation: number;
  biologicalChanges: number;
  mortality: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  trends: MonthlyTrend[];
  breakdown: CategoryBreakdown;
  qualityMetrics: QualityMetrics;
  analyses: Array<{
    referenceMonth: string;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    netCashFlow: number;
    reconciliationDifference: number;
    status: string;
  }>;
}

export interface GenerateAnalysisRequest {
  year: number;
  month: number;
  includeNonCashItems?: boolean;
  cycleId?: string;
}

export interface CompareAnalysesParams {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

export interface ComparisonResult {
  periods: Array<IntegratedAnalysisResult & { period: string }>;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    totalNetIncome: number;
    totalCashFlow: number;
    averageMonthlyRevenue: number;
    averageMonthlyExpenses: number;
    averageMonthlyNetIncome: number;
    averageMonthlyCashFlow: number;
  };
}

class IntegratedFinancialAnalysisService {
  /**
   * Gera ou atualiza análise financeira integrada
   */
  async generateAnalysis(data: GenerateAnalysisRequest): Promise<IntegratedAnalysisResult> {
    const response = await api.post('/integrated-analysis/generate', data);
    return response.data.data;
  }

  /**
   * Busca análise por período específico
   */
  async getAnalysisByPeriod(year: number, month: number): Promise<IntegratedAnalysisResult> {
    const response = await api.get(`/integrated-analysis/period/${year}/${month}`);
    return response.data.data;
  }

  /**
   * Lista análises de um ano específico
   */
  async getAnalysesByYear(year: number): Promise<IntegratedAnalysisResult[]> {
    const response = await api.get(`/integrated-analysis/year/${year}`);
    return response.data.data;
  }

  /**
   * Análise comparativa entre períodos
   */
  async compareAnalyses(params: CompareAnalysesParams): Promise<ComparisonResult> {
    const response = await api.get('/integrated-analysis/compare', { params });
    return response.data.data;
  }

  /**
   * Dashboard com métricas consolidadas
   */
  async getDashboard(year: number): Promise<DashboardData> {
    const response = await api.get(`/integrated-analysis/dashboard/${year}`);
    return response.data.data;
  }

  /**
   * Formata valor monetário
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata porcentagem
   */
  formatPercentage(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(value / 100);
  }

  /**
   * Calcula variação percentual
   */
  calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Classifica status de reconciliação
   */
  getReconciliationStatus(difference: number, total: number): 'excellent' | 'good' | 'warning' | 'error' {
    const percentageDifference = Math.abs(difference / total) * 100;
    
    if (percentageDifference < 1) return 'excellent';
    if (percentageDifference < 5) return 'good';
    if (percentageDifference < 10) return 'warning';
    return 'error';
  }

  /**
   * Obtém cor baseada no status de reconciliação
   */
  getReconciliationColor(status: string): string {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Calcula indicadores de qualidade
   */
  calculateQualityIndicators(analysis: IntegratedAnalysisResult) {
    const cashConversion = analysis.netCashFlow / analysis.netIncome;
    const nonCashPortion = analysis.nonCashItems / analysis.totalRevenue;
    const reconciliationAccuracy = 1 - Math.abs(analysis.reconciliationDifference / analysis.netIncome);
    
    return {
      cashConversion: isFinite(cashConversion) ? cashConversion : 0,
      nonCashPortion: isFinite(nonCashPortion) ? nonCashPortion : 0,
      reconciliationAccuracy: isFinite(reconciliationAccuracy) ? Math.max(0, reconciliationAccuracy) : 0
    };
  }

  /**
   * Busca todas as transações financeiras sem filtro de período
   */
  async getAllTransactions(): Promise<FinancialTransaction[]> {
    try {
      const response = await api.get('/integrated-analysis/transactions');
      return response.data.data || [];
    } catch (error) {
      console.error('Erro ao buscar todas as transações:', error);
      throw error;
    }
  }
}

export const integratedFinancialAnalysisService = new IntegratedFinancialAnalysisService();
export default integratedFinancialAnalysisService;

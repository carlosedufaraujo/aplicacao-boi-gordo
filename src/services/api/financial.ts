// Serviço para Centro Financeiro
import { apiRequest } from './index';
import { 
  Expense, 
  CostCenter, 
  CostAllocation,
  BudgetPlan,
  FinancialAccount,
  Debt,
  CashFlowEntry,
  FinancialContribution,
  NonCashExpense
} from '../../types';

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  workingCapital: number;
}

interface CashFlowData {
  entries: CashFlowEntry[];
  summary: {
    openingBalance: number;
    totalInflows: number;
    totalOutflows: number;
    closingBalance: number;
    projectedBalance: number;
  };
  projections: {
    date: Date;
    projected: number;
    actual?: number;
  }[];
}

export const financialService = {
  // ===== DESPESAS =====
  expenses: {
    getAll: async (filters?: {
      startDate?: Date;
      endDate?: Date;
      costCenterId?: string;
      category?: string;
      status?: string;
    }): Promise<Expense[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      const endpoint = params.toString() ? `/expenses?${params}` : '/expenses';
      return apiRequest<Expense[]>(endpoint);
    },

    getById: async (id: string): Promise<Expense> => {
      return apiRequest<Expense>(`/expenses/${id}`);
    },

    create: async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> => {
      return apiRequest<Expense>('/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<Expense>): Promise<Expense> => {
      return apiRequest<Expense>(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/expenses/${id}`, {
        method: 'DELETE',
      });
    },

    // Aprovar despesa
    approve: async (id: string, approverId: string): Promise<Expense> => {
      return apiRequest<Expense>(`/expenses/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ approverId }),
      });
    },

    // Pagar despesa
    pay: async (id: string, data: {
      paymentDate: Date;
      paymentMethod: string;
      accountId: string;
      transactionId?: string;
    }): Promise<Expense> => {
      return apiRequest<Expense>(`/expenses/${id}/pay`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    // Cancelar despesa
    cancel: async (id: string, reason: string): Promise<Expense> => {
      return apiRequest<Expense>(`/expenses/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
    },

    // Obter categorias
    getCategories: async (): Promise<string[]> => {
      return apiRequest<string[]>('/expenses/categories');
    },
  },

  // ===== RECEITAS =====
  revenues: {
    getAll: async (filters?: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
      status?: string;
    }): Promise<any[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      const endpoint = params.toString() ? `/revenues?${params}` : '/revenues';
      return apiRequest<any[]>(endpoint);
    },

    getById: async (id: string): Promise<any> => {
      return apiRequest<any>(`/revenues/${id}`);
    },

    create: async (data: any): Promise<any> => {
      return apiRequest<any>('/revenues', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: any): Promise<any> => {
      return apiRequest<any>(`/revenues/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/revenues/${id}`, {
        method: 'DELETE',
      });
    },

    // Confirmar recebimento
    confirmReceipt: async (id: string, data: {
      receiptDate: Date;
      accountId: string;
      transactionId?: string;
    }): Promise<any> => {
      return apiRequest(`/revenues/${id}/confirm-receipt`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // ===== CENTROS DE CUSTO =====
  costCenters: {
    getAll: async (): Promise<CostCenter[]> => {
      return apiRequest<CostCenter[]>('/cost-centers');
    },

    getById: async (id: string): Promise<CostCenter> => {
      return apiRequest<CostCenter>(`/cost-centers/${id}`);
    },

    create: async (data: Omit<CostCenter, 'id' | 'createdAt'>): Promise<CostCenter> => {
      return apiRequest<CostCenter>('/cost-centers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<CostCenter>): Promise<CostCenter> => {
      return apiRequest<CostCenter>(`/cost-centers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/cost-centers/${id}`, {
        method: 'DELETE',
      });
    },

    // Obter resumo do centro de custo
    getSummary: async (id: string, period?: string): Promise<{
      totalBudget: number;
      totalSpent: number;
      totalRemaining: number;
      utilizationRate: number;
      expenses: Expense[];
    }> => {
      const endpoint = period 
        ? `/cost-centers/${id}/summary?period=${period}`
        : `/cost-centers/${id}/summary`;
      return apiRequest(endpoint);
    },
  },

  // ===== ALOCAÇÃO DE CUSTOS =====
  costAllocations: {
    getAll: async (): Promise<CostAllocation[]> => {
      return apiRequest<CostAllocation[]>('/cost-allocations');
    },

    getByExpense: async (expenseId: string): Promise<CostAllocation[]> => {
      return apiRequest<CostAllocation[]>(`/cost-allocations/expense/${expenseId}`);
    },

    getByCostCenter: async (costCenterId: string): Promise<CostAllocation[]> => {
      return apiRequest<CostAllocation[]>(`/cost-allocations/cost-center/${costCenterId}`);
    },

    create: async (data: Omit<CostAllocation, 'id' | 'createdAt'>): Promise<CostAllocation> => {
      return apiRequest<CostAllocation>('/cost-allocations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<CostAllocation>): Promise<CostAllocation> => {
      return apiRequest<CostAllocation>(`/cost-allocations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/cost-allocations/${id}`, {
        method: 'DELETE',
      });
    },

    // Alocar custo proporcionalmente
    allocateProportionally: async (data: {
      expenseId: string;
      allocations: {
        costCenterId: string;
        percentage: number;
      }[];
    }): Promise<CostAllocation[]> => {
      return apiRequest<CostAllocation[]>('/cost-allocations/allocate-proportionally', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // ===== ORÇAMENTOS =====
  budgets: {
    getAll: async (): Promise<BudgetPlan[]> => {
      return apiRequest<BudgetPlan[]>('/budgets');
    },

    getById: async (id: string): Promise<BudgetPlan> => {
      return apiRequest<BudgetPlan>(`/budgets/${id}`);
    },

    create: async (data: Omit<BudgetPlan, 'id' | 'createdAt'>): Promise<BudgetPlan> => {
      return apiRequest<BudgetPlan>('/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<BudgetPlan>): Promise<BudgetPlan> => {
      return apiRequest<BudgetPlan>(`/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/budgets/${id}`, {
        method: 'DELETE',
      });
    },

    // Comparar orçado vs realizado
    compare: async (id: string): Promise<{
      budget: BudgetPlan;
      actual: {
        revenue: number;
        expenses: number;
        profit: number;
      };
      variance: {
        revenue: number;
        expenses: number;
        profit: number;
      };
      variancePercentage: {
        revenue: number;
        expenses: number;
        profit: number;
      };
    }> => {
      return apiRequest(`/budgets/${id}/compare`);
    },
  },

  // ===== CONTAS FINANCEIRAS =====
  accounts: {
    getAll: async (): Promise<FinancialAccount[]> => {
      return apiRequest<FinancialAccount[]>('/financial-accounts');
    },

    getById: async (id: string): Promise<FinancialAccount> => {
      return apiRequest<FinancialAccount>(`/financial-accounts/${id}`);
    },

    create: async (data: Omit<FinancialAccount, 'id' | 'createdAt'>): Promise<FinancialAccount> => {
      return apiRequest<FinancialAccount>('/financial-accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<FinancialAccount>): Promise<FinancialAccount> => {
      return apiRequest<FinancialAccount>(`/financial-accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/financial-accounts/${id}`, {
        method: 'DELETE',
      });
    },

    // Obter extrato
    getStatement: async (id: string, startDate: Date, endDate: Date): Promise<{
      account: FinancialAccount;
      openingBalance: number;
      closingBalance: number;
      transactions: any[];
    }> => {
      return apiRequest(`/financial-accounts/${id}/statement?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    },
  },

  // ===== DÍVIDAS =====
  debts: {
    getAll: async (): Promise<Debt[]> => {
      return apiRequest<Debt[]>('/debts');
    },

    getById: async (id: string): Promise<Debt> => {
      return apiRequest<Debt>(`/debts/${id}`);
    },

    create: async (data: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debt> => {
      return apiRequest<Debt>('/debts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<Debt>): Promise<Debt> => {
      return apiRequest<Debt>(`/debts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/debts/${id}`, {
        method: 'DELETE',
      });
    },

    // Registrar pagamento de parcela
    payInstallment: async (id: string, data: {
      installmentNumber: number;
      paymentDate: Date;
      amount: number;
      accountId: string;
    }): Promise<Debt> => {
      return apiRequest<Debt>(`/debts/${id}/pay-installment`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // ===== FLUXO DE CAIXA =====
  cashFlow: {
    get: async (startDate: Date, endDate: Date): Promise<CashFlowData> => {
      return apiRequest<CashFlowData>(`/cash-flow?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    },

    getEntries: async (filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: 'inflow' | 'outflow';
      category?: string;
    }): Promise<CashFlowEntry[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      const endpoint = params.toString() ? `/cash-flow/entries?${params}` : '/cash-flow/entries';
      return apiRequest<CashFlowEntry[]>(endpoint);
    },

    createEntry: async (data: Omit<CashFlowEntry, 'id' | 'createdAt'>): Promise<CashFlowEntry> => {
      return apiRequest<CashFlowEntry>('/cash-flow/entries', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateEntry: async (id: string, data: Partial<CashFlowEntry>): Promise<CashFlowEntry> => {
      return apiRequest<CashFlowEntry>(`/cash-flow/entries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    deleteEntry: async (id: string): Promise<void> => {
      return apiRequest<void>(`/cash-flow/entries/${id}`, {
        method: 'DELETE',
      });
    },

    // Projeção de fluxo de caixa
    getProjection: async (days: number = 30): Promise<{
      projections: {
        date: Date;
        expectedInflows: number;
        expectedOutflows: number;
        balance: number;
      }[];
      alerts: {
        type: 'warning' | 'danger';
        message: string;
        date: Date;
      }[];
    }> => {
      return apiRequest(`/cash-flow/projection?days=${days}`);
    },
  },

  // ===== APORTES FINANCEIROS =====
  contributions: {
    getAll: async (): Promise<FinancialContribution[]> => {
      return apiRequest<FinancialContribution[]>('/financial-contributions');
    },

    getById: async (id: string): Promise<FinancialContribution> => {
      return apiRequest<FinancialContribution>(`/financial-contributions/${id}`);
    },

    create: async (data: Omit<FinancialContribution, 'id' | 'createdAt'>): Promise<FinancialContribution> => {
      return apiRequest<FinancialContribution>('/financial-contributions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<FinancialContribution>): Promise<FinancialContribution> => {
      return apiRequest<FinancialContribution>(`/financial-contributions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/financial-contributions/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ===== LANÇAMENTOS NÃO-CAIXA =====
  nonCashExpenses: {
    getAll: async (): Promise<NonCashExpense[]> => {
      return apiRequest<NonCashExpense[]>('/non-cash-expenses');
    },

    getById: async (id: string): Promise<NonCashExpense> => {
      return apiRequest<NonCashExpense>(`/non-cash-expenses/${id}`);
    },

    create: async (data: Omit<NonCashExpense, 'id' | 'createdAt'>): Promise<NonCashExpense> => {
      return apiRequest<NonCashExpense>('/non-cash-expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<NonCashExpense>): Promise<NonCashExpense> => {
      return apiRequest<NonCashExpense>(`/non-cash-expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/non-cash-expenses/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ===== RESUMO FINANCEIRO =====
  getSummary: async (): Promise<FinancialSummary> => {
    return apiRequest<FinancialSummary>('/financial/summary');
  },

  // ===== RELATÓRIOS FINANCEIROS =====
  reports: {
    // Relatório de despesas
    getExpenseReport: async (startDate: Date, endDate: Date, groupBy?: 'category' | 'costCenter' | 'vendor'): Promise<any> => {
      return apiRequest(`/financial/reports/expenses?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}${groupBy ? `&groupBy=${groupBy}` : ''}`);
    },

    // Relatório de receitas
    getRevenueReport: async (startDate: Date, endDate: Date, groupBy?: 'category' | 'customer'): Promise<any> => {
      return apiRequest(`/financial/reports/revenues?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}${groupBy ? `&groupBy=${groupBy}` : ''}`);
    },

    // Análise de rentabilidade
    getProfitabilityAnalysis: async (period: 'month' | 'quarter' | 'year'): Promise<any> => {
      return apiRequest(`/financial/reports/profitability?period=${period}`);
    },

    // Análise de custos
    getCostAnalysis: async (filters?: {
      startDate?: Date;
      endDate?: Date;
      costCenterId?: string;
      category?: string;
    }): Promise<any> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      const endpoint = params.toString() 
        ? `/financial/reports/cost-analysis?${params}`
        : '/financial/reports/cost-analysis';
      return apiRequest(endpoint);
    },
  },
};
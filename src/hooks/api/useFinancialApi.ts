import { useCallback } from 'react';
import { format } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export interface FinancialDashboardData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  averageRoi: number;
  activeLots: number;
  revenueChange: number;
  expenseChange: number;
  profitChange: number;
  marginChange: number;
  roiChange: number;
  lotsChange: number;
}

export interface LotProfitability {
  id: string;
  purchaseId: string;
  lotCode: string;
  purchaseCost: number;
  transportCost: number;
  feedCost: number;
  veterinaryCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  saleRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  costPerAnimal: number;
  revenuePerAnimal: number;
  profitPerAnimal: number;
  costPerArroba: number;
  revenuePerArroba: number;
  profitPerArroba: number;
  startDate: string;
  endDate: string | null;
  daysInOperation: number;
  status: string;
}

export interface CashFlowItem {
  date: string;
  entrada: number;
  saida: number;
  saldo: number;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  totalAmount: number;
  dueDate: Date;
  isPaid: boolean;
  paymentDate?: Date;
  costCenterId?: string;
  supplier?: string;
  documentNumber?: string;
  competenceDate: Date;
  createdAt: Date;
}

export interface Revenue {
  id: string;
  description: string;
  category: string;
  totalAmount: number;
  dueDate: Date;
  isReceived: boolean;
  receiptDate?: Date;
  costCenterId?: string;
  customer?: string;
  documentNumber?: string;
  competenceDate: Date;
  createdAt: Date;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId?: string;
  isActive: boolean;
  description?: string;
  allocationMethod?: string;
}

export const useFinancialApi = () => {
  
  // Buscar dados do dashboard
  const getDashboardData = useCallback(async (dateRange?: { start: Date; end: Date }): Promise<FinancialDashboardData> => {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', format(dateRange.start, 'yyyy-MM-dd'));
        params.append('endDate', format(dateRange.end, 'yyyy-MM-dd'));
      }
      
      const response = await fetch(`${API_BASE}/financial/dashboard?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }, []);

  // Buscar rentabilidade dos lotes
  const getLotProfitability = useCallback(async (): Promise<LotProfitability[]> => {
    try {
      const response = await fetch(`${API_BASE}/financial/lot-profitability`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data.items;
    } catch (error) {
      console.error('Erro ao buscar rentabilidade:', error);
      throw error;
    }
  }, []);

  // Buscar fluxo de caixa
  const getCashFlow = useCallback(async (dateRange?: { start: Date; end: Date }): Promise<CashFlowItem[]> => {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', format(dateRange.start, 'yyyy-MM-dd'));
        params.append('endDate', format(dateRange.end, 'yyyy-MM-dd'));
      }
      
      const response = await fetch(`${API_BASE}/financial/cash-flow?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data.items;
    } catch (error) {
      console.error('Erro ao buscar fluxo de caixa:', error);
      throw error;
    }
  }, []);

  // Buscar despesas
  const getExpenses = useCallback(async (filters?: any): Promise<Expense[]> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key]) params.append(key, filters[key]);
        });
      }
      
      const response = await fetch(`${API_BASE}/expenses?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data?.items || [];
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
      return [];
    }
  }, []);

  // Buscar receitas
  const getRevenues = useCallback(async (filters?: any): Promise<Revenue[]> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key]) params.append(key, filters[key]);
        });
      }
      
      const response = await fetch(`${API_BASE}/revenues?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data?.items || [];
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
      return [];
    }
  }, []);

  // Buscar centros de custo
  const getCostCenters = useCallback(async (): Promise<CostCenter[]> => {
    try {
      const response = await fetch(`${API_BASE}/cost-centers`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data?.items || [];
    } catch (error) {
      console.error('Erro ao buscar centros de custo:', error);
      return [];
    }
  }, []);

  // Criar despesa
  const createExpense = useCallback(async (data: Partial<Expense>): Promise<Expense> => {
    try {
      const response = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          competenceDate: data.competenceDate || data.dueDate,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      throw error;
    }
  }, []);

  // Criar receita
  const createRevenue = useCallback(async (data: Partial<Revenue>): Promise<Revenue> => {
    try {
      const response = await fetch(`${API_BASE}/revenues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          competenceDate: data.competenceDate || data.dueDate,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      throw error;
    }
  }, []);

  // Atualizar despesa
  const updateExpense = useCallback(async (id: string, data: Partial<Expense>): Promise<Expense> => {
    try {
      const response = await fetch(`${API_BASE}/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      throw error;
    }
  }, []);

  // Atualizar receita
  const updateRevenue = useCallback(async (id: string, data: Partial<Revenue>): Promise<Revenue> => {
    try {
      const response = await fetch(`${API_BASE}/revenues/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao atualizar receita:', error);
      throw error;
    }
  }, []);

  // Deletar despesa
  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao deletar despesa:', error);
      throw error;
    }
  }, []);

  // Deletar receita
  const deleteRevenue = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/revenues/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao deletar receita:', error);
      throw error;
    }
  }, []);

  // Integrar compra com financeiro
  const integratePurchase = useCallback(async (purchaseId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/financial/integrate-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purchaseId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao integrar compra:', error);
      throw error;
    }
  }, []);

  // Integrar venda com financeiro
  const integrateSale = useCallback(async (saleId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/financial/integrate-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ saleId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao integrar venda:', error);
      throw error;
    }
  }, []);

  // Integrar intervenção com financeiro
  const integrateIntervention = useCallback(async (interventionId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/financial/integrate-intervention`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interventionId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao integrar intervenção:', error);
      throw error;
    }
  }, []);

  // Buscar resumo financeiro
  const getFinancialSummary = useCallback(async (period: string = 'month') => {
    try {
      const response = await fetch(`${API_BASE}/financial/summary?period=${period}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
      throw error;
    }
  }, []);

  return {
    // Dashboard e análises
    getDashboardData,
    getLotProfitability,
    getCashFlow,
    getFinancialSummary,
    
    // CRUD de despesas e receitas
    getExpenses,
    getRevenues,
    getCostCenters,
    createExpense,
    createRevenue,
    updateExpense,
    updateRevenue,
    deleteExpense,
    deleteRevenue,
    
    // Integrações
    integratePurchase,
    integrateSale,
    integrateIntervention,
  };
};
// Serviço para Dashboard
import { apiRequest } from './index';

interface DashboardMetrics {
  totalCattle: number;
  activeLots: number;
  occupiedPens: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  averageWeight: number;
  mortalityRate: number;
  averageDaysConfined: number;
  feedConversionRate: number;
}

interface DashboardCharts {
  revenueChart: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }[];
  };
  costAllocationChart: {
    labels: string[];
    data: number[];
    backgroundColor: string[];
  };
  herdValueChart: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  };
  lotsInsertionChart: {
    labels: string[];
    data: number[];
  };
  purchaseByBrokerChart: {
    labels: string[];
    data: number[];
  };
  purchaseByStateChart: {
    labels: string[];
    data: number[];
  };
}

interface DashboardAlerts {
  critical: Alert[];
  warning: Alert[];
  info: Alert[];
}

interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  timestamp: Date;
  actionUrl?: string;
}

interface LatestMovement {
  id: string;
  type: 'purchase' | 'sale' | 'transfer' | 'death' | 'birth';
  description: string;
  currentQuantity: number;
  value?: number;
  date: Date;
  lotId?: string;
  penId?: string;
}

export const dashboardService = {
  // Obter todos os dados do dashboard
  getAll: async (period?: 'day' | 'week' | 'month' | 'year'): Promise<{
    metrics: DashboardMetrics;
    charts: DashboardCharts;
    alerts: DashboardAlerts;
    latestMovements: LatestMovement[];
    lastUpdate: Date;
  }> => {
    const endpoint = period ? `/dashboard?period=${period}` : '/dashboard';
    return apiRequest(endpoint);
  },

  // Obter apenas métricas
  getMetrics: async (): Promise<DashboardMetrics> => {
    return apiRequest<DashboardMetrics>('/dashboard/metrics');
  },

  // Obter dados para gráficos
  getCharts: async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<DashboardCharts> => {
    return apiRequest<DashboardCharts>(`/dashboard/charts?period=${period}`);
  },

  // Obter alertas
  getAlerts: async (): Promise<DashboardAlerts> => {
    return apiRequest<DashboardAlerts>('/dashboard/alerts');
  },

  // Marcar alerta como lido
  markAlertAsRead: async (alertId: string): Promise<void> => {
    return apiRequest(`/dashboard/alerts/${alertId}/read`, {
      method: 'PATCH',
    });
  },

  // Obter últimas movimentações
  getLatestMovements: async (limit: number = 10): Promise<LatestMovement[]> => {
    return apiRequest<LatestMovement[]>(`/dashboard/movements?limit=${limit}`);
  },

  // Obter KPIs específicos
  getKPIs: async (): Promise<{
    label: string;
    value: string | number;
    icon: string;
    trend?: {
      direction: 'up' | 'down' | 'stable';
      percentage: number;
    };
  }[]> => {
    return apiRequest('/dashboard/kpis');
  },

  // Obter resumo financeiro
  getFinancialSummary: async (period?: string): Promise<{
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
    cashFlow: number;
    projectedRevenue: number;
    projectedExpenses: number;
  }> => {
    const endpoint = period ? `/dashboard/financial-summary?period=${period}` : '/dashboard/financial-summary';
    return apiRequest(endpoint);
  },

  // Obter status dos lotes
  getLotsStatus: async (): Promise<{
    total: number;
    active: number;
    sold: number;
    inTransit: number;
    quarantine: number;
    averageOccupancy: number;
  }> => {
    return apiRequest('/dashboard/lots-status');
  },

  // Obter performance zootécnica
  getZootechnicalPerformance: async (): Promise<{
    averageDailyGain: number;
    feedConversion: number;
    mortalityRate: number;
    morbidityRate: number;
    averageSlaughterWeight: number;
    carcassYield: number;
  }> => {
    return apiRequest('/dashboard/zootechnical-performance');
  },

  // Obter previsões
  getForecast: async (days: number = 30): Promise<{
    expectedSales: number;
    expectedRevenue: number;
    expectedCosts: number;
    lotsReadyForSale: number;
    cashFlowProjection: number[];
  }> => {
    return apiRequest(`/dashboard/forecast?days=${days}`);
  },

  // Exportar dados do dashboard
  exportData: async (format: 'pdf' | 'excel' | 'csv' = 'pdf'): Promise<Blob> => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
    const response = await fetch(`${apiUrl}/dashboard/export?format=${format}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export dashboard data');
    }

    return response.blob();
  },
};

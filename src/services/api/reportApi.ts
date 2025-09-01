import { apiClient } from './apiClient';

export interface LotPerformance {
  lot: {
    id: string;
    code: string;
    status: string;
    createdAt: string;
  };
  quantity: {
    initial: number;
    current: number;
    sold: number;
    mortality: number;
  };
  weight: {
    totalInitial: number;
    avgInitial: number;
    totalCurrent: number;
    avgCurrent: number;
    totalGain: number;
    avgDailyGain: number;
  };
  timeline: {
    entryDate: string;
    lastWeighingDate: string | null;
    daysInConfinement: number;
    weighingCount: number;
  };
  financials: {
    purchaseCost: number;
    totalCost: number;
    totalSales: number;
    profit: number;
    margin: number;
    roi: number;
    costPerHead: number;
    costPerKg: number;
  };
  ranking?: {
    position: number;
    total: number;
    percentile: number;
  };
}

export interface LotPerformanceReport {
  lots: LotPerformance[];
  summary: {
    totalLots: number;
    averages: {
      purchaseCost: number;
      totalCost: number;
      totalSales: number;
      profit: number;
      margin: number;
      roi: number;
      daysInConfinement: number;
    } | null;
    bestPerformers: LotPerformance[];
    worstPerformers: LotPerformance[];
  };
}

export interface PenOccupancyReport {
  summary: {
    totalCapacity: number;
    totalOccupied: number;
    totalAvailable: number;
    occupancyRate: number;
    activePens: number;
    inactivePens: number;
  };
  pens: Array<{
    id: string;
    name: string;
    status: string;
    capacity: number;
    occupied: number;
    available: number;
    occupancyRate: number;
    lots: Array<{
      id: string;
      code: string;
      quantity: number;
      entryDate: string;
    }>;
  }>;
  alerts: Array<{
    type: 'warning' | 'info';
    message: string;
    pens: string[];
  }>;
}

export interface DREReport {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    total: number;
    categories: Record<string, number>;
  };
  expense: {
    total: number;
    categories: Record<string, number>;
  };
  results: {
    grossProfit: number;
    netProfit: number;
    margin: number;
    roi: number;
  };
}

export interface CashFlowReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    initialBalance: number;
    totalInflow: number;
    totalOutflow: number;
    netFlow: number;
    finalBalance: number;
    pendingInflow: number;
    pendingOutflow: number;
  };
  daily: Array<{
    date: string;
    inflow: number;
    outflow: number;
    balance: number;
  }>;
}

export const reportApi = {
  getLotPerformance: async (lotId?: string): Promise<LotPerformanceReport> => {
    const params = lotId ? { lotId } : {};
    const response = await apiClient.get('/reports/lot-performance', { params });
    return response.data.data;
  },

  getPenOccupancy: async (): Promise<PenOccupancyReport> => {
    const response = await apiClient.get('/reports/pen-occupancy');
    return response.data.data;
  },

  getDRE: async (filters: {
    startDate: Date;
    endDate: Date;
    entityType?: 'LOT' | 'PEN';
    entityId?: string;
  }): Promise<DREReport> => {
    const response = await apiClient.get('/reports/dre', {
      params: {
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        entityType: filters.entityType,
        entityId: filters.entityId
      }
    });
    return response.data.data;
  },

  getCashFlow: async (filters: {
    startDate: Date;
    endDate: Date;
    accountId?: string;
  }): Promise<CashFlowReport> => {
    const response = await apiClient.get('/reports/cash-flow', {
      params: {
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        accountId: filters.accountId
      }
    });
    return response.data.data;
  },

  getExecutiveSummary: async (startDate: Date, endDate: Date) => {
    const response = await apiClient.get('/reports/executive-summary', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    return response.data.data;
  },

  compareDRE: async (entities: Array<{ type: 'LOT' | 'PEN'; id: string }>, startDate: Date, endDate: Date) => {
    const response = await apiClient.post('/reports/dre-comparison', {
      entities,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    return response.data.data;
  }
};
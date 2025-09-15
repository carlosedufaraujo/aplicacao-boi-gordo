// Serviço para Pipeline de Vendas
import { apiRequest } from './index';
import { SaleRecord, SaleDesignation } from '../../types';

interface SalesStats {
  total: number;
  byStatus: {
    designated: number;
    negotiating: number;
    confirmed: number;
    slaughter: number;
    shipped: number;
    completed: number;
  };
  totalRevenue: number;
  totalAnimals: number;
  averagePrice: number;
  averageWeight: number;
}

export const salesService = {
  // ===== VENDAS =====
  sales: {
    getAll: async (filters?: {
      status?: string;
      slaughterhouseId?: string;
      startDate?: Date;
      endDate?: Date;
    }): Promise<SaleRecord[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      const endpoint = params.toString() ? `/sales?${params}` : '/sales';
      return apiRequest<SaleRecord[]>(endpoint);
    },

    getById: async (id: string): Promise<SaleRecord> => {
      return apiRequest<SaleRecord>(`/sales/${id}`);
    },

    create: async (data: Omit<SaleRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SaleRecord> => {
      return apiRequest<SaleRecord>('/sales', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<SaleRecord>): Promise<SaleRecord> => {
      return apiRequest<SaleRecord>(`/sales/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/sales/${id}`, {
        method: 'DELETE',
      });
    },

    // Confirmar venda
    confirm: async (id: string, data: {
      confirmedPrice: number;
      confirmedDate: Date;
      paymentConditions?: string;
      observations?: string;
    }): Promise<SaleRecord> => {
      return apiRequest<SaleRecord>(`/sales/${id}/confirm`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    // Registrar abate
    registerSlaughter: async (id: string, data: {
      slaughterDate: Date;
      actualQuantity: number;
      totalCarcassWeight: number;
      carcassYield: number;
      observations?: string;
    }): Promise<SaleRecord> => {
      return apiRequest<SaleRecord>(`/sales/${id}/slaughter`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Registrar embarque
    registerShipment: async (id: string, data: {
      shipmentDate: Date;
      transporterId: string;
      freightCost: number;
      documents?: string[];
    }): Promise<SaleRecord> => {
      return apiRequest<SaleRecord>(`/sales/${id}/shipment`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Finalizar venda
    complete: async (id: string, data: {
      finalWeight: number;
      finalPrice: number;
      discounts?: number;
      bonuses?: number;
      finalValue: number;
    }): Promise<SaleRecord> => {
      return apiRequest<SaleRecord>(`/sales/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    // Cancelar venda
    cancel: async (id: string, reason: string): Promise<SaleRecord> => {
      return apiRequest<SaleRecord>(`/sales/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
    },

    // Obter estatísticas
    getStats: async (period?: string): Promise<SalesStats> => {
      const endpoint = period ? `/sales/stats?period=${period}` : '/sales/stats';
      return apiRequest<SalesStats>(endpoint);
    },

    // Simulação de venda
    simulate: async (data: {
      lotIds: string[];
      slaughterhouseId: string;
      estimatedPrice: number;
      estimatedDate: Date;
    }): Promise<{
      totalAnimals: number;
      totalWeight: number;
      estimatedRevenue: number;
      estimatedCosts: number;
      estimatedProfit: number;
      profitMargin: number;
    }> => {
      return apiRequest('/sales/simulate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // ===== DESIGNAÇÕES DE VENDA =====
  designations: {
    getAll: async (): Promise<SaleDesignation[]> => {
      return apiRequest<SaleDesignation[]>('/sale-designations');
    },

    getById: async (id: string): Promise<SaleDesignation> => {
      return apiRequest<SaleDesignation>(`/sale-designations/${id}`);
    },

    create: async (data: Omit<SaleDesignation, 'id' | 'createdAt' | 'updatedAt'>): Promise<SaleDesignation> => {
      return apiRequest<SaleDesignation>('/sale-designations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<SaleDesignation>): Promise<SaleDesignation> => {
      return apiRequest<SaleDesignation>(`/sale-designations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/sale-designations/${id}`, {
        method: 'DELETE',
      });
    },

    // Mover para próximo estágio
    moveToNextStage: async (id: string): Promise<SaleDesignation> => {
      return apiRequest<SaleDesignation>(`/sale-designations/${id}/next-stage`, {
        method: 'PATCH',
      });
    },

    // Converter em venda
    convertToSale: async (id: string): Promise<SaleRecord> => {
      return apiRequest<SaleRecord>(`/sale-designations/${id}/convert-to-sale`, {
        method: 'POST',
      });
    },
  },

  // ===== RELATÓRIOS DE VENDAS =====
  reports: {
    // Relatório de vendas por período
    getSalesReport: async (startDate: Date, endDate: Date): Promise<any> => {
      return apiRequest(`/sales/reports/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    },

    // Relatório de frigoríficos
    getSlaughterhouseReport: async (slaughterhouseId?: string): Promise<any> => {
      const endpoint = slaughterhouseId 
        ? `/sales/reports/slaughterhouses?slaughterhouseId=${slaughterhouseId}` 
        : '/sales/reports/slaughterhouses';
      return apiRequest(endpoint);
    },

    // Análise de rentabilidade
    getProfitabilityAnalysis: async (filters?: {
      startDate?: Date;
      endDate?: Date;
      slaughterhouseId?: string;
      lotId?: string;
    }): Promise<{
      totalRevenue: number;
      totalCosts: number;
      grossProfit: number;
      netProfit: number;
      profitMargin: number;
      averagePricePerKg: number;
      averageCostPerKg: number;
      bestPerformingLots: any[];
      worstPerformingLots: any[];
    }> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      const endpoint = params.toString() 
        ? `/sales/reports/profitability?${params}` 
        : '/sales/reports/profitability';
      return apiRequest(endpoint);
    },

    // Previsão de vendas
    getSalesForecast: async (days: number = 30): Promise<{
      expectedSales: number;
      expectedRevenue: number;
      lotsReadyForSale: any[];
      optimalSaleDate: Date;
      priceProjection: number[];
    }> => {
      return apiRequest(`/sales/reports/forecast?days=${days}`);
    },

    // Comparativo de preços
    getPriceComparison: async (period: 'week' | 'month' | 'quarter' | 'year'): Promise<{
      averagePrice: number;
      minPrice: number;
      maxPrice: number;
      priceBySlaughterhouse: any[];
      priceEvolution: any[];
      marketComparison: any;
    }> => {
      return apiRequest(`/sales/reports/price-comparison?period=${period}`);
    },
  },
};

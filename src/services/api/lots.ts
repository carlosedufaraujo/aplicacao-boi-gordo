// Serviço para Lotes e Mapa de Currais
import { apiRequest } from './index';
import { CattlePurchase, LotMovement, WeightReading, HealthRecord, PenAllocation, LoteCurralLink } from '../../types';

interface LotStats {
  total: number;
  active: number;
  sold: number;
  totalAnimals: number;
  averageWeight: number;
  averageDaysConfined: number;
  mortality: number;
  occupancyRate: number;
}

interface PenMap {
  pens: {
    id: string;
    penNumber: string;
    location: string;
    capacity: number;
    currentOccupancy: number;
    lots: {
      id: string;
      lotNumber: string;
      currentQuantity: number;
      averageWeight: number;
      daysConfined: number;
    }[];
    status: 'available' | 'occupied' | 'maintenance' | 'quarantine';
  }[];
  lines: {
    letter: string;
    pens: string[];
    totalCapacity: number;
    currentOccupancy: number;
  }[];
}

export const lotsService = {
  // ===== LOTES =====
  lots: {
    getAll: async (filters?: {
      status?: string;
      penId?: string;
      startDate?: Date;
      endDate?: Date;
    }): Promise<CattlePurchase[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      const endpoint = params.toString() ? `/lots?${params}` : '/lots';
      return apiRequest<CattlePurchase[]>(endpoint);
    },

    getById: async (id: string): Promise<CattlePurchase> => {
      return apiRequest<CattlePurchase>(`/lots/${id}`);
    },

    create: async (data: Omit<CattlePurchase, 'id' | 'createdAt' | 'updatedAt'>): Promise<CattlePurchase> => {
      return apiRequest<CattlePurchase>('/lots', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<CattlePurchase>): Promise<CattlePurchase> => {
      return apiRequest<CattlePurchase>(`/lots/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/lots/${id}`, {
        method: 'DELETE',
      });
    },

    // Obter estatísticas do lote
    getStats: async (id: string): Promise<{
      currentWeight: number;
      currentWeightGain: number;
      dailyGainAverage: number;
      feedConversion: number;
      mortality: number;
      morbidity: number;
      projectedSlaughterDate: Date;
      estimatedRevenue: number;
      totalCosts: number;
      profitMargin: number;
    }> => {
      return apiRequest(`/lots/${id}/stats`);
    },

    // Obter custos do lote
    getCosts: async (id: string): Promise<{
      purchase: number;
      feed: number;
      health: number;
      operational: number;
      freight: number;
      other: number;
      total: number;
      costPerKg: number;
      costPerHead: number;
    }> => {
      return apiRequest(`/lots/${id}/costs`);
    },

    // Gerar número de lote
    generateNumber: async (): Promise<{ number: string }> => {
      return apiRequest<{ number: string }>('/lots/generate-number');
    },
  },

  // ===== MOVIMENTAÇÕES =====
  movements: {
    getAll: async (lotId?: string): Promise<LotMovement[]> => {
      const endpoint = lotId ? `/lot-movements?lotId=${lotId}` : '/lot-movements';
      return apiRequest<LotMovement[]>(endpoint);
    },

    getById: async (id: string): Promise<LotMovement> => {
      return apiRequest<LotMovement>(`/lot-movements/${id}`);
    },

    create: async (data: Omit<LotMovement, 'id' | 'createdAt'>): Promise<LotMovement> => {
      return apiRequest<LotMovement>('/lot-movements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Transferir animais entre currais
    transfer: async (data: {
      lotId: string;
      fromPenId: string;
      toPenId: string;
      currentQuantity: number;
      reason?: string;
    }): Promise<LotMovement> => {
      return apiRequest<LotMovement>('/lot-movements/transfer', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Registrar morte
    registerDeath: async (data: {
      lotId: string;
      penId: string;
      currentQuantity: number;
      cause: string;
      date: Date;
      observations?: string;
    }): Promise<LotMovement> => {
      return apiRequest<LotMovement>('/lot-movements/death', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // ===== PESAGENS =====
  currentWeightReadings: {
    getAll: async (lotId?: string): Promise<WeightReading[]> => {
      const endpoint = lotId ? `/currentWeight-readings?lotId=${lotId}` : '/currentWeight-readings';
      return apiRequest<WeightReading[]>(endpoint);
    },

    getById: async (id: string): Promise<WeightReading> => {
      return apiRequest<WeightReading>(`/currentWeight-readings/${id}`);
    },

    create: async (data: Omit<WeightReading, 'id' | 'createdAt'>): Promise<WeightReading> => {
      return apiRequest<WeightReading>('/currentWeight-readings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<WeightReading>): Promise<WeightReading> => {
      return apiRequest<WeightReading>(`/currentWeight-readings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/currentWeight-readings/${id}`, {
        method: 'DELETE',
      });
    },

    // Registrar pesagem em lote
    batchCreate: async (data: {
      lotId: string;
      readings: {
        animalId?: string;
        currentWeight: number;
        observations?: string;
      }[];
      date: Date;
    }): Promise<WeightReading[]> => {
      return apiRequest<WeightReading[]>('/currentWeight-readings/batch', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // ===== SAÚDE =====
  health: {
    getAll: async (lotId?: string): Promise<HealthRecord[]> => {
      const endpoint = lotId ? `/health-records?lotId=${lotId}` : '/health-records';
      return apiRequest<HealthRecord[]>(endpoint);
    },

    getById: async (id: string): Promise<HealthRecord> => {
      return apiRequest<HealthRecord>(`/health-records/${id}`);
    },

    create: async (data: Omit<HealthRecord, 'id' | 'createdAt'>): Promise<HealthRecord> => {
      return apiRequest<HealthRecord>('/health-records', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<HealthRecord>): Promise<HealthRecord> => {
      return apiRequest<HealthRecord>(`/health-records/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/health-records/${id}`, {
        method: 'DELETE',
      });
    },

    // Aplicar protocolo sanitário
    applyProtocol: async (data: {
      lotId: string;
      penId?: string;
      protocol: string;
      medications: {
        name: string;
        dose: string;
        applicationMethod: string;
      }[];
      veterinarianId?: string;
      observations?: string;
    }): Promise<HealthRecord> => {
      return apiRequest<HealthRecord>('/health-records/apply-protocol', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // ===== ALOCAÇÃO DE CURRAIS =====
  penAllocations: {
    getAll: async (): Promise<PenAllocation[]> => {
      return apiRequest<PenAllocation[]>('/pen-allocations');
    },

    getByLot: async (lotId: string): Promise<PenAllocation[]> => {
      return apiRequest<PenAllocation[]>(`/pen-allocations/lot/${lotId}`);
    },

    getByPen: async (penId: string): Promise<PenAllocation[]> => {
      return apiRequest<PenAllocation[]>(`/pen-allocations/pen/${penId}`);
    },

    allocate: async (data: {
      lotId: string;
      allocations: {
        penId: string;
        currentQuantity: number;
      }[];
    }): Promise<PenAllocation[]> => {
      return apiRequest<PenAllocation[]>('/pen-allocations/allocate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    deallocate: async (id: string): Promise<void> => {
      return apiRequest<void>(`/pen-allocations/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ===== LINKS LOTE-CURRAL =====
  lotPenLinks: {
    getAll: async (): Promise<LoteCurralLink[]> => {
      return apiRequest<LoteCurralLink[]>('/lot-pen-links');
    },

    getByLot: async (lotId: string): Promise<LoteCurralLink[]> => {
      return apiRequest<LoteCurralLink[]>(`/lot-pen-links/lot/${lotId}`);
    },

    getByPen: async (penId: string): Promise<LoteCurralLink[]> => {
      return apiRequest<LoteCurralLink[]>(`/lot-pen-links/pen/${penId}`);
    },

    create: async (data: Omit<LoteCurralLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<LoteCurralLink> => {
      return apiRequest<LoteCurralLink>('/lot-pen-links', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<LoteCurralLink>): Promise<LoteCurralLink> => {
      return apiRequest<LoteCurralLink>(`/lot-pen-links/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/lot-pen-links/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ===== MAPA DE CURRAIS =====
  penMap: {
    get: async (): Promise<PenMap> => {
      return apiRequest<PenMap>('/pen-map');
    },

    getOccupancy: async (): Promise<{
      totalCapacity: number;
      currentOccupancy: number;
      occupancyRate: number;
      availablePens: number;
      occupiedPens: number;
      maintenancePens: number;
      quarantinePens: number;
    }> => {
      return apiRequest('/pen-map/occupancy');
    },

    getPenDetails: async (penId: string): Promise<{
      pen: any;
      lots: any[];
      movements: any[];
      healthRecords: any[];
      feedRecords: any[];
    }> => {
      return apiRequest(`/pen-map/pen/${penId}`);
    },
  },

  // ===== RELATÓRIOS DE LOTES =====
  reports: {
    // Relatório de performance zootécnica
    getPerformanceReport: async (lotId?: string): Promise<any> => {
      const endpoint = lotId ? `/lots/reports/performance?lotId=${lotId}` : '/lots/reports/performance';
      return apiRequest(endpoint);
    },

    // Relatório de custos por lote
    getCostReport: async (lotId?: string): Promise<any> => {
      const endpoint = lotId ? `/lots/reports/costs?lotId=${lotId}` : '/lots/reports/costs';
      return apiRequest(endpoint);
    },

    // Análise de mortalidade
    getMortalityAnalysis: async (period: 'week' | 'month' | 'quarter' | 'year'): Promise<any> => {
      return apiRequest(`/lots/reports/mortality?period=${period}`);
    },

    // Projeção de abate
    getSlaughterProjection: async (days: number = 30): Promise<{
      lotsReady: any[];
      projectedWeight: number;
      projectedRevenue: number;
      optimalDates: any[];
    }> => {
      return apiRequest(`/lots/reports/slaughter-projection?days=${days}`);
    },
  },
};
// Serviço para Pipeline de Compras
import { apiRequest } from './index';
import { PurchaseOrder } from '../../types';

interface PipelineStats {
  total: number;
  byStatus: {
    order: number;
    confirmed: number;
    inTransit: number;
    received: number;
    completed: number;
  };
  totalValue: number;
  totalAnimals: number;
  averagePrice: number;
}

export const pipelineService = {
  // ===== ORDENS DE COMPRA =====
  purchaseOrders: {
    getAll: async (filters?: {
      status?: string;
      cycleId?: string;
      vendorId?: string;
      startDate?: Date;
      endDate?: Date;
    }): Promise<PurchaseOrder[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      const endpoint = params.toString() ? `/purchase-orders?${params}` : '/purchase-orders';
      return apiRequest<PurchaseOrder[]>(endpoint);
    },

    getById: async (id: string): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>(`/purchase-orders/${id}`);
    },

    create: async (data: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>('/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>(`/purchase-orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/purchase-orders/${id}`, {
        method: 'DELETE',
      });
    },

    // Mover para próximo estágio
    moveToNextStage: async (id: string): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/next-stage`, {
        method: 'PATCH',
      });
    },

    // Mover para estágio anterior
    moveToPreviousStage: async (id: string): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/previous-stage`, {
        method: 'PATCH',
      });
    },

    // Confirmar ordem
    confirm: async (id: string, data?: {
      confirmedDate?: Date;
      confirmedPrice?: number;
      observations?: string;
    }): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/confirm`, {
        method: 'PATCH',
        body: JSON.stringify(data || {}),
      });
    },

    // Registrar embarque
    registerShipment: async (id: string, data: {
      shipmentDate: Date;
      estimatedArrival: Date;
      transporterId: string;
      freightCost: number;
      documents?: string[];
    }): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/shipment`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Registrar recebimento
    registerReception: async (id: string, data: {
      receptionDate: Date;
      actualQuantity: number;
      actualWeight: number;
      mortality?: number;
      observations?: string;
      penAllocations?: { penId: string; quantity: number }[];
    }): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/reception`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Finalizar ordem
    complete: async (id: string): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/complete`, {
        method: 'PATCH',
      });
    },

    // Cancelar ordem
    cancel: async (id: string, reason: string): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
    },

    // Validar pagamento
    validatePayment: async (id: string, data: {
      validated: boolean;
      paymentDate?: Date;
      paymentProof?: string;
      observations?: string;
    }): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/validate-payment`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    // Gerar código de ordem
    generateCode: async (): Promise<{ code: string }> => {
      return apiRequest<{ code: string }>('/purchase-orders/generate-code');
    },

    // Obter estatísticas
    getStats: async (cycleId?: string): Promise<PipelineStats> => {
      const endpoint = cycleId ? `/purchase-orders/stats?cycleId=${cycleId}` : '/purchase-orders/stats';
      return apiRequest<PipelineStats>(endpoint);
    },

    // Obter ordens por status
    getByStatus: async (status: string): Promise<PurchaseOrder[]> => {
      return apiRequest<PurchaseOrder[]>(`/purchase-orders/status/${status}`);
    },

    // Upload de documentos
    uploadDocument: async (id: string, file: File): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1'}/purchase-orders/${id}/documents`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      return response.json();
    },

    // Obter timeline da ordem
    getTimeline: async (id: string): Promise<{
      events: {
        id: string;
        type: string;
        description: string;
        date: Date;
        user?: string;
        data?: any;
      }[];
    }> => {
      return apiRequest(`/purchase-orders/${id}/timeline`);
    },

    // Duplicar ordem
    duplicate: async (id: string): Promise<PurchaseOrder> => {
      return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/duplicate`, {
        method: 'POST',
      });
    },

    // Obter sugestões de preço
    getPriceSuggestion: async (data: {
      vendorId?: string;
      animalType: string;
      quantity: number;
      estimatedWeight: number;
    }): Promise<{
      suggestedPrice: number;
      minPrice: number;
      maxPrice: number;
      averagePrice: number;
      lastPrice?: number;
    }> => {
      return apiRequest('/purchase-orders/price-suggestion', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // ===== RELATÓRIOS DO PIPELINE =====
  reports: {
    // Relatório de compras por período
    getPurchaseReport: async (startDate: Date, endDate: Date): Promise<any> => {
      return apiRequest(`/pipeline/reports/purchases?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    },

    // Relatório de fornecedores
    getVendorReport: async (vendorId?: string): Promise<any> => {
      const endpoint = vendorId ? `/pipeline/reports/vendors?vendorId=${vendorId}` : '/pipeline/reports/vendors';
      return apiRequest(endpoint);
    },

    // Relatório de corretores
    getBrokerReport: async (brokerId?: string): Promise<any> => {
      const endpoint = brokerId ? `/pipeline/reports/brokers?brokerId=${brokerId}` : '/pipeline/reports/brokers';
      return apiRequest(endpoint);
    },

    // Análise de preços
    getPriceAnalysis: async (period: 'week' | 'month' | 'quarter' | 'year'): Promise<any> => {
      return apiRequest(`/pipeline/reports/price-analysis?period=${period}`);
    },
  },
};
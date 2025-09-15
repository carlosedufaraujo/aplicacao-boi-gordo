import { apiClient } from './apiClient';

export interface SaleRecord {
  id: string;
  internalCode?: string | null;
  saleDate: string;
  penId?: string | null;
  purchaseId?: string | null;
  saleType: string;
  quantity: number;
  buyerId: string;
  exitWeight: number;
  carcassWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  arrobas: number;
  totalValue: number;
  deductions: number;
  netValue: number;
  paymentType: string;
  paymentDate?: string | null;
  receiverAccountId?: string | null;
  invoiceNumber?: string | null;
  contractNumber?: string | null;
  observations?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'PAID' | 'CANCELLED';
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  // Dados relacionados
  pen?: {
    id: string;
    penNumber: string;
    capacity: number;
    location?: string;
    type: string;
    status: string;
  };
  purchase?: {
    id: string;
    lotCode: string;
    currentQuantity: number;
    averageWeight: number;
  };
  buyer?: {
    id: string;
    name: string;
    type: string;
    cpfCnpj?: string;
    phone?: string;
    email?: string;
  };
  receiverAccount?: {
    id: string;
    accountName: string;
    bankName: string;
  };
}

export interface CreateSaleRecordData {
  saleDate: string;
  penId?: string;
  purchaseId?: string;
  saleType: string;
  quantity: number;
  buyerId: string;
  exitWeight: number;
  carcassWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  arrobas: number;
  totalValue: number;
  deductions?: number;
  netValue: number;
  paymentType: string;
  paymentDate?: string;
  receiverAccountId?: string;
  invoiceNumber?: string;
  contractNumber?: string;
  observations?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'PAID' | 'CANCELLED';
}

export interface UpdateSaleRecordData {
  saleDate?: string;
  penId?: string;
  purchaseId?: string;
  saleType?: string;
  quantity?: number;
  buyerId?: string;
  exitWeight?: number;
  carcassWeight?: number;
  carcassYield?: number;
  pricePerArroba?: number;
  arrobas?: number;
  totalValue?: number;
  deductions?: number;
  netValue?: number;
  paymentType?: string;
  paymentDate?: string;
  receiverAccountId?: string;
  invoiceNumber?: string;
  contractNumber?: string;
  observations?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'PAID' | 'CANCELLED';
}

export interface SaleRecordFilters {
  purchaseId?: string;
  buyerId?: string;
  cycleId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface SaleRecordStats {
  totalSales: number;
  totalQuantity: number;
  totalWeight: number;
  totalCarcassWeight: number;
  totalGrossValue: number;
  totalNetValue: number;
  averagePrice: number;
  byStatus: {
    pending: number;
    confirmed: number;
    delivered: number;
    paid: number;
    cancelled: number;
    completed: number;
  };
}

export const saleRecordsApi = {
  // Buscar todos os registros de venda
  async findAll(filters?: SaleRecordFilters): Promise<SaleRecord[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = `/sale-records${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    
    // Tratar resposta paginada se necessário
    let result = [];
    
    // A resposta vem em response.data.data que já é o objeto paginado
    if (response.data?.data?.items && Array.isArray(response.data.data.items)) {
      result = response.data.data.items;
    } else if (response.data?.items && Array.isArray(response.data.items)) {
      result = response.data.items;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      result = response.data.data;
    } else if (Array.isArray(response.data)) {
      result = response.data;
    } else {
      result = [];
    }
    
    return result;
  },

  // Buscar registro de venda por ID
  async findById(id: string): Promise<SaleRecord> {
    const response = await apiClient.get(`/sale-records/${id}`);
    return response.data.data;
  },

  // Criar novo registro de venda
  async create(recordData: CreateSaleRecordData): Promise<SaleRecord> {
    // Garantir que o status seja enviado em maiúsculo
    const data = {
      ...recordData,
      status: recordData.status?.toUpperCase() || 'PENDING'
    };
    const response = await apiClient.post('/sale-records', data);
    return response.data.data;
  },

  // Atualizar registro de venda
  async update(id: string, updates: UpdateSaleRecordData): Promise<SaleRecord> {
    // Garantir que o status seja enviado em maiúsculo se fornecido
    const data = updates.status ? {
      ...updates,
      status: updates.status.toUpperCase()
    } : updates;
    const response = await apiClient.put(`/sale-records/${id}`, data);
    return response.data.data;
  },

  // Excluir registro de venda
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/sale-records/${id}`);
  },

  // Buscar estatísticas
  async getStats(): Promise<SaleRecordStats> {
    const response = await apiClient.get('/sale-records/stats');
    return response.data.data;
  }
};

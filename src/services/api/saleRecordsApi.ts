import { apiClient } from './apiClient';

export interface SaleRecord {
  id: string;
  lotId: string;
  slaughterhouseId: string;
  saleDate: string;
  animalType: 'male' | 'female';
  quantity: number;
  totalWeight: number;
  pricePerArroba: number;
  grossRevenue: number;
  netProfit: number;
  profitMargin: number;
  paymentType: 'cash' | 'installment';
  paymentDate?: string;
  commonAnimals: number;
  chinaAnimals: number;
  angusAnimals: number;
  observations?: string;
  reconciled?: boolean;
  createdAt: string;
  updatedAt: string;
  // Dados relacionados
  lot?: {
    id: string;
    lotNumber: string;
    currentQuantity: number;
    status: string;
  };
  slaughterhouse?: {
    id: string;
    name: string;
    type: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateSaleRecordData {
  lotId: string;
  slaughterhouseId: string;
  saleDate: string;
  animalType: 'male' | 'female';
  quantity: number;
  totalWeight: number;
  pricePerArroba: number;
  paymentType: 'cash' | 'installment';
  paymentDate?: string;
  commonAnimals: number;
  chinaAnimals: number;
  angusAnimals: number;
  observations?: string;
}

export interface UpdateSaleRecordData {
  saleDate?: string;
  animalType?: 'male' | 'female';
  quantity?: number;
  totalWeight?: number;
  pricePerArroba?: number;
  paymentType?: 'cash' | 'installment';
  paymentDate?: string;
  commonAnimals?: number;
  chinaAnimals?: number;
  angusAnimals?: number;
  observations?: string;
  reconciled?: boolean;
}

export interface SaleRecordFilters {
  lotId?: string;
  slaughterhouseId?: string;
  animalType?: string;
  paymentType?: string;
  reconciled?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface SaleRecordStats {
  totalRecords: number;
  totalRevenue: number;
  totalProfit: number;
  averageMargin: number;
  byAnimalType: {
    type: string;
    count: number;
    revenue: number;
  }[];
  byPaymentType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  recentRecords: number;
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
    return response.data.data;
  },

  // Buscar registro de venda por ID
  async findById(id: string): Promise<SaleRecord> {
    const response = await apiClient.get(`/sale-records/${id}`);
    return response.data.data;
  },

  // Criar novo registro de venda
  async create(recordData: CreateSaleRecordData): Promise<SaleRecord> {
    const response = await apiClient.post('/sale-records', recordData);
    return response.data.data;
  },

  // Atualizar registro de venda
  async update(id: string, updates: UpdateSaleRecordData): Promise<SaleRecord> {
    const response = await apiClient.put(`/sale-records/${id}`, updates);
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

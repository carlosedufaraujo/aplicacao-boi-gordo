import { apiClient } from './apiClient';

export interface Sale {
  id: string;
  saleNumber: string;
  lotId: string;
  buyerId: string;
  designationDate: string;
  slaughterPlant: string;
  expectedDate: string;
  shipmentDate?: string;
  shipmentWeight?: number;
  transportCompany?: string;
  slaughterDate?: string;
  slaughterWeight?: number;
  carcassYield?: number;
  pricePerArroba?: number;
  totalValue?: number;
  invoiceNumber?: string;
  paymentDate?: string;
  status: 'NEXT_SLAUGHTER' | 'SCHEDULED' | 'SHIPPED' | 'SLAUGHTERED' | 'RECONCILED' | 'CANCELLED';
  userId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Dados relacionados
  buyer?: {
    id: string;
    name: string;
    type: string;
    email?: string;
    phone?: string;
  };
  lot?: {
    id: string;
    lotNumber: string;
    currentQuantity: number;
    status: string;
  };
}

export interface CreateSaleData {
  lotId: string;
  buyerId: string;
  designationDate: string;
  slaughterPlant: string;
  expectedDate: string;
  pricePerArroba?: number;
  notes?: string;
}

export interface UpdateSaleData {
  designationDate?: string;
  slaughterPlant?: string;
  expectedDate?: string;
  shipmentDate?: string;
  shipmentWeight?: number;
  transportCompany?: string;
  slaughterDate?: string;
  slaughterWeight?: number;
  carcassYield?: number;
  pricePerArroba?: number;
  totalValue?: number;
  invoiceNumber?: string;
  paymentDate?: string;
  status?: 'NEXT_SLAUGHTER' | 'SCHEDULED' | 'SHIPPED' | 'SLAUGHTERED' | 'RECONCILED' | 'CANCELLED';
  notes?: string;
}

export interface SaleFilters {
  status?: string;
  buyerId?: string;
  lotId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface SaleStats {
  totalSales: number;
  totalValue: number;
  averageValue: number;
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  recentSales: number;
}

export const salesApi = {
  // Buscar todas as vendas
  async findAll(filters?: SaleFilters): Promise<Sale[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value);
        }
      });
    }

    const queryString = params.toString();
    const url = `/sales${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.data.data;
  },

  // Buscar venda por ID
  async findById(id: string): Promise<Sale> {
    const response = await apiClient.get(`/sales/${id}`);
    return response.data.data;
  },

  // Criar nova venda
  async create(saleData: CreateSaleData): Promise<Sale> {
    const response = await apiClient.post('/sales', saleData);
    return response.data.data;
  },

  // Atualizar venda
  async update(id: string, updates: UpdateSaleData): Promise<Sale> {
    const response = await apiClient.put(`/sales/${id}`, updates);
    return response.data.data;
  },

  // Excluir venda
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/sales/${id}`);
  },

  // Buscar estatísticas
  async getStats(): Promise<SaleStats> {
    const response = await apiClient.get('/sales/stats');
    return response.data.data;
  }
};

import { apiClient } from './apiClient';

export interface Revenue {
  id: string;
  description: string;
  value: number;
  receivedDate: string;
  categoryId: string;
  payerAccountId: string;
  saleRecordId?: string;
  notes?: string;
  isReceived: boolean;
  receivedValue?: number;
  status: 'PENDING' | 'RECEIVED' | 'OVERDUE' | 'CANCELLED';
  userId: string;
  createdAt: string;
  updatedAt: string;
  category?: any;
  payerAccount?: any;
  saleRecord?: any;
}

export interface CreateRevenueData {
  description: string;
  value: number;
  receivedDate: string;
  categoryId: string;
  payerAccountId: string;
  saleRecordId?: string;
  notes?: string;
  isReceived?: boolean;
  receivedValue?: number;
}

export interface UpdateRevenueData extends Partial<CreateRevenueData> {
  status?: 'PENDING' | 'RECEIVED' | 'OVERDUE' | 'CANCELLED';
}

export interface RevenueFilters {
  status?: string;
  categoryId?: string;
  payerAccountId?: string;
  saleRecordId?: string;
  startDate?: string;
  endDate?: string;
  isReceived?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RevenueStats {
  total: number;
  pending: number;
  received: number;
  overdue: number;
  cancelled: number;
  totalValue: number;
  receivedValue: number;
  pendingValue: number;
  overdueValue: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const revenueApi = {
  /**
   * Lista todas as receitas com filtros
   */
  async getAll(filters: RevenueFilters = {}): Promise<ApiResponse<Revenue[]>> {
    const response = await apiClient.get('/revenues', filters);
    return response;
  },

  /**
   * Busca uma receita por ID
   */
  async getById(id: string): Promise<ApiResponse<Revenue>> {
    const response = await apiClient.get(`/revenues/${id}`);
    return response;
  },

  /**
   * Busca receitas por status
   */
  async getByStatus(status: string): Promise<ApiResponse<Revenue[]>> {
    const response = await apiClient.get(`/revenues/status/${status}`);
    return response;
  },

  /**
   * Busca receitas por categoria
   */
  async getByCategory(categoryId: string): Promise<ApiResponse<Revenue[]>> {
    const response = await apiClient.get(`/revenues/category/${categoryId}`);
    return response;
  },

  /**
   * Busca receitas por registro de venda
   */
  async getBySaleRecord(saleRecordId: string): Promise<ApiResponse<Revenue[]>> {
    const response = await apiClient.get(`/revenues/sale-record/${saleRecordId}`);
    return response;
  },

  /**
   * Cria uma nova receita
   */
  async create(data: CreateRevenueData): Promise<ApiResponse<Revenue>> {
    const response = await apiClient.post('/revenues', data);
    return response;
  },

  /**
   * Atualiza uma receita
   */
  async update(id: string, data: UpdateRevenueData): Promise<ApiResponse<Revenue>> {
    const response = await apiClient.put(`/revenues/${id}`, data);
    return response;
  },

  /**
   * Marca uma receita como recebida
   */
  async markAsReceived(id: string, receivedValue?: number, receivedDate?: string): Promise<ApiResponse<Revenue>> {
    const response = await apiClient.patch(`/revenues/${id}/receive`, {
      receivedValue,
      receivedDate
    });
    return response;
  },

  /**
   * Remove uma receita
   */
  async remove(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/revenues/${id}`);
    return response;
  },

  /**
   * Retorna estatísticas das receitas
   */
  async getStats(): Promise<ApiResponse<RevenueStats>> {
    const response = await apiClient.get('/revenues/stats');
    return response;
  }
};

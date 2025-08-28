import { apiClient } from './apiClient';

export interface PayerAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  agency: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  balance: number;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayerAccountData {
  accountName: string;
  bankName: string;
  accountNumber: string;
  agency: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  balance: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdatePayerAccountData extends Partial<CreatePayerAccountData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export interface PayerAccountFilters {
  status?: string;
  accountType?: string;
  bankName?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PayerAccountStats {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
  checking: number;
  savings: number;
  investment: number;
  totalBalance: number;
  activeBalance: number;
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

export const payerAccountApi = {
  /**
   * Lista todas as contas pagadoras com filtros
   */
  async getAll(filters: PayerAccountFilters = {}): Promise<ApiResponse<PayerAccount[]>> {
    const response = await apiClient.get('/payer-accounts', { params: filters });
    return response.data;
  },

  /**
   * Busca uma conta pagadora por ID
   */
  async getById(id: string): Promise<ApiResponse<PayerAccount>> {
    const response = await apiClient.get(`/payer-accounts/${id}`);
    return response.data;
  },

  /**
   * Busca contas por status
   */
  async getByStatus(status: string): Promise<ApiResponse<PayerAccount[]>> {
    const response = await apiClient.get(`/payer-accounts/status/${status}`);
    return response.data;
  },

  /**
   * Busca contas por tipo
   */
  async getByType(accountType: string): Promise<ApiResponse<PayerAccount[]>> {
    const response = await apiClient.get(`/payer-accounts/type/${accountType}`);
    return response.data;
  },

  /**
   * Busca apenas contas ativas
   */
  async getActive(): Promise<ApiResponse<PayerAccount[]>> {
    const response = await apiClient.get('/payer-accounts/active');
    return response.data;
  },

  /**
   * Cria uma nova conta pagadora
   */
  async create(data: CreatePayerAccountData): Promise<ApiResponse<PayerAccount>> {
    const response = await apiClient.post('/payer-accounts', data);
    return response.data;
  },

  /**
   * Atualiza uma conta pagadora
   */
  async update(id: string, data: UpdatePayerAccountData): Promise<ApiResponse<PayerAccount>> {
    const response = await apiClient.put(`/payer-accounts/${id}`, data);
    return response.data;
  },

  /**
   * Atualiza o saldo de uma conta
   */
  async updateBalance(id: string, balance: number, operation: 'ADD' | 'SUBTRACT' | 'SET'): Promise<ApiResponse<PayerAccount>> {
    const response = await apiClient.patch(`/payer-accounts/${id}/balance`, {
      balance,
      operation
    });
    return response.data;
  },

  /**
   * Ativa/desativa uma conta
   */
  async toggleStatus(id: string, isActive: boolean): Promise<ApiResponse<PayerAccount>> {
    const response = await apiClient.patch(`/payer-accounts/${id}/toggle`, {
      isActive
    });
    return response.data;
  },

  /**
   * Remove uma conta pagadora
   */
  async remove(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/payer-accounts/${id}`);
    return response.data;
  },

  /**
   * Retorna estatísticas das contas
   */
  async getStats(): Promise<ApiResponse<PayerAccountStats>> {
    const response = await apiClient.get('/payer-accounts/stats');
    return response.data;
  }
};

import { apiClient } from './apiClient';

export interface Cycle {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  targetWeight?: number;
  isActive: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCycleData {
  name: string;
  description?: string;
  startDate: string;
  expectedEndDate: string;
  targetWeight?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateCycleData extends Partial<CreateCycleData> {
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  actualEndDate?: string;
}

export interface CycleFilters {
  status?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CycleStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  overdue: number;
  averageDuration: number;
  totalTargetWeight: number;
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

export const cycleApi = {
  /**
   * Lista todos os ciclos com filtros
   */
  async getAll(filters: CycleFilters = {}): Promise<ApiResponse<Cycle[]>> {
    const response = await apiClient.get('/cycles', filters);
    return response;
  },

  /**
   * Busca um ciclo por ID
   */
  async getById(id: string): Promise<ApiResponse<Cycle>> {
    const response = await apiClient.get(`/cycles/${id}`);
    return response;
  },

  /**
   * Busca ciclos por status
   */
  async getByStatus(status: string): Promise<ApiResponse<Cycle[]>> {
    const response = await apiClient.get(`/cycles/status/${status}`);
    return response;
  },

  /**
   * Busca apenas ciclos ativos
   */
  async getActive(): Promise<ApiResponse<Cycle[]>> {
    const response = await apiClient.get('/cycles/active');
    return response;
  },

  /**
   * Busca o ciclo atual (ativo mais recente)
   */
  async getCurrent(): Promise<ApiResponse<Cycle | null>> {
    const response = await apiClient.get('/cycles/current');
    return response;
  },

  /**
   * Cria um novo ciclo
   */
  async create(data: CreateCycleData): Promise<ApiResponse<Cycle>> {
    const response = await apiClient.post('/cycles', data);
    return response;
  },

  /**
   * Atualiza um ciclo
   */
  async update(id: string, data: UpdateCycleData): Promise<ApiResponse<Cycle>> {
    const response = await apiClient.put(`/cycles/${id}`, data);
    return response;
  },

  /**
   * Completa um ciclo
   */
  async complete(id: string, actualEndDate?: string): Promise<ApiResponse<Cycle>> {
    const response = await apiClient.patch(`/cycles/${id}/complete`, {
      actualEndDate
    });
    return response;
  },

  /**
   * Cancela um ciclo
   */
  async cancel(id: string, reason?: string): Promise<ApiResponse<Cycle>> {
    const response = await apiClient.patch(`/cycles/${id}/cancel`, {
      reason
    });
    return response;
  },

  /**
   * Remove um ciclo
   */
  async remove(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/cycles/${id}`);
    return response;
  },

  /**
   * Retorna estatísticas dos ciclos
   */
  async getStats(): Promise<ApiResponse<CycleStats>> {
    const response = await apiClient.get('/cycles/stats');
    return response;
  }
};

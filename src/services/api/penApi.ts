import { apiClient } from './apiClient';

export interface Pen {
  id: string;
  penNumber: string;
  capacity: number;
  type: 'CONFINEMENT' | 'PASTURE' | 'QUARANTINE' | 'HOSPITAL';
  location: string;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PenOccupancy extends Pen {
  currentOccupation: number;
  availableCapacity: number;
  occupancyRate: number;
}

export interface CreatePenData {
  penNumber: string;
  capacity: number;
  type: 'CONFINEMENT' | 'PASTURE' | 'QUARANTINE' | 'HOSPITAL';
  location: string;
  isActive?: boolean;
  notes?: string;
}

export interface UpdatePenData extends Partial<CreatePenData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface PenFilters {
  status?: string;
  type?: string;
  location?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PenStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  confinement: number;
  pasture: number;
  quarantine: number;
  hospital: number;
  totalCapacity: number;
  averageCapacity: number;
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

export const penApi = {
  /**
   * Lista todos os currais com filtros
   */
  async getAll(filters: PenFilters = {}): Promise<ApiResponse<Pen[]>> {
    const response = await apiClient.get('/pens', { params: filters });
    return response.data;
  },

  /**
   * Busca um curral por ID
   */
  async getById(id: string): Promise<ApiResponse<Pen>> {
    const response = await apiClient.get(`/pens/${id}`);
    return response.data;
  },

  /**
   * Busca currais por tipo
   */
  async getByType(type: string): Promise<ApiResponse<Pen[]>> {
    const response = await apiClient.get(`/pens/type/${type}`);
    return response.data;
  },

  /**
   * Busca currais por status
   */
  async getByStatus(status: string): Promise<ApiResponse<Pen[]>> {
    const response = await apiClient.get(`/pens/status/${status}`);
    return response.data;
  },

  /**
   * Busca apenas currais ativos
   */
  async getActive(): Promise<ApiResponse<Pen[]>> {
    const response = await apiClient.get('/pens/active');
    return response.data;
  },

  /**
   * Busca currais disponíveis (com capacidade)
   */
  async getAvailable(): Promise<ApiResponse<Pen[]>> {
    const response = await apiClient.get('/pens/available');
    return response.data;
  },

  /**
   * Retorna ocupação atual dos currais
   */
  async getOccupancy(): Promise<ApiResponse<PenOccupancy[]>> {
    const response = await apiClient.get('/pens/occupancy');
    return response.data;
  },

  /**
   * Cria um novo curral
   */
  async create(data: CreatePenData): Promise<ApiResponse<Pen>> {
    const response = await apiClient.post('/pens', data);
    return response.data;
  },

  /**
   * Atualiza um curral
   */
  async update(id: string, data: UpdatePenData): Promise<ApiResponse<Pen>> {
    const response = await apiClient.put(`/pens/${id}`, data);
    return response.data;
  },

  /**
   * Ativa/desativa um curral
   */
  async toggleStatus(id: string, isActive: boolean): Promise<ApiResponse<Pen>> {
    const response = await apiClient.patch(`/pens/${id}/toggle`, {
      isActive
    });
    return response.data;
  },

  /**
   * Remove um curral
   */
  async remove(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/pens/${id}`);
    return response.data;
  },

  /**
   * Retorna estatísticas dos currais
   */
  async getStats(): Promise<ApiResponse<PenStats>> {
    const response = await apiClient.get('/pens/stats');
    return response.data;
  }
};

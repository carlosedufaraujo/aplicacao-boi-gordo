import { apiClient } from './apiClient';

export interface Partner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document: string;
  documentType: 'CPF' | 'CNPJ';
  partnerType: 'VENDOR' | 'BUYER' | 'BROKER' | 'TRANSPORTER';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerData {
  name: string;
  email?: string;
  phone?: string;
  document: string;
  documentType: 'CPF' | 'CNPJ';
  partnerType: 'VENDOR' | 'BUYER' | 'BROKER' | 'TRANSPORTER';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive?: boolean;
  notes?: string;
}

export interface UpdatePartnerData extends Partial<CreatePartnerData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export interface PartnerFilters {
  status?: string;
  partnerType?: string;
  documentType?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PartnerStats {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
  vendors: number;
  buyers: number;
  brokers: number;
  transporters: number;
  cpf: number;
  cnpj: number;
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

export const partnerApi = {
  /**
   * Lista todos os parceiros com filtros
   */
  async getAll(filters: PartnerFilters = {}): Promise<ApiResponse<Partner[]>> {
    const response = await apiClient.get('/partners', { params: filters });
    return response.data;
  },

  /**
   * Busca um parceiro por ID
   */
  async getById(id: string): Promise<ApiResponse<Partner>> {
    const response = await apiClient.get(`/partners/${id}`);
    return response.data;
  },

  /**
   * Busca parceiros por tipo
   */
  async getByType(partnerType: string): Promise<ApiResponse<Partner[]>> {
    const response = await apiClient.get(`/partners/type/${partnerType}`);
    return response.data;
  },

  /**
   * Busca parceiros por status
   */
  async getByStatus(status: string): Promise<ApiResponse<Partner[]>> {
    const response = await apiClient.get(`/partners/status/${status}`);
    return response.data;
  },

  /**
   * Busca apenas parceiros ativos
   */
  async getActive(): Promise<ApiResponse<Partner[]>> {
    const response = await apiClient.get('/partners/active');
    return response.data;
  },

  /**
   * Cria um novo parceiro
   */
  async create(data: CreatePartnerData): Promise<ApiResponse<Partner>> {
    const response = await apiClient.post('/partners', data);
    return response.data;
  },

  /**
   * Atualiza um parceiro
   */
  async update(id: string, data: UpdatePartnerData): Promise<ApiResponse<Partner>> {
    const response = await apiClient.put(`/partners/${id}`, data);
    return response.data;
  },

  /**
   * Ativa/desativa um parceiro
   */
  async toggleStatus(id: string, isActive: boolean): Promise<ApiResponse<Partner>> {
    const response = await apiClient.patch(`/partners/${id}/toggle`, {
      isActive
    });
    return response.data;
  },

  /**
   * Remove um parceiro
   */
  async remove(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/partners/${id}`);
    return response.data;
  },

  /**
   * Retorna estatísticas dos parceiros
   */
  async getStats(): Promise<ApiResponse<PartnerStats>> {
    const response = await apiClient.get('/partners/stats');
    return response.data;
  }
};

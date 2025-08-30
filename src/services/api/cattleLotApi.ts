import { apiClient, ApiResponse } from './apiClient';

// Interfaces para Cattle Lots
export interface CattleLot {
  id: string;
  purchaseOrderId: string;
  entryDate: string;
  currentQuantity: number;
  initialQuantity: number;
  averageWeight: number;
  breed?: string;
  origin: string;
  healthStatus: 'HEALTHY' | 'QUARANTINE' | 'SICK' | 'TREATMENT';
  status: 'ACTIVE' | 'SOLD' | 'TRANSFERRED' | 'DECEASED';
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  purchaseOrder?: any;
  penAllocations?: any[];
}

export interface CreateCattleLotData {
  purchaseOrderId: string;
  entryDate: string;
  currentQuantity: number;
  initialQuantity: number;
  averageWeight: number;
  breed?: string;
  origin: string;
  healthStatus: 'HEALTHY' | 'QUARANTINE' | 'SICK' | 'TREATMENT';
  notes?: string;
}

export interface CattleLotFilters {
  status?: string;
  healthStatus?: string;
  purchaseOrderId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CattleLotStats {
  total: number;
  active: number;
  sold: number;
  transferred: number;
  deceased: number;
  healthy: number;
  quarantine: number;
  sick: number;
  treatment: number;
  totalAnimals: number;
  initialAnimals: number;
}

export interface PenAllocation {
  penId: string;
  quantity: number;
}

/**
 * Serviço para gerenciar Cattle Lots via API Backend
 */
export class CattleLotApiService {
  private readonly endpoint = '/cattle-lots';

  /**
   * Lista todos os lotes de gado com filtros
   */
  async getAll(filters: CattleLotFilters = {}): Promise<ApiResponse<CattleLot[]>> {
    return apiClient.get<ApiResponse<CattleLot[]>>(this.endpoint, filters);
  }

  /**
   * Busca um lote de gado por ID
   */
  async getById(id: string): Promise<ApiResponse<CattleLot>> {
    return apiClient.get<ApiResponse<CattleLot>>(`${this.endpoint}/${id}`);
  }

  /**
   * Busca lotes por status
   */
  async getByStatus(status: string): Promise<ApiResponse<CattleLot[]>> {
    return apiClient.get<ApiResponse<CattleLot[]>>(`${this.endpoint}/status/${status}`);
  }

  /**
   * Busca lotes por ordem de compra
   */
  async getByPurchaseOrder(purchaseOrderId: string): Promise<ApiResponse<CattleLot[]>> {
    return apiClient.get<ApiResponse<CattleLot[]>>(`${this.endpoint}/purchase-order/${purchaseOrderId}`);
  }

  /**
   * Cria um novo lote de gado
   */
  async create(data: CreateCattleLotData): Promise<ApiResponse<CattleLot>> {
    return apiClient.post<ApiResponse<CattleLot>>(this.endpoint, data);
  }

  /**
   * Atualiza um lote de gado
   */
  async update(id: string, data: Partial<CreateCattleLotData>): Promise<ApiResponse<CattleLot>> {
    return apiClient.put<ApiResponse<CattleLot>>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Atualiza GMD e peso alvo
   */
  async updateGMD(id: string, data: { expectedGMD: number; targetWeight: number }): Promise<ApiResponse<CattleLot>> {
    return apiClient.patch<ApiResponse<CattleLot>>(`${this.endpoint}/${id}/gmd`, data);
  }

  /**
   * Aloca animais em currais
   */
  async allocateToPens(id: string, allocations: PenAllocation[]): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>(`${this.endpoint}/${id}/allocate`, { allocations });
  }

  /**
   * Remove um lote de gado
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtém estatísticas dos lotes
   */
  async getStats(): Promise<ApiResponse<CattleLotStats>> {
    return apiClient.get<ApiResponse<CattleLotStats>>(`${this.endpoint}/stats`);
  }
}

// Instância singleton do serviço
export const cattleLotApi = new CattleLotApiService();

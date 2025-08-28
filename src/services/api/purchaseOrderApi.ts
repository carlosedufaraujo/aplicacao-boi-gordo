import { apiClient, ApiResponse } from './apiClient';

// Interfaces para Purchase Orders
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  brokerId?: string;
  location: string;
  purchaseDate: string;
  animalCount: number;
  animalType: 'CATTLE' | 'BULL' | 'COW';
  averageAge?: number;
  totalWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  commission: number;
  freightCost?: number;
  otherCosts?: number;
  paymentType: 'CASH' | 'INSTALLMENT' | 'FINANCING';
  payerAccountId: string;
  principalDueDate: string;
  commissionDueDate?: string;
  otherCostsDueDate?: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  currentStage: string;
  userId: string;
  carcassWeight?: number;
  arrobas?: number;
  animalValue?: number;
  totalValue?: number;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos
  vendor?: any;
  broker?: any;
  payerAccount?: any;
  cattleLot?: any;
}

export interface CreatePurchaseOrderData {
  vendorId: string;
  brokerId?: string;
  location: string;
  purchaseDate: string;
  animalCount: number;
  animalType: 'CATTLE' | 'BULL' | 'COW';
  averageAge?: number;
  totalWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  commission: number;
  freightCost?: number;
  otherCosts?: number;
  paymentType: 'CASH' | 'INSTALLMENT' | 'FINANCING';
  payerAccountId: string;
  principalDueDate: string;
  commissionDueDate?: string;
  otherCostsDueDate?: string;
  notes?: string;
}

export interface PurchaseOrderFilters {
  status?: string;
  currentStage?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PurchaseOrderStats {
  total: number;
  pending: number;
  confirmed: number;
  inTransit: number;
  received: number;
  cancelled: number;
  totalAnimals: number;
  totalValue: number;
}

/**
 * Serviço para gerenciar Purchase Orders via API Backend
 */
export class PurchaseOrderApiService {
  private readonly endpoint = '/purchase-orders';

  /**
   * Lista todas as ordens de compra com filtros
   */
  async getAll(filters: PurchaseOrderFilters = {}): Promise<ApiResponse<PurchaseOrder[]>> {
    return apiClient.get<ApiResponse<PurchaseOrder[]>>(this.endpoint, filters);
  }

  /**
   * Busca uma ordem de compra por ID
   */
  async getById(id: string): Promise<ApiResponse<PurchaseOrder>> {
    return apiClient.get<ApiResponse<PurchaseOrder>>(`${this.endpoint}/${id}`);
  }

  /**
   * Busca ordens por status
   */
  async getByStatus(status: string): Promise<ApiResponse<PurchaseOrder[]>> {
    return apiClient.get<ApiResponse<PurchaseOrder[]>>(`${this.endpoint}/status/${status}`);
  }

  /**
   * Busca ordens por etapa
   */
  async getByStage(stage: string): Promise<ApiResponse<PurchaseOrder[]>> {
    return apiClient.get<ApiResponse<PurchaseOrder[]>>(`${this.endpoint}/stage/${stage}`);
  }

  /**
   * Cria uma nova ordem de compra
   */
  async create(data: CreatePurchaseOrderData): Promise<ApiResponse<PurchaseOrder>> {
    return apiClient.post<ApiResponse<PurchaseOrder>>(this.endpoint, data);
  }

  /**
   * Atualiza uma ordem de compra
   */
  async update(id: string, data: Partial<CreatePurchaseOrderData>): Promise<ApiResponse<PurchaseOrder>> {
    return apiClient.put<ApiResponse<PurchaseOrder>>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Atualiza apenas a etapa da ordem
   */
  async updateStage(id: string, stage: string): Promise<ApiResponse<PurchaseOrder>> {
    return apiClient.patch<ApiResponse<PurchaseOrder>>(`${this.endpoint}/${id}/stage`, { stage });
  }

  /**
   * Remove uma ordem de compra
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtém estatísticas das ordens
   */
  async getStats(): Promise<ApiResponse<PurchaseOrderStats>> {
    return apiClient.get<ApiResponse<PurchaseOrderStats>>(`${this.endpoint}/stats`);
  }
}

// Instância singleton do serviço
export const purchaseOrderApi = new PurchaseOrderApiService();

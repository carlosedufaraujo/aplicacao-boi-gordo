import { apiClient } from './apiClient';

export interface Expense {
  id: string;
  description: string;
  value?: number;
  purchaseValue?: number;
  dueDate: string;
  category?: string;
  categoryId?: string;
  costCenterId?: string;
  payerAccountId?: string;
  purchaseId?: string;
  notes?: string;
  isPaid: boolean;
  paymentDate?: string;
  paidDate?: string;
  paidValue?: number;
  impactsCashFlow?: boolean;
  lotId?: string;
  penId?: string;
  vendorId?: string;
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  userId?: string;
  createdAt: string;
  updatedAt: string;
  payerAccount?: any;
  purchaseOrder?: any;
}

export interface CreateExpenseData {
  description: string;
  value?: number;
  purchaseValue?: number;
  dueDate: string;
  category?: string;
  categoryId?: string;
  costCenterId?: string;
  payerAccountId?: string;
  purchaseId?: string;
  notes?: string;
  isPaid?: boolean;
  paidDate?: string;
  paidValue?: number;
  impactsCashFlow?: boolean;
  lotId?: string;
  penId?: string;
  vendorId?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

export interface ExpenseFilters {
  status?: string;
  categoryId?: string;
  payerAccountId?: string;
  purchaseId?: string;
  startDate?: string;
  endDate?: string;
  isPaid?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseStats {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalValue: number;
  paidValue: number;
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

export const expenseApi = {
  /**
   * Lista todas as despesas com filtros
   */
  async getAll(filters: ExpenseFilters = {}): Promise<ApiResponse<Expense[]>> {
    const response = await apiClient.get('/expenses', filters);
    return response;
  },

  /**
   * Busca uma despesa por ID
   */
  async getById(id: string): Promise<ApiResponse<Expense>> {
    const response = await apiClient.get(`/expenses/${id}`);
    return response;
  },

  /**
   * Busca despesas por status
   */
  async getByStatus(status: string): Promise<ApiResponse<Expense[]>> {
    const response = await apiClient.get(`/expenses/status/${status}`);
    return response;
  },

  /**
   * Busca despesas por categoria
   */
  async getByCategory(categoryId: string): Promise<ApiResponse<Expense[]>> {
    const response = await apiClient.get(`/expenses/category/${categoryId}`);
    return response;
  },

  /**
   * Busca despesas por ordem de compra
   */
  async getByCattlePurchase(purchaseId: string): Promise<ApiResponse<Expense[]>> {
    const response = await apiClient.get(`/expenses/purchase-order/${purchaseId}`);
    return response;
  },

  /**
   * Cria uma nova despesa
   */
  async create(data: CreateExpenseData): Promise<ApiResponse<Expense>> {
    // Map frontend field names to backend field names and remove empty values
    const mappedData: any = {
      description: data.description,
      purchaseValue: data.purchaseValue || data.value,
      dueDate: data.dueDate,
      category: data.category || data.categoryId,
      impactsCashFlow: data.impactsCashFlow !== false, // default true
    };
    
    // Add optional fields only if they have values
    if (data.costCenterId) mappedData.costCenterId = data.costCenterId;
    if (data.payerAccountId) mappedData.payerAccountId = data.payerAccountId;
    if (data.purchaseId) mappedData.purchaseId = data.purchaseId;
    if (data.notes) mappedData.notes = data.notes;
    if (data.lotId) mappedData.lotId = data.lotId;
    if (data.penId) mappedData.penId = data.penId;
    if (data.vendorId) mappedData.vendorId = data.vendorId;
    
    const response = await apiClient.post('/expenses', mappedData);
    return response;
  },

  /**
   * Atualiza uma despesa
   */
  async update(id: string, data: UpdateExpenseData): Promise<ApiResponse<Expense>> {
    // Map frontend field names to backend field names and remove empty/undefined values
    const mappedData: any = {};
    
    // Add fields only if they are defined
    if (data.description !== undefined) mappedData.description = data.description;
    if (data.purchaseValue !== undefined || data.value !== undefined) {
      mappedData.purchaseValue = data.purchaseValue || data.value;
    }
    if (data.dueDate !== undefined) mappedData.dueDate = data.dueDate;
    if (data.category !== undefined || data.categoryId !== undefined) {
      mappedData.category = data.category || data.categoryId;
    }
    if (data.costCenterId !== undefined && data.costCenterId) mappedData.costCenterId = data.costCenterId;
    if (data.payerAccountId !== undefined && data.payerAccountId) mappedData.payerAccountId = data.payerAccountId;
    if (data.purchaseId !== undefined && data.purchaseId) mappedData.purchaseId = data.purchaseId;
    if (data.notes !== undefined && data.notes) mappedData.notes = data.notes;
    if (data.impactsCashFlow !== undefined) mappedData.impactsCashFlow = data.impactsCashFlow;
    if (data.lotId !== undefined && data.lotId) mappedData.lotId = data.lotId;
    if (data.penId !== undefined && data.penId) mappedData.penId = data.penId;
    if (data.vendorId !== undefined && data.vendorId) mappedData.vendorId = data.vendorId;
    if (data.isPaid !== undefined) mappedData.isPaid = data.isPaid;
    if (data.paidDate !== undefined) mappedData.paymentDate = data.paidDate;
    
    const response = await apiClient.put(`/expenses/${id}`, mappedData);
    return response;
  },

  /**
   * Marca uma despesa como paga
   */
  async markAsPaid(id: string, paidValue?: number, paidDate?: string): Promise<ApiResponse<Expense>> {
    const response = await apiClient.patch(`/expenses/${id}/pay`, {
      paidValue,
      paidDate
    });
    return response;
  },

  /**
   * Remove uma despesa
   */
  async remove(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response;
  },

  /**
   * Retorna estatísticas das despesas
   */
  async getStats(): Promise<ApiResponse<ExpenseStats>> {
    const response = await apiClient.get('/expenses/stats');
    return response;
  }
};

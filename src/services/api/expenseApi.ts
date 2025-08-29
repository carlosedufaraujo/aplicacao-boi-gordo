import { apiClient } from './apiClient';

export interface Expense {
  id: string;
  description: string;
  value: number;
  dueDate: string;
  categoryId: string;
  payerAccountId: string;
  purchaseOrderId?: string;
  notes?: string;
  isPaid: boolean;
  paidDate?: string;
  paidValue?: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  userId: string;
  createdAt: string;
  updatedAt: string;
  category?: any;
  payerAccount?: any;
  purchaseOrder?: any;
}

export interface CreateExpenseData {
  description: string;
  value: number;
  dueDate: string;
  categoryId: string;
  payerAccountId: string;
  purchaseOrderId?: string;
  notes?: string;
  isPaid?: boolean;
  paidDate?: string;
  paidValue?: number;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

export interface ExpenseFilters {
  status?: string;
  categoryId?: string;
  payerAccountId?: string;
  purchaseOrderId?: string;
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
  async getByPurchaseOrder(purchaseOrderId: string): Promise<ApiResponse<Expense[]>> {
    const response = await apiClient.get(`/expenses/purchase-order/${purchaseOrderId}`);
    return response;
  },

  /**
   * Cria uma nova despesa
   */
  async create(data: CreateExpenseData): Promise<ApiResponse<Expense>> {
    const response = await apiClient.post('/expenses', data);
    return response;
  },

  /**
   * Atualiza uma despesa
   */
  async update(id: string, data: UpdateExpenseData): Promise<ApiResponse<Expense>> {
    const response = await apiClient.put(`/expenses/${id}`, data);
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

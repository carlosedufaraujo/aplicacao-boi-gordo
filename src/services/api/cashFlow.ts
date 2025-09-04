import api from '@/lib/api';

export interface CashFlow {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
  accountId: string;
  description: string;
  amount: number;
  date: string;
  dueDate?: string;
  paymentDate?: string;
  status: 'PENDING' | 'PAID' | 'RECEIVED' | 'CANCELLED' | 'OVERDUE';
  paymentMethod?: string;
  reference?: string;
  supplier?: string;
  notes?: string;
  attachments?: string[];
  tags?: string[];
  userId?: string;
  createdAt: string;
  updatedAt: string;
  categoryName?: string; // Agora é apenas o nome da categoria
  account?: FinancialAccount;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  parentId?: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  parent?: FinancialCategory;
  children?: FinancialCategory[];
}

export interface FinancialAccount {
  id: string;
  accountName: string; // Usando PayerAccount.accountName
  accountType: string;
  bankName?: string;
  accountNumber?: string;
  agency?: string;
  balance: number;
  initialBalance: number;
  isActive: boolean;
}

export interface CashFlowFilters {
  startDate?: string;
  endDate?: string;
  type?: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  accountId?: string;
  status?: string;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  pendingIncome: number;
  pendingExpense: number;
  paidIncome: number;
  paidExpense: number;
  balance: number;
}

class CashFlowService {
  // Cash Flow CRUD
  async create(data: Partial<CashFlow>) {
    const response = await api.post('/cash-flows', data);
    return response.data;
  }

  async findAll(filters?: CashFlowFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    const response = await api.get(`/cash-flows?${params.toString()}`);
    return response.data;
  }

  async findById(id: string) {
    const response = await api.get(`/cash-flows/${id}`);
    return response.data;
  }

  async update(id: string, data: Partial<CashFlow>) {
    const response = await api.put(`/cash-flows/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    await api.delete(`/cash-flows/${id}`);
  }

  async updateStatus(id: string, status: string, paymentDate?: string) {
    const response = await api.patch(`/cash-flows/${id}/status`, {
      status,
      paymentDate,
    });
    return response.data;
  }

  async getSummary(filters?: CashFlowFilters): Promise<CashFlowSummary> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    const response = await api.get(`/cash-flows/summary?${params.toString()}`);
    return response.data;
  }

  // Categories
  async getCategories(type?: 'INCOME' | 'EXPENSE') {
    const params = type ? `?type=${type}` : '';
    const response = await api.get(`/financial-categories${params}`);
    return response.data;
  }

  async createCategory(data: Partial<FinancialCategory>) {
    const response = await api.post('/financial-categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: Partial<FinancialCategory>) {
    const response = await api.put(`/financial-categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string) {
    await api.delete(`/financial-categories/${id}`);
  }


  // Accounts
  async getAccounts() {
    const response = await api.get('/financial-accounts');
    return response.data;
  }

  async createAccount(data: Partial<FinancialAccount>) {
    const response = await api.post('/financial-accounts', data);
    return response.data;
  }

  async updateAccount(id: string, data: Partial<FinancialAccount>) {
    const response = await api.put(`/financial-accounts/${id}`, data);
    return response.data;
  }

  async deleteAccount(id: string) {
    await api.delete(`/financial-accounts/${id}`);
  }

  async getAccountBalance(id: string) {
    const response = await api.get(`/financial-accounts/${id}/balance`);
    return response.data;
  }

  async getTotalBalance() {
    const response = await api.get('/financial-accounts/total-balance');
    return response.data;
  }

}

export default new CashFlowService();
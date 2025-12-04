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
  // Helper para extrair dados da resposta
  private extractData<T>(response: any, defaultValue: T): T {
    // Se a resposta tem formato { status: 'success', data: [...] }, extrair data
    if (response?.data?.status === 'success' && response?.data?.data !== undefined) {
      return response.data.data;
    }
    // Se response.data é o próprio objeto com status
    if (response?.status === 'success' && response?.data !== undefined) {
      return response.data;
    }
    // Fallback para formato antigo
    return response?.data || response || defaultValue;
  }

  // Cash Flow CRUD
  async create(data: Partial<CashFlow>) {
    const response = await api.post('/cash-flows', data);
    return this.extractData(response, null);
  }

  async findAll(filters?: CashFlowFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    const response = await api.get(`/cash-flows?${params.toString()}`);
    return this.extractData(response, []);
  }

  async findById(id: string) {
    const response = await api.get(`/cash-flows/${id}`);
    return this.extractData(response, null);
  }

  async update(id: string, data: Partial<CashFlow>) {
    const response = await api.put(`/cash-flows/${id}`, data);
    return this.extractData(response, null);
  }

  async delete(id: string) {
    await api.delete(`/cash-flows/${id}`);
  }

  async updateStatus(id: string, status: string, paymentDate?: string) {
    const response = await api.patch(`/cash-flows/${id}/status`, {
      status,
      paymentDate,
    });
    return this.extractData(response, null);
  }

  async getSummary(filters?: CashFlowFilters): Promise<CashFlowSummary> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    const response = await api.get(`/cash-flows/summary?${params.toString()}`);
    return this.extractData(response, {
      totalIncome: 0,
      totalExpense: 0,
      pendingIncome: 0,
      pendingExpense: 0,
      paidIncome: 0,
      paidExpense: 0,
      balance: 0,
    });
  }

  // Categories
  async getCategories(type?: 'INCOME' | 'EXPENSE') {
    const params = type ? `?type=${type}` : '';
    const response = await api.get(`/categories${params}`);
    return this.extractData(response, []);
  }

  async createCategory(data: Partial<FinancialCategory>) {
    const response = await api.post('/categories', data);
    return this.extractData(response, null);
  }

  async updateCategory(id: string, data: Partial<FinancialCategory>) {
    const response = await api.put(`/categories/${id}`, data);
    return this.extractData(response, null);
  }

  async deleteCategory(id: string) {
    await api.delete(`/categories/${id}`);
  }

  // Accounts
  async getAccounts() {
    const response = await api.get('/payer-accounts');
    return this.extractData(response, []);
  }

  async createAccount(data: Partial<FinancialAccount>) {
    const response = await api.post('/payer-accounts', data);
    return this.extractData(response, null);
  }

  async updateAccount(id: string, data: Partial<FinancialAccount>) {
    const response = await api.put(`/payer-accounts/${id}`, data);
    return this.extractData(response, null);
  }

  async deleteAccount(id: string) {
    await api.delete(`/payer-accounts/${id}`);
  }

  async getAccountBalance(id: string) {
    const response = await api.get(`/payer-accounts/${id}`);
    const account = this.extractData(response, null);
    return account?.balance || 0;
  }

  async getTotalBalance() {
    const response = await api.get('/payer-accounts');
    const accounts = this.extractData(response, []);
    return Array.isArray(accounts) 
      ? accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0)
      : 0;
  }

}

export default new CashFlowService();

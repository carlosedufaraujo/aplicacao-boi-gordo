// Financial Service
import { apiClient } from './apiClient';

interface FinancialAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: Date;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export const financialService = {
  // Accounts
  getAccounts: async (): Promise<FinancialAccount[]> => apiClient.get('/financial/accounts'),
  
  getAccountById: async (id: string): Promise<FinancialAccount> => 
    apiClient.get(`/financial/accounts/${id}`),
  
  createAccount: async (data: Partial<FinancialAccount>): Promise<FinancialAccount> => 
    apiClient.post('/financial/accounts', data),
  
  updateAccount: async (id: string, data: Partial<FinancialAccount>): Promise<FinancialAccount> => 
    apiClient.put(`/financial/accounts/${id}`, data),
  
  deleteAccount: async (id: string): Promise<void> => 
    apiClient.delete(`/financial/accounts/${id}`),
  
  // Transactions
  getTransactions: async (params?: { startDate?: string; endDate?: string; accountId?: string }): Promise<Transaction[]> => 
    apiClient.get('/financial/transactions', params),
  
  getTransactionById: async (id: string): Promise<Transaction> => 
    apiClient.get(`/financial/transactions/${id}`),
  
  createTransaction: async (data: Partial<Transaction>): Promise<Transaction> => 
    apiClient.post('/financial/transactions', data),
  
  updateTransaction: async (id: string, data: Partial<Transaction>): Promise<Transaction> => 
    apiClient.put(`/financial/transactions/${id}`, data),
  
  deleteTransaction: async (id: string): Promise<void> => 
    apiClient.delete(`/financial/transactions/${id}`),
  
  // Reports
  getBalanceSheet: async (date?: string): Promise<any> => 
    apiClient.get('/financial/reports/balance-sheet', date ? { date } : undefined),
  
  getCashFlow: async (startDate: string, endDate: string): Promise<any> => 
    apiClient.get('/financial/reports/cash-flow', { startDate, endDate }),
  
  getProfitLoss: async (startDate: string, endDate: string): Promise<any> => 
    apiClient.get('/financial/reports/profit-loss', { startDate, endDate }),
};

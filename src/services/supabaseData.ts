// Este arquivo foi migrado para usar Backend API
// Mantido apenas com tipos para compatibilidade durante a migração
// USE os serviços em /services/api/ em vez deste arquivo

import { apiClient } from './api/apiClient';
import type { SaleRecord } from '../types';

// Re-exportar tipos para compatibilidade
export type { SaleRecord } from '../types';

// ============================================================================
// TIPOS E INTERFACES (mantidos para compatibilidade)
// ============================================================================

export interface CattlePurchase {
  id: string;
  lotNumber: string;
  purchaseId: string;
  entryDate: string;
  entryWeight: number;
  entryQuantity: number;
  acquisitionCost: number;
  healthCost: number;
  feedCost: number;
  operationalCost: number;
  freightCost: number;
  otherCosts: number;
  totalCost: number;
  deathCount: number;
  currentQuantity: number;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface CattlePurchase {
  id: string;
  lotCode: string;
  vendorId: string;
  brokerId?: string;
  userId: string;
  location: string;
  purchaseDate: string;
  animalCount: number;
  animalType: 'MALE' | 'FEMALE' | 'MIXED';
  averageAge?: number;
  totalWeight: number;
  averageWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  totalValue: number;
  commission: number;
  freightCost: number;
  otherCosts: number;
  netValue: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  name: string;
  type: 'VENDOR' | 'BROKER' | 'BUYER' | 'INVESTOR' | 'SERVICE_PROVIDER' | 'OTHER';
  cpfCnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pen {
  id: string;
  number: string;
  cycleId?: string;
  capacity: number;
  currentOccupancy: number;
  occupancyRate: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  type: 'CONFINEMENT' | 'PASTURE' | 'MIXED';
  area?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  totalAnimals: number;
  totalWeight: number;
  averageWeight: number;
  mortalityRate: number;
  averageDailyGain: number;
  feedConversionRate: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  subcategory?: string;
  value: number;
  vendorId?: string;
  payerAccountId?: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  paymentDate?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Revenue {
  id: string;
  date: string;
  description: string;
  category: string;
  value: number;
  buyerId?: string;
  payerAccountId?: string;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  receiptDate?: string;
  paymentMethod?: string;
  invoiceUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayerAccount {
  id: string;
  name: string;
  type: 'BANK' | 'CASH' | 'INVESTMENT' | 'OTHER';
  bankName?: string;
  agency?: string;
  accountNumber?: string;
  balance: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  type: 'OPERATIONAL' | 'ADMINISTRATIVE' | 'FINANCIAL' | 'INVESTMENT';
  parentId?: string;
  level: number;
  path: string;
  budget?: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankStatement {
  id: string;
  payerAccountId: string;
  date: string;
  description: string;
  type: 'CREDIT' | 'DEBIT';
  value: number;
  balance: number;
  reference?: string;
  isReconciled: boolean;
  reconciledAt?: string;
  reconciledBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialReconciliation {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  payerAccountId: string;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  reconciledItems: number;
  pendingItems: number;
  discrepancies: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
  reconciledBy?: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SERVIÇO DE DADOS MIGRADO
// ============================================================================

class DataService {
  private logDeprecation(method: string) {
  }

  // Métodos mantidos para compatibilidade, mas redirecionam para API backend
  async getCattlePurchases(): Promise<CattlePurchase[]> {
    this.logDeprecation('getCattlePurchases');
    const response = await apiClient.get('/cattle-lots');
    return response.data || [];
  }

  async createCattlePurchase(lot: Omit<CattlePurchase, 'id' | 'createdAt' | 'updatedAt'>): Promise<CattlePurchase> {
    this.logDeprecation('createCattlePurchase');
    const response = await apiClient.post('/cattle-lots', lot);
    return response;
  }

  async updateCattlePurchase(id: string, updates: Partial<CattlePurchase>): Promise<CattlePurchase> {
    this.logDeprecation('updateCattlePurchase');
    const response = await apiClient.put(`/cattle-lots/${id}`, updates);
    return response;
  }

  async deleteCattlePurchase(id: string): Promise<void> {
    this.logDeprecation('deleteCattlePurchase');
    await apiClient.delete(`/cattle-lots/${id}`);
  }

  // Outros métodos seguem o mesmo padrão...
  async getCattlePurchases(): Promise<CattlePurchase[]> {
    this.logDeprecation('getCattlePurchases');
    const response = await apiClient.get('/purchase-orders');
    return response.data || [];
  }

  async getPartners(): Promise<Partner[]> {
    this.logDeprecation('getPartners');
    const response = await apiClient.get('/partners');
    return response.data || [];
  }

  async getPens(): Promise<Pen[]> {
    this.logDeprecation('getPens');
    const response = await apiClient.get('/pens');
    return response.data || [];
  }

  async getExpenses(): Promise<Expense[]> {
    this.logDeprecation('getExpenses');
    const response = await apiClient.get('/expenses');
    return response.data || [];
  }

  async getRevenues(): Promise<Revenue[]> {
    this.logDeprecation('getRevenues');
    const response = await apiClient.get('/revenues');
    return response.data || [];
  }

  async getPayerAccounts(): Promise<PayerAccount[]> {
    this.logDeprecation('getPayerAccounts');
    const response = await apiClient.get('/payer-accounts');
    return response.data || [];
  }
}

export const dataService = new DataService();

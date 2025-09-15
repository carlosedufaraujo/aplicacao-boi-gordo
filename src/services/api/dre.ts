// DRE (Demonstração do Resultado do Exercício) Service
import { apiClient } from './apiClient';

interface DREData {
  id?: string;
  period: string;
  startDate: string;
  endDate: string;
  revenue: number;
  costs: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingProfit: number;
  financialExpenses: number;
  netProfit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DRECategory {
  category: string;
  subcategory?: string;
  value: number;
  percentage?: number;
}

export const dreService = {
  // Get DRE for a specific period
  getByPeriod: async (startDate: string, endDate: string): Promise<DREData> => 
    apiClient.get('/dre', { startDate, endDate }),
  
  // Get historical DRE data
  getHistory: async (limit?: number): Promise<DREData[]> => 
    apiClient.get('/dre/history', limit ? { limit } : undefined),
  
  // Get DRE by ID
  getById: async (id: string): Promise<DREData> => 
    apiClient.get(`/dre/${id}`),
  
  // Generate new DRE
  generate: async (startDate: string, endDate: string): Promise<DREData> => 
    apiClient.post('/dre/generate', { startDate, endDate }),
  
  // Get detailed breakdown by category
  getBreakdown: async (startDate: string, endDate: string): Promise<DRECategory[]> => 
    apiClient.get('/dre/breakdown', { startDate, endDate }),
  
  // Compare DRE periods
  compare: async (period1Start: string, period1End: string, period2Start: string, period2End: string): Promise<any> => 
    apiClient.post('/dre/compare', {
      period1: { startDate: period1Start, endDate: period1End },
      period2: { startDate: period2Start, endDate: period2End }
    }),
  
  // Export DRE to PDF or Excel
  export: async (id: string, format: 'pdf' | 'excel'): Promise<Blob> => 
    apiClient.get(`/dre/${id}/export`, { format }),
  
  // Get revenue analysis
  getRevenueAnalysis: async (startDate: string, endDate: string): Promise<any> => 
    apiClient.get('/dre/revenue-analysis', { startDate, endDate }),
  
  // Get cost analysis
  getCostAnalysis: async (startDate: string, endDate: string): Promise<any> => 
    apiClient.get('/dre/cost-analysis', { startDate, endDate }),
  
  // Get profit margin analysis
  getProfitMargins: async (startDate: string, endDate: string): Promise<any> => 
    apiClient.get('/dre/profit-margins', { startDate, endDate }),
};

// Serviço para Relatórios Gerais
import { apiRequest } from './index';

export const reportsService = {
  // Relatórios operacionais
  getOperationalReport: async (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => 
    apiRequest(`/reports/operational?period=${period}`),
  
  // Relatórios financeiros
  getFinancialReport: async (startDate: Date, endDate: Date) => 
    apiRequest(`/reports/financial?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
  
  // Relatórios zootécnicos
  getZootechnicalReport: async (lotId?: string) => {
    const endpoint = lotId ? `/reports/zootechnical?lotId=${lotId}` : '/reports/zootechnical';
    return apiRequest(endpoint);
  },
  
  // Relatórios de performance
  getPerformanceReport: async (type: 'lots' | 'pens' | 'vendors' | 'overall') => 
    apiRequest(`/reports/performance?type=${type}`),
  
  // Relatórios personalizados
  generateCustomReport: async (config: {
    name: string;
    type: string;
    filters: any;
    columns: string[];
    groupBy?: string;
    orderBy?: string;
  }) => apiRequest('/reports/custom', { method: 'POST', body: JSON.stringify(config) }),
  
  // Histórico de relatórios
  getHistory: async () => apiRequest('/reports/history'),
  
  // Download de relatório
  download: async (id: string, format: 'pdf' | 'excel' | 'csv' = 'pdf'): Promise<Blob> => {
    const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api/v1' : 'http://localhost:3001/api/v1');
    const response = await fetch(
      `${apiUrl}/reports/${id}/download?format=${format}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      }
    );
    
    if (!response.ok) throw new Error('Failed to download report');
    return response.blob();
  },
  
  // Agendar relatório
  schedule: async (config: {
    reportType: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    parameters: any;
    recipients: string[];
  }) => apiRequest('/reports/schedule', { method: 'POST', body: JSON.stringify(config) }),
  
  // Templates de relatórios
  getTemplates: async () => apiRequest('/reports/templates'),
  
  saveTemplate: async (template: { name: string; config: any }) => 
    apiRequest('/reports/templates', { method: 'POST', body: JSON.stringify(template) }),
};

// Serviço para DRE (Demonstrativo de Resultados)
import { apiRequest } from './index';

export const dreService = {
  generate: async (params: {
    startDate: Date;
    endDate: Date;
    entityType?: 'LOT' | 'PEN' | 'GLOBAL';
    entityId?: string;
  }) => apiRequest('/reports/dre', { method: 'POST', body: JSON.stringify(params) }),

  getHistory: async () => apiRequest('/reports/dre/history'),
  
  compare: async (periods: { startDate: Date; endDate: Date }[]) => 
    apiRequest('/reports/dre/compare', { method: 'POST', body: JSON.stringify({ periods }) }),
  
  export: async (id: string, format: 'pdf' | 'excel') => 
    apiRequest(`/reports/dre/${id}/export?format=${format}`),
};
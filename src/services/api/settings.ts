// Serviço para Configurações do Sistema
import { apiRequest } from './index';

export const settingsService = {
  getAll: async () => apiRequest('/settings'),
  
  get: async (key: string) => apiRequest(`/settings/${key}`),
  
  update: async (key: string, value: any) => 
    apiRequest(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  
  getSystemInfo: async () => apiRequest('/settings/system-info'),
  
  getBackupStatus: async () => apiRequest('/settings/backup-status'),
  
  createBackup: async () => apiRequest('/settings/backup', { method: 'POST' }),
  
  restoreBackup: async (backupId: string) => 
    apiRequest(`/settings/restore/${backupId}`, { method: 'POST' }),
  
  getLogs: async (level?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (limit) params.append('limit', limit.toString());
    return apiRequest(`/settings/logs?${params}`);
  },
  
  clearCache: async () => apiRequest('/settings/cache/clear', { method: 'POST' }),
  
  getIntegrations: async () => apiRequest('/settings/integrations'),
  
  updateIntegration: async (id: string, config: any) => 
    apiRequest(`/settings/integrations/${id}`, { method: 'PUT', body: JSON.stringify(config) }),
};
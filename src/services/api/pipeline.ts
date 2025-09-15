// Pipeline Service
import { apiClient } from './apiClient';

export const pipelineService = {
  getAll: async (): Promise<any[]> => apiClient.get('/pipeline'),
  
  getById: async (id: string): Promise<any> => apiClient.get(`/pipeline/${id}`),
  
  create: async (data: any): Promise<any> => 
    apiClient.post('/pipeline', data),
  
  update: async (id: string, data: any): Promise<any> => 
    apiClient.put(`/pipeline/${id}`, data),
  
  delete: async (id: string): Promise<void> => 
    apiClient.delete(`/pipeline/${id}`),
};

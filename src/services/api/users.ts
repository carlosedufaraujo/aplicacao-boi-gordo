// Serviço para Gerenciamento de Usuários
import { apiRequest } from './index';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export const usersService = {
  getAll: async (): Promise<User[]> => apiRequest('/users'),
  
  getById: async (id: string): Promise<User> => apiRequest(`/users/${id}`),
  
  create: async (data: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<User> => 
    apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),
  
  update: async (id: string, data: Partial<User>): Promise<User> => 
    apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: async (id: string): Promise<void> => 
    apiRequest(`/users/${id}`, { method: 'DELETE' }),
  
  activate: async (id: string): Promise<User> => 
    apiRequest(`/users/${id}/activate`, { method: 'PATCH' }),
  
  deactivate: async (id: string): Promise<User> => 
    apiRequest(`/users/${id}/deactivate`, { method: 'PATCH' }),
  
  resetPassword: async (id: string): Promise<{ temporaryPassword: string }> => 
    apiRequest(`/users/${id}/reset-password`, { method: 'POST' }),
  
  updateRole: async (id: string, role: string): Promise<User> => 
    apiRequest(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  
  getPermissions: async (id: string): Promise<string[]> => 
    apiRequest(`/users/${id}/permissions`),
  
  updatePermissions: async (id: string, permissions: string[]): Promise<void> => 
    apiRequest(`/users/${id}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) }),
  
  getActivity: async (id: string, days: number = 30): Promise<any> => 
    apiRequest(`/users/${id}/activity?days=${days}`),
};
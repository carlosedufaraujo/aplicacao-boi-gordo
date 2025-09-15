// Serviço para Gerenciamento de Usuários
import { apiClient } from './apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role?: string;
}

export const usersService = {
  getAll: async (): Promise<User[]> => apiClient.get('/users'),
  
  getById: async (id: string): Promise<User> => apiClient.get(`/users/${id}`),
  
  create: async (data: CreateUserData): Promise<User> => 
    apiClient.post('/users', data),
  
  update: async (id: string, data: Partial<User>): Promise<User> => 
    apiClient.put(`/users/${id}`, data),
  
  delete: async (id: string): Promise<void> => 
    apiClient.delete(`/users/${id}`),
  
  activate: async (id: string): Promise<User> => 
    apiClient.patch(`/users/${id}/activate`),
  
  deactivate: async (id: string): Promise<User> => 
    apiClient.patch(`/users/${id}/deactivate`),
  
  resetPassword: async (id: string): Promise<{ temporaryPassword: string }> => 
    apiClient.post(`/users/${id}/reset-password`),
  
  updateRole: async (id: string, role: string): Promise<User> => 
    apiClient.patch(`/users/${id}/role`, { role }),
  
  getPermissions: async (id: string): Promise<string[]> => 
    apiClient.get(`/users/${id}/permissions`),
  
  updatePermissions: async (id: string, permissions: string[]): Promise<void> => 
    apiClient.put(`/users/${id}/permissions`, { permissions }),
  
  getActivity: async (id: string, days: number = 30): Promise<any> => 
    apiClient.get(`/users/${id}/activity`, { days }),
};

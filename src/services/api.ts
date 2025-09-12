// Serviço de API para conectar com o backend
import { backendAuth } from './backendAuth';

const API_BASE_URL = 'http://localhost:3001/api/v1';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      // Obter headers de autenticação
      const authHeaders = backendAuth.getAuthHeader();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    // Health check está na raiz, não no /api/v1
    const response = await fetch('http://localhost:3001/health');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Estatísticas
  async getStats() {
    return this.request('/stats');
  }

  // Lotes de gado
  async getCattlePurchases() {
    return this.request('/cattle-lots');
  }

  // Dados para o frontend
  async getFrontendData() {
    return this.request('/frontend-data');
  }

  // Criar lote (quando implementarmos)
  async createCattlePurchase(data: any) {
    return this.request('/cattle-lots-simple', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Métodos genéricos para compatibilidade
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();
export const api = apiService; // Alias para compatibilidade
export default apiService;

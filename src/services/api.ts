// Serviço de API para conectar com o backend
const API_BASE_URL = 'http://localhost:3002/api/v1';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
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
    const response = await fetch('http://localhost:3002/health');
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
}

export const apiService = new ApiService();
export default apiService;

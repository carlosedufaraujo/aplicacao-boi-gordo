/**
 * Cliente API para comunicação com o Backend
 * Usa autenticação JWT própria via localStorage
 */
export class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
  }

  /**
   * Obtém o token de autenticação do Backend (localStorage)
   */
  private async getAuthToken(): Promise<string | null> {
    return localStorage.getItem('authToken');
  }

  /**
   * Executa uma requisição HTTP com fallback para Supabase
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseURL}${endpoint}`;
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      // Debug detalhado
      console.group(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
      console.log('Full URL:', url);
      console.log('Headers:', config.headers);
      console.log('Token available:', !!token);
      console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'None');
      if (config.body) {
        try {
          console.log('Body:', JSON.parse(config.body as string));
        } catch {
          console.log('Body (raw):', config.body);
        }
      }
      console.groupEnd();

      const response = await fetch(url, config);

      if (!response.ok) {
        console.group(`❌ Backend Error Response`);
        console.error(`Status: ${response.status} ${response.statusText}`);
        console.error(`URL: ${url}`);
        
        const errorData = await response.json().catch(() => ({}));
        console.error('Error Data:', errorData);
        console.groupEnd();
        
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Response for ${endpoint}:`, data);
      return data;
    } catch (error) {
      // Se backend não estiver disponível, usar Supabase direto como fallback
      console.group(`❌ Network Error for ${endpoint}`);
      console.warn(`⚠️ Backend indisponível para ${endpoint}, usando Supabase direto`);
      console.error('Error details:', error);
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : error);
      console.error('Request URL:', `${this.baseURL}${endpoint}`);
      console.error('Request method:', options.method || 'GET');
      console.groupEnd();
      throw error; // Os hooks vão usar dados do Supabase como fallback
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    // If the endpoint already has query parameters, don't process params
    if (endpoint.includes('?') && params) {
      console.warn('Endpoint already contains query parameters, ignoring params object');
      return this.request<T>(endpoint);
    }
    
    // Build query string from params if provided
    if (params) {
      const url = new URL(`${this.baseURL}${endpoint}`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
      return this.request<T>(endpoint + url.search);
    }

    return this.request<T>(endpoint);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Instância singleton do cliente API
export const apiClient = new ApiClient();
export const api = apiClient; // Alias para compatibilidade

// Tipos para as respostas da API
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  status: 'error';
  message: string;
  statusCode: number;
  stack?: string;
}

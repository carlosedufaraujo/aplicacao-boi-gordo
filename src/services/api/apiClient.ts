/**
 * Função utilitária para extrair dados de resposta de forma segura
 */
export function safeExtractData<T>(response: any, fallback: T): T {
  if (response && response.data !== null && response.data !== undefined) {
    return response.data;
  }
  return fallback;
}

import { safeLocalStorage, isSafari, getSafariCompatibleHeaders } from '@/utils/safariCompatibility';

/**
 * Cliente API para comunicação com o Backend
 * Usa autenticação JWT própria via localStorage (com fallback para Safari)
 */
export class ApiClient {
  private baseURL: string;

  constructor() {
    // Priorizar variável de ambiente (Cloudflare Pages)
    if (import.meta.env.VITE_API_URL) {
      this.baseURL = import.meta.env.VITE_API_URL;
    } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // Em produção (Cloudflare Pages), usar a URL relativa com /api/v1
      this.baseURL = window.location.origin + '/api/v1';
    } else {
      // Em desenvolvimento, usar localhost
      this.baseURL = 'http://localhost:3001/api/v1';
    }
  }

  /**
   * Obtém o token de autenticação do Backend (localStorage com fallback Safari)
   */
  private async getAuthToken(): Promise<string | null> {
    return safeLocalStorage.getItem('authToken');
  }

  /**
   * Verifica se o usuário está autenticado
   */
  private isAuthenticated(): boolean {
    const token = safeLocalStorage.getItem('authToken');
    const user = safeLocalStorage.getItem('user');
    return !!(token && user);
  }

  /**
   * Executa uma requisição HTTP com fallback para Supabase
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const startTime = performance.now();
    const method = (options.method || 'GET').toUpperCase();
    
    try {
      // Verificar se precisa de autenticação (endpoints públicos não precisam)
      const publicEndpoints = [
        '/auth/login', '/auth/register', '/auth/verify-token',
        '/cattle-purchases', '/expenses', '/revenues', '/partners', 
        '/sale-records', '/interventions', '/stats', '/health'
      ];
      const isPublicEndpoint = publicEndpoints.some(ep => endpoint.includes(ep));

      const token = await this.getAuthToken();

      // Se não há token e não é endpoint público, fazer requisição sem token
      if (!token && !isPublicEndpoint) {
        console.warn(`[ApiClient] Requisição não autenticada para: ${endpoint}`);
      }

      const url = `${this.baseURL}${endpoint}`;

      const config: RequestInit = {
        headers: {
          ...getSafariCompatibleHeaders({
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          }),
        },
        credentials: 'include', // Importante para Safari
        ...options,
      };

      const response = await fetch(url, config);
      
      // Medir tempo de resposta
      const responseTime = performance.now() - startTime;
      
      // Log de performance para requisições lentas (>500ms)
      if (responseTime > 500) {
        console.warn(`[ApiClient] ⚠️ Requisição lenta: ${method} ${endpoint} - ${responseTime.toFixed(2)}ms`);
      } else if (process.env.NODE_ENV === 'development') {
        console.debug(`[ApiClient] ✅ ${method} ${endpoint} - ${responseTime.toFixed(2)}ms`);
      }
      
      // Adicionar header de performance se disponível
      if (response.headers) {
        const serverTiming = response.headers.get('Server-Timing');
        if (serverTiming) {
          console.debug(`[ApiClient] Server-Timing: ${serverTiming}`);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Se erro for de autenticação (401) em requisição GET, retornar array vazio
        // Isso evita erros quando o usuário ainda não fez login
        const isGetRequest = (options.method || 'GET').toUpperCase() === 'GET';
        if (response.status === 401 && isGetRequest) {
          console.warn(`[ApiClient] Erro 401 em GET, retornando array vazio: ${endpoint}`);
          // Retornar array vazio para GET requests com 401
          return [] as T;
        }

        // Se erro for de autenticação (401) e não for endpoint público
        if (response.status === 401 && !isPublicEndpoint) {
          console.warn(`[ApiClient] Erro 401 para endpoint não público: ${endpoint}`);
          // Para métodos não-GET, lançar erro mas com mensagem amigável
          if (!isGetRequest) {
            throw new Error('Sessão expirada. Por favor, faça login novamente.');
          }
        }

        // Para outros erros, lançar exceção normalmente
        const errorMessage = errorData.message || errorData.error || `HTTP Error: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Tentar parsear resposta JSON
      const responseText = await response.text();
      if (!responseText) {
        // Resposta vazia - retornar array vazio para GET, null para outros
        const isGetRequest = (options.method || 'GET').toUpperCase() === 'GET';
        return (isGetRequest ? [] : null) as T;
      }

      try {
        const data = JSON.parse(responseText);
        return data;
      } catch (parseError) {
        console.error(`[ApiClient] Erro ao parsear JSON de ${endpoint}:`, responseText);
        // Se não conseguir parsear, retornar array vazio para GET
        const isGetRequest = (options.method || 'GET').toUpperCase() === 'GET';
        return (isGetRequest ? [] : null) as T;
      }
    } catch (error) {
      // Se backend não estiver disponível, usar Supabase direto como fallback
      throw error; // Os hooks vão usar dados do Supabase como fallback
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    // If the endpoint already has query parameters, don't process params
    if (endpoint.includes('?') && params) {
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

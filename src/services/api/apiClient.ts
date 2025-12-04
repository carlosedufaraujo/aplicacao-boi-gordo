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
  /**
   * Obtém a URL base da API em runtime (não em build time)
   * Isso garante que window.location.origin seja usado corretamente
   */
  private getBaseURL(): string {
    // Priorizar variável de ambiente se configurada
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    // Sempre usar URL relativa do Cloudflare Pages em runtime
    if (typeof window !== 'undefined') {
      return window.location.origin + '/api/v1';
    }
    // Fallback para URL do Cloudflare Pages em build time (nunca deve chegar aqui no browser)
    return 'https://aplicacao-boi-gordo.pages.dev/api/v1';
  }

  constructor() {
    // Construtor vazio - URL é calculada em runtime via getBaseURL()
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
   * Executa uma requisição HTTP com retry automático e tratamento de erros melhorado
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 segundo
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

      const url = `${this.getBaseURL()}${endpoint}`;

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
        // Tentar ler mensagem de erro do servidor
        let errorData: any = {};
        try {
          const errorText = await response.text();
          if (errorText) {
            errorData = JSON.parse(errorText);
          }
        } catch {
          // Se não conseguir parsear, usar objeto vazio
        }

        const isGetRequest = method === 'GET';

        // Tratamento específico para erro 400 (Bad Request)
        if (response.status === 400) {
          const errorMessage = this.getErrorMessage(errorData, response.status, endpoint);
          
          // Se for erro de parsing de filtro, tentar retry apenas uma vez
          if (errorMessage.includes('parse filter') || errorMessage.includes('processar filtros')) {
            if (retryCount < 1) {
              console.warn(`[ApiClient] Erro de parsing detectado, tentando retry: ${endpoint}`);
              await this.delay(RETRY_DELAY);
              return this.request<T>(endpoint, options, retryCount + 1);
            }
          }
          
          throw new Error(errorMessage);
        }

        // Se erro for de autenticação (401) em requisição GET, retornar array vazio
        // Isso evita erros quando o usuário ainda não fez login
        if (response.status === 401 && isGetRequest) {
          console.warn(`[ApiClient] Erro 401 em GET, retornando array vazio: ${endpoint}`);
          return [] as T;
        }

        // Se erro for de autenticação (401) e não for endpoint público
        if (response.status === 401 && !isPublicEndpoint) {
          console.warn(`[ApiClient] Erro 401 para endpoint não público: ${endpoint}`);
          if (!isGetRequest) {
            throw new Error('Sessão expirada. Por favor, faça login novamente.');
          }
        }

        // Tratamento específico para erro 403 (Forbidden)
        if (response.status === 403) {
          throw new Error('Você não tem permissão para realizar esta ação.');
        }

        // Tratamento específico para erro 404 (Not Found)
        if (response.status === 404) {
          throw new Error('Recurso não encontrado.');
        }

        // Tratamento específico para erro 500+ (Server Error) - tentar retry
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          console.warn(`[ApiClient] Erro ${response.status}, tentando retry (${retryCount + 1}/${MAX_RETRIES}): ${endpoint}`);
          await this.delay(RETRY_DELAY * (retryCount + 1));
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        // Para outros erros, usar mensagem amigável
        const errorMessage = this.getErrorMessage(errorData, response.status, endpoint);
        throw new Error(errorMessage);
      }

      // Tentar parsear resposta JSON
      const responseText = await response.text();
      if (!responseText) {
        // Resposta vazia - retornar array vazio para GET, null para outros
        const isGetRequest = method === 'GET';
        return (isGetRequest ? [] : null) as T;
      }

      try {
        const data = JSON.parse(responseText);
        return data;
      } catch (parseError) {
        console.error(`[ApiClient] Erro ao parsear JSON de ${endpoint}:`, responseText);
        // Se não conseguir parsear, retornar array vazio para GET
        const isGetRequest = method === 'GET';
        return (isGetRequest ? [] : null) as T;
      }
    } catch (error: any) {
      // Se for erro de rede e ainda tiver tentativas, fazer retry
      if (
        (error.message?.includes('Failed to fetch') || 
         error.message?.includes('NetworkError') ||
         error.message?.includes('network') ||
         error.name === 'TypeError') &&
        retryCount < MAX_RETRIES
      ) {
        console.warn(`[ApiClient] Erro de rede, tentando retry (${retryCount + 1}/${MAX_RETRIES}): ${endpoint}`);
        await this.delay(RETRY_DELAY * (retryCount + 1));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      console.error(`[ApiClient] Erro na requisição ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Retorna mensagem de erro amigável baseada no status e dados do erro
   */
  private getErrorMessage(errorData: any, status: number, endpoint: string): string {
    // Se houver mensagem específica do servidor, usar ela
    if (errorData?.message) {
      // Traduzir mensagens comuns de erro
      const message = errorData.message.toLowerCase();
      
      if (message.includes('parse filter') || message.includes('failed to parse')) {
        return 'Erro ao processar filtros. Por favor, verifique os parâmetros e tente novamente.';
      }
      
      if (message.includes('invalid') || message.includes('inválid')) {
        return 'Dados inválidos. Por favor, verifique as informações e tente novamente.';
      }
      
      if (message.includes('required') || message.includes('obrigatório')) {
        return 'Campos obrigatórios não preenchidos. Por favor, verifique o formulário.';
      }
      
      // Retornar mensagem original se não houver tradução específica
      return errorData.message;
    }

    // Mensagens padrão por status code
    const statusMessages: Record<number, string> = {
      400: 'Requisição inválida. Por favor, verifique os dados e tente novamente.',
      401: 'Sessão expirada. Por favor, faça login novamente.',
      403: 'Você não tem permissão para realizar esta ação.',
      404: 'Recurso não encontrado.',
      422: 'Dados inválidos. Por favor, verifique as informações e tente novamente.',
      429: 'Muitas requisições. Por favor, aguarde um momento e tente novamente.',
      500: 'Erro interno do servidor. Por favor, tente novamente mais tarde.',
      502: 'Servidor temporariamente indisponível. Por favor, tente novamente mais tarde.',
      503: 'Serviço temporariamente indisponível. Por favor, tente novamente mais tarde.',
      504: 'Tempo limite excedido. Por favor, tente novamente.',
    };

    return statusMessages[status] || `Erro ao processar requisição (${status}). Por favor, tente novamente.`;
  }

  /**
   * Delay helper para retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      const url = new URL(`${this.getBaseURL()}${endpoint}`);
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

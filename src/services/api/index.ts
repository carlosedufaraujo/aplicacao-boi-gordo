// Serviço de API principal com integração completa
import { authService } from './auth';
import { cadastrosService } from './cadastros';
import { dashboardService } from './dashboard';
import { pipelineService } from './pipeline';
import { salesService } from './sales';
import { lotsService } from './lots';
import { financialService } from './financial';
import { dreService } from './dre';
import { calendarService } from './calendar';
import { reconciliationService } from './reconciliation';
import { settingsService } from './settings';
import { usersService } from './users';
import { reportsService } from './reports';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Configuração base para todas as requisições
export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include' as RequestCredentials,
};

// Interceptor para adicionar token de autenticação
export const addAuthHeader = (headers: HeadersInit = {}): HeadersInit => {
  const token = localStorage.getItem('authToken');
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return headers;
};

// Função genérica para requisições
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: addAuthHeader({
        'Content-Type': 'application/json',
        ...options.headers,
      }),
      credentials: apiConfig.credentials,
    });

    // Handle auth errors
    if (response.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  } catch (_error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// API Service principal
export const api = {
  // Core request methods
  get: <T>(endpoint: string, params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest<T>(`${endpoint}${queryString}`, { method: 'GET' });
  },

  post: <T>(endpoint: string, data?: any) => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T>(endpoint: string, data?: any) => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch: <T>(endpoint: string, data?: any) => {
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T>(endpoint: string) => {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  },

  // Services
  auth: authService,
  cadastros: cadastrosService,
  dashboard: dashboardService,
  pipeline: pipelineService,
  sales: salesService,
  lots: lotsService,
  financial: financialService,
  dre: dreService,
  calendar: calendarService,
  reconciliation: reconciliationService,
  settings: settingsService,
  users: usersService,
  reports: reportsService,

  // Utility methods
  healthCheck,
};

// Export individual services for direct import
export {
  authService,
  cadastrosService,
  dashboardService,
  pipelineService,
  salesService,
  lotsService,
  financialService,
  dreService,
  calendarService,
  reconciliationService,
  settingsService,
  usersService,
  reportsService,
};

export default api;

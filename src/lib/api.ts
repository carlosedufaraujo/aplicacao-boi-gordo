import axios from 'axios';
import { getAuthToken } from './auth-helper';

// Configuração base da API
import { getApiBaseUrl } from '@/config/api.config';
// Usar função para obter URL em runtime (não em build time)
const getApiUrl = () => import.meta.env.VITE_API_URL || getApiBaseUrl();

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Aumentado para 30 segundos
  withCredentials: true, // Importante para enviar cookies
});

// Definir baseURL dinamicamente em runtime (não em build time)
api.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  return config;
});

// Interceptador de requisição para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    // Usa o helper para obter token de cookies ou localStorage
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador de resposta para tratar erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratar erros de autenticação
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Em um caso real, redirecionaria para login
    }

    // Tratar outros erros
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    }

    return Promise.reject(error);
  }
);

export default api;

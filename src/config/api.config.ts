// Configuração centralizada das URLs da API

/**
 * Retorna a URL base da API dependendo do ambiente
 */
export const getApiBaseUrl = (): string => {
  // Em produção (Vercel), usar a URL relativa
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin + '/api';
  }
  // Em desenvolvimento, usar localhost
  return 'http://localhost:3001/api/v1';
};

/**
 * Retorna a URL base sem o prefixo /api/v1
 */
export const getBaseUrl = (): string => {
  // Em produção (Vercel), usar a URL relativa
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  // Em desenvolvimento, usar localhost
  return 'http://localhost:3001';
};

/**
 * Retorna a URL do WebSocket
 */
export const getWebSocketUrl = (): string => {
  // Em produção (Vercel), usar WSS
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  // Em desenvolvimento, usar localhost
  return 'ws://localhost:3001';
};

// Exporta as URLs para uso direto (calculadas no momento da importação)
export const API_BASE_URL = getApiBaseUrl();
export const BASE_URL = getBaseUrl();
export const WS_URL = getWebSocketUrl();
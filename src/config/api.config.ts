// Configuração centralizada das URLs da API

/**
 * Retorna a URL base da API
 * IMPORTANTE: Usa URL RELATIVA para funcionar em qualquer deploy (preview ou produção)
 */
export const getApiBaseUrl = (): string => {
  // Priorizar variável de ambiente se configurada
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Usar URL RELATIVA - funciona em qualquer domínio/deploy
  return '/api/v1';
};

/**
 * Retorna a URL base sem o prefixo /api/v1
 * IMPORTANTE: Usa URL RELATIVA para funcionar em qualquer deploy
 */
export const getBaseUrl = (): string => {
  // Usar URL RELATIVA - funciona em qualquer domínio/deploy
  return '';
};

/**
 * Retorna a URL do WebSocket (sempre Cloudflare Pages)
 */
export const getWebSocketUrl = (): string => {
  // Sempre usar WSS do Cloudflare Pages
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  // Fallback para WSS do Cloudflare Pages em build time
  return 'wss://aplicacao-boi-gordo.pages.dev';
};

// Exporta as URLs para uso direto (calculadas no momento da importação)
export const API_BASE_URL = getApiBaseUrl();
export const BASE_URL = getBaseUrl();
export const WS_URL = getWebSocketUrl();
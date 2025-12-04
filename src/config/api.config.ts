// Configuração centralizada das URLs da API

/**
 * Retorna a URL base da API (sempre Cloudflare Pages - ambiente online)
 */
export const getApiBaseUrl = (): string => {
  // Priorizar variável de ambiente se configurada
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Sempre usar URL relativa do Cloudflare Pages
  if (typeof window !== 'undefined') {
    return window.location.origin + '/api/v1';
  }
  
  // Fallback para URL do Cloudflare Pages em build time
  return 'https://aplicacao-boi-gordo.pages.dev/api/v1';
};

/**
 * Retorna a URL base sem o prefixo /api/v1 (sempre Cloudflare Pages)
 */
export const getBaseUrl = (): string => {
  // Sempre usar URL relativa do Cloudflare Pages
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback para URL do Cloudflare Pages em build time
  return 'https://aplicacao-boi-gordo.pages.dev';
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
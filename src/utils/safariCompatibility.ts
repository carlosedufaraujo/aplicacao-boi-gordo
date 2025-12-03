/**
 * Utilitários para compatibilidade com Safari
 * Safari tem políticas mais restritivas para localStorage e CORS
 */

/**
 * Verificar se está rodando no Safari
 */
export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isSafariUA = userAgent.includes('safari') && !userAgent.includes('chrome');
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  
  return isSafariUA || isIOS;
}

/**
 * Verificar se localStorage está disponível e funcional
 */
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('[Safari] localStorage não disponível:', e);
    return false;
  }
}

/**
 * Wrapper seguro para localStorage que funciona no Safari
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (!isLocalStorageAvailable()) {
        // Fallback para sessionStorage no Safari
        return sessionStorage.getItem(key);
      }
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Safari] Erro ao ler localStorage[${key}]:`, e);
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      if (!isLocalStorageAvailable()) {
        // Fallback para sessionStorage no Safari
        sessionStorage.setItem(key, value);
        return;
      }
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Safari] Erro ao escrever localStorage[${key}]:`, e);
      try {
        sessionStorage.setItem(key, value);
      } catch (err) {
        console.error(`[Safari] Erro ao escrever sessionStorage[${key}]:`, err);
      }
    }
  },

  removeItem: (key: string): void => {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(key);
      }
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Safari] Erro ao remover localStorage[${key}]:`, e);
    }
  },

  clear: (): void => {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.clear();
      }
      sessionStorage.clear();
    } catch (e) {
      console.warn('[Safari] Erro ao limpar storage:', e);
    }
  },
};

/**
 * Adicionar headers específicos para Safari em requisições fetch
 */
export function getSafariCompatibleHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  // Safari precisa de headers explícitos
  if (isSafari()) {
    headers['Accept'] = 'application/json';
    headers['Cache-Control'] = 'no-cache';
  }

  return headers;
}

/**
 * Verificar se há problemas de CORS no Safari
 */
export async function checkCorsCompatibility(): Promise<boolean> {
  if (!isSafari()) return true;

  try {
    const testUrl = window.location.origin + '/api/v1/health';
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: getSafariCompatibleHeaders(),
      credentials: 'include', // Importante para Safari
    });

    return response.ok;
  } catch (e) {
    console.warn('[Safari] Problema de CORS detectado:', e);
    return false;
  }
}

/**
 * Log de diagnóstico para Safari
 */
export function logSafariDiagnostics(): void {
  if (!isSafari()) return;

  console.log('🔍 [Safari] Diagnóstico:', {
    userAgent: navigator.userAgent,
    localStorageAvailable: isLocalStorageAvailable(),
    sessionStorageAvailable: typeof sessionStorage !== 'undefined',
    cookiesEnabled: navigator.cookieEnabled,
    origin: window.location.origin,
    protocol: window.location.protocol,
  });
}


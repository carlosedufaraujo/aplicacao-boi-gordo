// Helper para gerenciar autenticação com suporte a cookies e localStorage

// Função para obter o token de autenticação (verifica cookies e localStorage)
export function getAuthToken(): string | null {
  // Primeiro tenta localStorage
  const localToken = localStorage.getItem('authToken');
  if (localToken) return localToken;

  // Depois tenta cookies
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'authToken') {
      return decodeURIComponent(value);
    }
  }

  return null;
}

// Função para salvar token (salva em ambos os lugares)
export function setAuthToken(token: string): void {
  // Salva no localStorage
  localStorage.setItem('authToken', token);

  // Salva como cookie (expira em 7 dias)
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  document.cookie = `authToken=${encodeURIComponent(token)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

// Função para limpar autenticação
export function clearAuth(): void {
  // Remove do localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');

  // Remove cookie
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Função para obter dados do usuário
export function getUser(): any {
  const localUser = localStorage.getItem('user');
  if (localUser) {
    try {
      return JSON.parse(localUser);
    } catch {
      return null;
    }
  }

  // Tenta cookies
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'user') {
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return null;
      }
    }
  }

  return null;
}

// Função para salvar dados do usuário
export function setUser(user: any): void {
  const userStr = JSON.stringify(user);

  // Salva no localStorage
  localStorage.setItem('user', userStr);

  // Salva como cookie (expira em 7 dias)
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  document.cookie = `user=${encodeURIComponent(userStr)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}
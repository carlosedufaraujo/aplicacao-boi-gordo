/**
 * SISTEMA DE AUTENTICAÇÃO 100% BACKEND
 *
 * Substitui completamente o Supabase Auth
 * Usa apenas nossa API backend com JWT
 */

import { getApiBaseUrl } from '@/config/api.config';

const API_BASE_URL = import.meta.env.VITE_API_URL || getApiBaseUrl();

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'MASTER';
  isActive: boolean;
  isMaster: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    token: string;
  };
}

export interface Session {
  access_token: string;
  user: User;
}

export class BackendAuthService {
  /**
   * Login via Backend API
   */
  async signIn(email: string, password: string): Promise<{ user: User; session: Session }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    const data: AuthResponse = await response.json();
    
    if (data.status !== 'success') {
      throw new Error('Erro no login');
    }

    // Salvar no localStorage
    localStorage.setItem('authToken', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    const session: Session = {
      access_token: data.data.token,
      user: data.data.user
    };
    return { user: data.data.user, session };
  }

  /**
   * Logout
   */
  async signOut(): Promise<void> {
    // Limpar localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  /**
   * Obter usuário atual do localStorage
   */
  async getCurrentUser(): Promise<User | null> {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Obter sessão atual do localStorage
   */
  async getCurrentSession(): Promise<Session | null> {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) return null;
    
    return {
      access_token: token,
      user: JSON.parse(userData)
    };
  }

  /**
   * Verificar se token é válido
   */
  async validateToken(): Promise<boolean> {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Simular listener de mudanças (compatibilidade)
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    // Sistema Backend não precisa de listeners em tempo real
    // Retorna subscription mock para compatibilidade
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }

  /**
   * Obter token de autorização para requests
   */
  getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Instância única do serviço
export const backendAuth = new BackendAuthService();
export const backendService = backendAuth; // Alias para compatibilidade

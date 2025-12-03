/**
 * SISTEMA DE AUTENTICAÇÃO 100% BACKEND
 *
 * Substitui completamente o Supabase Auth
 * Usa apenas nossa API backend com JWT
 */

import { getApiBaseUrl } from '@/config/api.config';
import { safeLocalStorage, isSafari, getSafariCompatibleHeaders } from '@/utils/safariCompatibility';

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
    // Validação básica no cliente também
    if (!email || !email.trim()) {
      throw new Error('Email é obrigatório');
    }
    if (!password || !password.trim()) {
      throw new Error('Senha é obrigatória');
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getSafariCompatibleHeaders(),
      credentials: 'include', // Importante para Safari
      body: JSON.stringify({ email: email.trim(), password })
    });

    // Ler resposta como texto primeiro para poder parsear corretamente
    const responseText = await response.text();
    let data: AuthResponse;
    
    try {
      // Verificar se a resposta é HTML (erro do servidor) em vez de JSON
      if (responseText.trim().startsWith('<') || responseText.trim().startsWith('<!DOCTYPE')) {
        console.error('❌ Servidor retornou HTML em vez de JSON. Backend pode não estar disponível.');
        throw new Error('Servidor não está disponível. Verifique se o backend está rodando.');
      }
      
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      // Se já lançamos um erro específico acima, propagar
      if (parseError.message && parseError.message.includes('Servidor não está disponível')) {
        throw parseError;
      }
      
      // Caso contrário, erro de parsing JSON
      console.error('❌ Erro ao parsear resposta do servidor:', responseText.substring(0, 200));
      
      // Verificar se é erro de rede ou servidor não disponível
      if (response.status === 0 || response.status >= 500) {
        throw new Error('Servidor não está disponível. Verifique se o backend está rodando.');
      }
      
      // Outros erros de parsing
      throw new Error('Resposta inválida do servidor. Tente novamente.');
    }

    // Verificar se houve erro na resposta
    if (!response.ok || data.status === 'error') {
      const errorMessage = data.message || `Erro HTTP: ${response.status}`;
      console.warn(`⚠️ Login falhou: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Validar que temos os dados necessários
    if (!data.data || !data.data.token || !data.data.user) {
      console.error('❌ Resposta de login incompleta:', data);
      throw new Error('Resposta de login incompleta');
    }

    // Validar que o token não está vazio
    if (!data.data.token.trim()) {
      console.error('❌ Token vazio na resposta');
      throw new Error('Token não foi gerado corretamente');
    }

    // Salvar no localStorage (com fallback para Safari)
    safeLocalStorage.setItem('authToken', data.data.token);
    safeLocalStorage.setItem('user', JSON.stringify(data.data.user));

    const session: Session = {
      access_token: data.data.token,
      user: data.data.user
    };
    
    console.log('✅ Login bem-sucedido para:', email);
    return { user: data.data.user, session };
  }

  /**
   * Logout
   */
  async signOut(): Promise<void> {
    // Limpar localStorage (com fallback para Safari)
    safeLocalStorage.removeItem('authToken');
    safeLocalStorage.removeItem('user');
  }

  /**
   * Obter usuário atual do localStorage
   */
  async getCurrentUser(): Promise<User | null> {
    const userData = safeLocalStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Obter sessão atual do localStorage
   */
  async getCurrentSession(): Promise<Session | null> {
    const token = safeLocalStorage.getItem('authToken');
    const userData = safeLocalStorage.getItem('user');
    
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
    const token = safeLocalStorage.getItem('authToken');
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          ...getSafariCompatibleHeaders({ Authorization: `Bearer ${token}` })
        },
        credentials: 'include', // Importante para Safari
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
    const token = safeLocalStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Instância única do serviço
export const backendAuth = new BackendAuthService();
export const backendService = backendAuth; // Alias para compatibilidade

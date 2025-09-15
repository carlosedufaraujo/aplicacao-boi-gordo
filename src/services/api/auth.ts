// Serviço de autenticação
import { apiRequest } from './index';
import { setAuthToken, setUser, clearAuth } from '@/lib/auth-helper';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Salvar token em cookies e localStorage
    if (response.token) {
      setAuthToken(response.token);
      setUser(response.user);
    }
    
    return response;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Salvar token em cookies e localStorage
    if (response.token) {
      setAuthToken(response.token);
      setUser(response.user);
    }
    
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      // Limpar localStorage independente do resultado
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  me: async (): Promise<User> => {
    return apiRequest<User>('/auth/me');
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiRequest<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    // Atualizar user no localStorage
    localStorage.setItem('user', JSON.stringify(response));
    
    return response;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    return apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  forgotPassword: async (email: string): Promise<void> => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  verifyToken: async (): Promise<boolean> => {
    try {
      await apiRequest('/auth/verify');
      return true;
    } catch {
      return false;
    }
  },
};

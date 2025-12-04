// Serviço temporário para usar a nova rota de usuários
import { getApiBaseUrl } from '@/config/api.config';
// Usar função para obter URL em runtime (não em build time)
const getApiUrl = () => import.meta.env.VITE_API_URL || getApiBaseUrl();

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  is_active: boolean;
  is_master: boolean;
  created_at: string;
  updated_at: string;
}

export const userService = {
  // Usar a nova rota list-users ao invés de users
  async getUsers(): Promise<{ data: User[], message: string }> {
    try {
      const response = await fetch(`${getApiUrl()}/list-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        data: result.data || [],
        message: result.message || 'Usuários carregados'
      };
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      
      // Fallback: tentar a rota antiga
      try {
        const fallbackResponse = await fetch(`${getApiUrl()}/users`);
        const fallbackResult = await fallbackResponse.json();
        
        if (fallbackResult.data) {
          return fallbackResult;
        }
      } catch (fallbackError) {
        console.error('Fallback também falhou:', fallbackError);
      }
      
      return {
        data: [],
        message: 'Erro ao carregar usuários'
      };
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data } = await this.getUsers();
      return data.find(user => user.id === id) || null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  },

  async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    try {
      const response = await fetch(`${getApiUrl()}/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(updates)
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return false;
    }
  }
};

export default userService;

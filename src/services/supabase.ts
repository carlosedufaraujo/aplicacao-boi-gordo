// Este arquivo foi migrado para usar apenas o Backend API
// Mantendo apenas as definições de tipos para compatibilidade

// Tipos para usuários
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isMaster: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Re-export do serviço de backend para compatibilidade
export { backendService as supabase } from './backendAuth';

// Classe vazia para compatibilidade (será removida em refatoração futura)
export class SupabaseAuthService {
  async signIn(email: string, password: string) {
    throw new Error('Use o BackendProvider para autenticação');
  }
  
  async signOut() {
    throw new Error('Use o BackendProvider para autenticação');
  }
  
  async getSession() {
    throw new Error('Use o BackendProvider para autenticação');
  }
}

export const authService = new SupabaseAuthService();

// Serviço de usuários para compatibilidade
export const userService = {
  async getUsers() {
    // Implementação mock para compatibilidade
    return [];
  },
  async createUser(userData: any) {
    return null;
  },
  async updateUser(id: string, userData: any) {
    return null;
  },
  async deleteUser(id: string) {
    return null;
  }
};

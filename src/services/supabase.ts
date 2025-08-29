import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente Supabase não configuradas. Verifique o arquivo .env');
}

// Verificar configuração
console.log('🔧 Configuração Supabase:', {
  url: supabaseUrl,
  anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NÃO DEFINIDA',
  keyType: 'ANON (Seguro para Frontend)'
});

// Cliente Supabase para o frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// Serviço de autenticação (DESABILITADO - usando Backend próprio)
export class SupabaseAuthService {
  // Login via Backend API (não Supabase Auth)
  async signIn(email: string, password: string) {
    // Redirecionar para API Backend
    const response = await fetch('http://localhost:3333/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro no login');
    }
    
    const data = await response.json();
    return { user: data.user, session: { access_token: data.token } };
  }

  // Logout via Backend API
  async signOut() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return true;
  }

  // Obter usuário atual do localStorage
  async getCurrentUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Obter sessão atual do localStorage  
  async getCurrentSession() {
    const token = localStorage.getItem('authToken');
    return token ? { access_token: token } : null;
  }

  // Simular mudanças de autenticação (sem Supabase)
  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Retorna um subscription mock
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
}

// Serviço de usuários
export class SupabaseUserService {
  // Listar todos os usuários (requer admin)
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Buscar usuário por ID
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  // Buscar usuário por email
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data;
  }

  // Atualizar usuário
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Ativar/desativar usuário
  async toggleUserStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ 
        isActive,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  // Deletar usuário
  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

// Instâncias dos serviços
export const authService = new SupabaseAuthService();
export const userService = new SupabaseUserService();

// Hook para usar Supabase
export const useSupabase = () => ({
  supabase,
  auth: authService,
  users: userService
});

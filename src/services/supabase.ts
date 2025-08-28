import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vffxtvuqhlhcbbyqmynz.supabase.co';

// TEMPORÁRIO: Usar service_role key para testar conexão
// TODO: Substituir por chave anon válida
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8';

// Verificar configuração
console.log('🔧 Configuração Supabase:', {
  url: supabaseUrl,
  anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NÃO DEFINIDA',
  keyType: supabaseAnonKey.includes('service_role') ? 'SERVICE_ROLE (TEMPORÁRIO)' : 'ANON'
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

// Serviço de autenticação
export class SupabaseAuthService {
  // Login
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Obter usuário atual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  // Obter sessão atual
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  // Escutar mudanças de autenticação
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
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

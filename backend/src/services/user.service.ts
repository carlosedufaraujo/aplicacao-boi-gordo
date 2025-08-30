import { createClient } from '@supabase/supabase-js';
import { AppError } from '@/utils/AppError';
import { env } from '@/config/env';

// Inicializar cliente Supabase
const supabase = createClient(
  env.SUPABASE_URL || '',
  env.SUPABASE_ANON_KEY || ''
);

export class UserService {
  /**
   * Busca usuário por ID via Supabase
   */
  async getUserById(userId: string): Promise<any> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return user;
  }

  /**
   * Busca usuário por email via Supabase
   */
  async getUserByEmail(email: string): Promise<any> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return null;
    }

    return user;
  }

  /**
   * Lista todos os usuários via Supabase
   */
  async getAllUsers(): Promise<any[]> {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      throw new AppError('Erro ao buscar usuários', 500);
    }

    return users || [];
  }

  /**
   * Atualiza dados do usuário via Supabase
   */
  async updateUser(
    userId: string,
    updateData: Partial<any>
  ): Promise<any> {
    const { data: user, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError('Erro ao atualizar usuário', 500);
    }

    return user;
  }

  /**
   * Desativa usuário via Supabase
   */
  async deactivateUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ 
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new AppError('Erro ao desativar usuário', 500);
    }
  }

  /**
   * Reativa usuário via Supabase
   */
  async reactivateUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ 
        isActive: true,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new AppError('Erro ao reativar usuário', 500);
    }
  }

  /**
   * Cria novo usuário via Supabase Auth
   */
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<any> {
    // Criar no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        role: userData.role || 'USER'
      }
    });

    if (authError || !authUser.user) {
      throw new AppError(`Erro ao criar usuário: ${authError?.message}`, 500);
    }

    // A tabela users será atualizada automaticamente pelo trigger
    return authUser.user;
  }

  /**
   * Atualiza role do usuário
   */
  async updateUserRole(userId: string, newRole: string): Promise<any> {
    // Atualizar metadata no Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: newRole }
    });

    if (authError) {
      throw new AppError(`Erro ao atualizar role: ${authError.message}`, 500);
    }

    // Atualizar na tabela de sincronização
    return this.updateUser(userId, { role: newRole });
  }

  /**
   * Deleta usuário
   */
  async deleteUser(userId: string): Promise<void> {
    // Deletar do Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      throw new AppError(`Erro ao deletar usuário: ${authError.message}`, 500);
    }

    // Deletar da tabela de sincronização
    const { error: syncError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (syncError) {
      throw new AppError(`Erro ao deletar da sincronização: ${syncError.message}`, 500);
    }
  }
}
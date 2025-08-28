import { User, UserRole } from '@prisma/client';
import { supabase, supabaseAuth } from '@/config/supabase';
import { UnauthorizedError, ConflictError } from '@/utils/AppError';
import { isMasterAdmin } from '@/utils/auth';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface AuthResponse {
  user: any;
  token: string;
}

export class AuthService {
  /**
   * Registra um novo usuário
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Verifica se o email já existe no Supabase Auth
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      throw new Error(`Erro ao verificar usuários: ${checkError.message}`);
    }

    const userExists = existingUser.users.some(u => u.email === data.email);
    if (userExists) {
      throw new ConflictError('Email já cadastrado');
    }

    // Cria usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        role: data.role || 'USER',
        isMaster: isMasterAdmin(data.email)
      }
    });

    if (authError || !authUser.user) {
      throw new Error(`Erro ao criar usuário no Supabase Auth: ${authError?.message}`);
    }

    // Remove a senha da resposta
    const userData = {
      id: authUser.user.id,
      email: authUser.user.email,
      name: data.name,
      role: data.role || 'USER',
      isMaster: isMasterAdmin(data.email),
      isActive: true
    };

    return {
      user: userData,
      token: 'temp_token', // Token temporário até implementar sessão completa
    };
  }

  /**
   * Realiza login do usuário
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Login via Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    // Buscar dados do usuário na tabela de sincronização
    const { data: localUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !localUser || !localUser.isActive) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo');
    }

    return {
      user: localUser,
      token: authData.session.access_token,
    };
  }

  /**
   * Atualiza a senha do usuário
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Atualiza senha no Supabase Auth
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      throw new Error(`Erro ao atualizar senha: ${error.message}`);
    }
  }

  /**
   * Verifica token de autenticação
   */
  async verifyToken(token: string): Promise<any> {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new UnauthorizedError('Token inválido');
    }

    return user;
  }

  /**
   * Busca usuário por ID
   */
  async getUserById(userId: string): Promise<any> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    return user;
  }

  /**
   * Busca usuário por email
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
   * Lista todos os usuários (apenas para admins)
   */
  async getAllUsers(): Promise<any[]> {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }

    return users || [];
  }

  /**
   * Atualiza dados do usuário
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
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }

    return user;
  }

  /**
   * Desativa usuário
   */
  async deactivateUser(userId: string): Promise<void> {
    // Desativa no Supabase Auth
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { isActive: false }
    });

    // Desativa na tabela de sincronização
    await supabase
      .from('users')
      .update({ 
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);
  }

  /**
   * Reativa usuário
   */
  async reactivateUser(userId: string): Promise<void> {
    // Reativa no Supabase Auth
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { isActive: true }
    });

    // Reativa na tabela de sincronização
    await supabase
      .from('users')
      .update({ 
        isActive: true,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);
  }

  /**
   * Logout do usuário
   */
  async logout(token: string): Promise<void> {
    const { error } = await supabase.auth.admin.signOut(token);
    
    if (error) {
      throw new Error(`Erro ao fazer logout: ${error.message}`);
    }
  }
} 
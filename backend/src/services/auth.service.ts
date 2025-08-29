import { User, UserRole } from '@prisma/client';
import { UnauthorizedError, ConflictError } from '@/utils/AppError';
import { isMasterAdmin } from '@/utils/auth';
import { prisma } from '@/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

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
    // Verifica se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ConflictError('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Cria usuário no banco via Prisma
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: (data.role || 'USER') as UserRole,
        isMaster: isMasterAdmin(data.email),
        isActive: true
      }
    });

    // Gera token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    // Remove a senha da resposta
    const { password: _, ...userData } = user;

    return {
      user: userData,
      token
    };
  }

  /**
   * Realiza login do usuário
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Buscar usuário no banco local via Prisma
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    // Verificar senha com bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      user,
      token
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
    const { error } = await prisma.auth.admin.updateUserById(userId, {
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
    const { data: { user }, error } = await prisma.auth.getUser(token);
    
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
    await prisma.auth.admin.updateUserById(userId, {
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
    await prisma.auth.admin.updateUserById(userId, {
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
    const { error } = await prisma.auth.admin.signOut(token);
    
    if (error) {
      throw new Error(`Erro ao fazer logout: ${error.message}`);
    }
  }
} 
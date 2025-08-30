import { User } from '@prisma/client';
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
  role?: string;
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
        role: data.role || 'USER',
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
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
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
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
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
    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    // Verifica senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza senha no banco
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }

  /**
   * Verifica token de autenticação
   */
  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });
      
      if (!user || !user.isActive) {
        throw new UnauthorizedError('Token inválido');
      }

      const { password: _, ...userData } = user;
      return userData;
    } catch {
      throw new UnauthorizedError('Token inválido');
    }
  }

  /**
   * Busca usuário por ID
   */
  async getUserById(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return null;
    }

    const { password: _, ...userData } = user;
    return userData;
  }

  /**
   * Busca usuário por email
   */
  async getUserByEmail(email: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return null;
    }

    const { password: _, ...userData } = user;
    return userData;
  }

  /**
   * Lista todos os usuários (apenas para admins)
   */
  async getAllUsers(): Promise<any[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return users.map(user => {
      const { password: _, ...userData } = user;
      return userData;
    });
  }

  /**
   * Atualiza dados do usuário
   */
  async updateUser(
    userId: string,
    updateData: Partial<any>
  ): Promise<any> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    const { password: _, ...userData } = user;
    return userData;
  }

  /**
   * Desativa usuário
   */
  async deactivateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Reativa usuário
   */
  async reactivateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: true,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Logout do usuário
   */
  async logout(_token: string): Promise<void> {
    // Com JWT, o logout é feito no cliente removendo o token
    // Aqui poderiamos implementar uma blacklist de tokens se necessário
    return;
  }
} 
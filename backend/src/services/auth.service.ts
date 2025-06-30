import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '@prisma/client';
import { prisma } from '@/config/database';
import { env } from '@/config/env';
import { UnauthorizedError, ConflictError } from '@/utils/AppError';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export class AuthService {
  /**
   * Registra um novo usuário
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Verifica se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Cria o usuário
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'USER',
      },
    });

    // Gera o token
    const token = this.generateToken(user);

    // Remove a senha da resposta
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Realiza login do usuário
   */
  async login(data: LoginData): Promise<AuthResponse> {
    // Busca o usuário
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    // Verifica se o usuário está ativo
    if (!user.isActive) {
      throw new UnauthorizedError('Usuário inativo');
    }

    // Verifica a senha
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    // Gera o token
    const token = this.generateToken(user);

    // Remove a senha da resposta
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
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
    // Busca o usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    // Verifica a senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza a senha
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Gera um token JWT
   */
  private generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as string,
    });
  }

  /**
   * Valida um token e retorna os dados do usuário
   */
  async validateToken(token: string): Promise<Omit<User, 'password'>> {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Token inválido');
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw new UnauthorizedError('Token inválido');
    }
  }
} 
import { prisma } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { env } from '@/config/env';
import bcrypt from 'bcryptjs';

export class UserService {
  /**
   * Busca usuário por ID
   */
  async getUserById(userId: string): Promise<any> {
    // Em desenvolvimento, se for o usuário temporário, retornar dados mockados
    if (env.NODE_ENV === 'development' && userId === 'dev-user') {
      return {
        id: 'dev-user',
        email: 'admin@boicontrol.com',
        name: 'Admin Master',
        role: 'ADMIN',
        isActive: true,
        isMaster: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return user;
  }

  /**
   * Busca usuário por email
   */
  async getUserByEmail(email: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    return user;
  }

  /**
   * Cria um novo usuário
   */
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<any> {
    // Verifica se o email já existe
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new AppError('Email já cadastrado', 400);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Cria o usuário
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'USER',
        isActive: true,
        isMaster: false
      }
    });

    // Remove a senha do retorno
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Lista todos os usuários
   */
  async getAllUsers(): Promise<any[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return users;
  }

  /**
   * Atualiza dados do usuário
   */
  async updateUser(
    userId: string,
    updateData: Partial<any>
  ): Promise<any> {
    try {
      // Remove campos vazios ou undefined
      const cleanData: any = {};
      for (const key in updateData) {
        if (updateData[key] !== undefined && updateData[key] !== '') {
          cleanData[key] = updateData[key];
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...cleanData,
          updatedAt: new Date()
        }
      });

      return user;
    } catch (error) {
      console.error('[UserService] updateUser - error:', error);
      throw error;
    }
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
   * Atualiza role do usuário
   */
  async updateUserRole(userId: string, newRole: string): Promise<any> {
    return this.updateUser(userId, { role: newRole });
  }

  /**
   * Deleta usuário
   */
  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId }
    });
  }
}
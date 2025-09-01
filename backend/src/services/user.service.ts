import { prisma } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { env } from '@/config/env';

export class UserService {
  /**
   * Busca usuário por ID
   */
  async getUserById(userId: string): Promise<any> {
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
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return user;
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
   * Cria novo usuário
   */
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<any> {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'USER',
        isActive: true
      }
    });

    return user;
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
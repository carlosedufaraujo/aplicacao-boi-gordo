import { Request, Response } from 'express';
import { UserService } from '@/services/user.service';
import { AppError } from '@/utils/AppError';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Obtém o perfil do usuário autenticado
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const user = await this.userService.getUserById(userId);

      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          statusCode: error.statusCode
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor',
          statusCode: 500
        });
      }
    }
  }

  /**
   * Atualiza o perfil do usuário autenticado
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const updateData = req.body;

      const user = await this.userService.updateUser(userId, updateData);

      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          statusCode: error.statusCode
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor',
          statusCode: 500
        });
      }
    }
  }

  /**
   * Cria um novo usuário (apenas para admins)
   */
  async createUser(req: Request, res: Response) {
    try {
      const userData = req.body;
      const user = await this.userService.createUser(userData);

      res.status(201).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          statusCode: error.statusCode
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor',
          statusCode: 500
        });
      }
    }
  }

  /**
   * Lista todos os usuários (apenas para admins)
   */
  async getAllUsers(_req: Request, res: Response) {
    try {
      console.log('[UserController] getAllUsers - Usuário autenticado:', _req.user);
      const users = await this.userService.getAllUsers();
      console.log('[UserController] getAllUsers - Usuários encontrados:', users.length);

      res.json({
        status: 'success',
        data: users
      });
    } catch (error) {
      console.error('[UserController] getAllUsers - Erro:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          statusCode: error.statusCode
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor',
          statusCode: 500
        });
      }
    }
  }

  /**
   * Obtém um usuário específico por ID (apenas para admins)
   */
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          statusCode: error.statusCode
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor',
          statusCode: 500
        });
      }
    }
  }

  /**
   * Atualiza um usuário específico (apenas para admins)
   */
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await this.userService.updateUser(id, updateData);

      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          statusCode: error.statusCode
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor',
          statusCode: 500
        });
      }
    }
  }

  /**
   * Ativa um usuário (apenas para admins)
   */
  async activateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.userService.reactivateUser(id);

      res.json({
        status: 'success',
        message: 'Usuário ativado com sucesso'
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          statusCode: error.statusCode
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor',
          statusCode: 500
        });
      }
    }
  }

  /**
   * Desativa um usuário (apenas para admins)
   */
  async deactivateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.userService.deactivateUser(id);

      res.json({
        status: 'success',
        message: 'Usuário desativado com sucesso'
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          statusCode: error.statusCode
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor',
          statusCode: 500
        });
      }
    }
  }

  /**
   * Deleta um usuário (apenas para master admin)
   */
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);

      res.json({
        status: 'success',
        message: 'Usuário deletado com sucesso'
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          statusCode: error.statusCode
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor',
          statusCode: 500
        });
      }
    }
  }

  /**
   * Atualiza o role de um usuário (apenas para master admin)
   */
  async updateUserRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await this.userService.updateUserRole(id, role);

      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
          statusCode: error.statusCode
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro interno do servidor',
          statusCode: 500
        });
      }
    }
  }
}

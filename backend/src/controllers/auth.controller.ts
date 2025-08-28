import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /auth/register
   * Registra um novo usuário
   */
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    
    res.status(201).json({
      status: 'success',
      data: result,
    });
  }

  /**
   * POST /auth/login
   * Realiza login do usuário
   */
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    res.json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /auth/me
   * Retorna os dados do usuário autenticado
   */
  async me(req: Request, res: Response): Promise<void> {
    const { password, ...user } = req.user!;
    
    res.json({
      status: 'success',
      data: { user },
    });
  }

  /**
   * POST /auth/change-password
   * Altera a senha do usuário
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;
    
    await authService.changePassword(
      req.user!.id,
      currentPassword,
      newPassword
    );
    
    res.json({
      status: 'success',
      message: 'Senha alterada com sucesso',
    });
  }

  /**
   * POST /auth/validate-token
   * Valida um token JWT
   */
  async validateToken(req: Request, res: Response): Promise<void> {
    const { token } = req.body;
    
    const user = await authService.verifyToken(token);
    
    res.json({
      status: 'success',
      data: { user, valid: true },
    });
  }
} 
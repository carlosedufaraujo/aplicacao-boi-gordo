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

    // Configura cookies para registro também
    if (result.token) {
      res.cookie('authToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.cookie('user', JSON.stringify(result.user), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

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

    // Configura cookie HTTP-only para melhor segurança e persistência no Puppeteer
    res.cookie('authToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    // Também enviar dados do usuário como cookie (não sensível)
    res.cookie('user', JSON.stringify(result.user), {
      httpOnly: false, // Permitir acesso via JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    res.json({
      status: 'success',
      token: result.token,    // Token no nível raiz para compatibilidade com testes
      user: result.user,      // User no nível raiz para facilitar acesso
      data: result,           // Manter estrutura original para compatibilidade
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
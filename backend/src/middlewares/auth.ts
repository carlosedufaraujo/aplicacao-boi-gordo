import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '@/utils/AppError';
import { supabase } from '@/config/supabase';
import { User, UserRole } from '@prisma/client';

// Estende a interface Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware de autenticação
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extrai o token do header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError('Token não fornecido');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedError('Formato de token inválido');
    }

    // Valida token via Supabase Auth
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      throw new UnauthorizedError('Token inválido ou expirado');
    }

    // Busca dados adicionais da tabela de sincronização
    const { data: localUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single();

    if (userError || !localUser || !localUser.isActive) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo');
    }

    // Adiciona o usuário à requisição
    req.user = localUser;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Erro de autenticação'));
    }
  }
}

// Middleware de autorização por role
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Usuário não autenticado'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Permissão insuficiente'));
    }

    next();
  };
}

// Middleware opcional de autenticação (não obriga estar autenticado)
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return next();
    }

    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    
    if (!error && authUser) {
      const { data: localUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (!userError && localUser && localUser.isActive) {
        req.user = localUser;
      }
    }

    next();
  } catch {
    // Ignora erros e continua sem autenticação
    next();
  }
} 
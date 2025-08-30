import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '@/utils/AppError';
import { prisma } from '@/config/database';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

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
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // DESENVOLVIMENTO: Bypass de autenticação
    if (env.NODE_ENV === 'development') {
      // Busca um usuário admin para desenvolvimento
      const devUser = await prisma.user.findFirst({
        where: { 
          email: 'admin@boigordo.com',
          isActive: true 
        }
      });
      
      if (devUser) {
        _req.user = devUser;
        return next();
      }
    }

    // Extrai o token do header
    const authHeader = _req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError('Token não fornecido');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedError('Formato de token inválido');
    }

    // Valida token JWT
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    // Busca usuário no banco via Prisma
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo');
    }

    // Adiciona o usuário à requisição
    _req.user = user;
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
export function authorize(...roles: string[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    if (!_req.user) {
      return next(new UnauthorizedError('Usuário não autenticado'));
    }

    if (!roles.includes(_req.user.role)) {
      return next(new ForbiddenError('Permissão insuficiente'));
    }

    next();
  };
}

// Middleware opcional de autenticação (não obriga estar autenticado)
export async function optionalAuthenticate(
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = _req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return next();
    }

    // Valida token JWT
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    // Busca usuário no banco via Prisma
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (user && user.isActive) {
      _req.user = user;
    }

    next();
  } catch {
    // Ignora erros e continua sem autenticação
    next();
  }
} 
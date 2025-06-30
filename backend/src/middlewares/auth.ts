import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '@/utils/AppError';
import { env } from '@/config/env';
import { prisma } from '@/config/database';
import { User, UserRole } from '@prisma/client';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

// Estende a interface Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Middleware de autenticação
export async function authenticate(
  req: Request,
  res: Response,
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

    // Verifica o token
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

    // Busca o usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo');
    }

    // Adiciona o usuário à requisição
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Token inválido'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expirado'));
    } else {
      next(error);
    }
  }
}

// Middleware de autorização por role
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
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
  res: Response,
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

    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch {
    // Ignora erros e continua sem autenticação
    next();
  }
} 
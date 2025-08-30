import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '@/utils/AppError';
import { prisma } from '@/config/database';

// Estende a interface Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Middleware de autenticação 100% Backend (JWT próprio)
 */
export async function authenticateBackend(
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extrai o token do header
    const authHeader = _req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError('Token não fornecido');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedError('Formato de token inválido');
    }

    // Valida token JWT (nosso próprio)
    const jwtSecret = process.env.JWT_SECRET || 'seu_jwt_secret_muito_seguro_aqui';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Busca usuário no banco via Prisma
    const localUser = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!localUser || !localUser.isActive) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo');
    }

    // Adiciona o usuário à requisição
    _req.user = localUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Token inválido'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expirado'));
    } else if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Erro de autenticação'));
    }
  }
}

/**
 * Middleware de autorização por role (Backend)
 */
export function authorizeBackend(...roles: string[]) {
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

/**
 * Middleware opcional de autenticação Backend
 */
export async function optionalAuthenticateBackend(
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

    const jwtSecret = process.env.JWT_SECRET || 'seu_jwt_secret_muito_seguro_aqui';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    const localUser = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (localUser && localUser.isActive) {
      _req.user = localUser;
    }

    next();
  } catch {
    // Ignora erros e continua sem autenticação
    next();
  }
}

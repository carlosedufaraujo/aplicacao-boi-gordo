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
    // DESENVOLVIMENTO: Bypass completo de autenticação
    if (env.NODE_ENV === 'development' || env.NODE_ENV !== 'production') {
      console.log('[Auth] Modo desenvolvimento - buscando usuário admin');
      // Busca o usuário master admin (prioriza carlosedufaraujo@outlook.com)
      let devUser = await prisma.user.findFirst({
        where: { 
          email: 'carlosedufaraujo@outlook.com'
        }
      });
      
      // Se não encontrar, tenta admin@boigordo.com
      if (!devUser) {
        console.log('[Auth] carlosedufaraujo@outlook.com não encontrado, tentando admin@boigordo.com');
        devUser = await prisma.user.findFirst({
          where: { 
            email: 'admin@boigordo.com'
          }
        });
      }
      
      if (devUser) {
        console.log('[Auth] Usuário encontrado:', devUser.email, devUser.role);
        _req.user = devUser;
        return next();
      } else {
        console.log('[Auth] Nenhum usuário admin encontrado, criando temporário');
        // Se não encontrar nenhum, cria um usuário temporário
        _req.user = {
          id: 'dev-user',
          email: 'admin@boicontrol.com',
          name: 'Admin Master',
          role: 'ADMIN',
          isActive: true,
          isMaster: true
        };
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
    // Em desenvolvimento, sempre permitir
    if (env.NODE_ENV === 'development' || env.NODE_ENV !== 'production') {
      _req.user = {
        id: 'dev-user',
        email: 'admin@boigordo.com',
        name: 'Dev User',
        role: 'ADMIN',
        isActive: true
      };
      return next();
    }
    
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

// Alias para compatibilidade
export const authMiddleware = authenticate; 
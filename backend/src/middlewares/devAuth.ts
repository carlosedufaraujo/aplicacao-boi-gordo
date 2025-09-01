import { Request, Response, NextFunction } from 'express';

// Middleware de autenticação para desenvolvimento/testes
// ATENÇÃO: NUNCA usar em produção!
export function devAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  // Em desenvolvimento, sempre adiciona um usuário fake
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    (req as any).user = {
      id: 'dev-user-id',
      email: 'dev@bovicontrol.com',
      name: 'Dev User',
      role: 'ADMIN',
      isActive: true
    };
  }
  next();
}

// Exporta uma versão que pode ser usada condicionalmente
export function conditionalAuth(prodAuth: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      devAuthenticate(req, res, next);
    } else {
      prodAuth(req, res, next);
    }
  };
}
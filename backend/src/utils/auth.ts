import { Request, Response, NextFunction } from 'express';

/**
 * Email do usuário master do sistema
 */
const MASTER_ADMIN_EMAIL = 'carlosedufaraujo@outlook.com';

/**
 * Verifica se o email é do admin master
 */
export const isMasterAdmin = (email: string): boolean => {
  return email === MASTER_ADMIN_EMAIL;
};

/**
 * Middleware para verificar se o usuário é o master admin
 */
export const checkMasterPermission = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !isMasterAdmin(req.user.email)) {
    return res.status(403).json({ 
      error: 'Acesso negado', 
      message: 'Apenas o admin master pode executar esta ação' 
    })
  }
  next()
}

export const checkAdminPermission = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'ADMIN' && !isMasterAdmin(req.user.email))) {
    return res.status(403).json({ 
      error: 'Acesso negado', 
      message: 'Apenas administradores podem executar esta ação' 
    })
  }
  next()
}

export const checkUserPermission = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Não autorizado', 
      message: 'Usuário não autenticado' 
    })
  }
  next()
}

export const isOwnerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autorizado' })
  }
  
  // Master admin tem acesso total
  if (isMasterAdmin(req.user.email)) {
    return next()
  }
  
  // Admin tem acesso total
  if (req.user.role === 'ADMIN') {
    return next()
  }
  
  // Usuário comum só pode acessar seus próprios dados
  if (req.user.id === req.params.id) {
    return next()
  }
  
  return res.status(403).json({ 
    error: 'Acesso negado', 
    message: 'Você só pode acessar seus próprios dados' 
  })
}

/**
 * Middleware para proteger o usuário master de ser modificado
 */
export const protectMasterUser = (req: Request, res: Response, next: NextFunction) => {
  const targetEmail = req.body.email || req.params.email;
  const requestingUserEmail = req.user?.email;

  // Se estiver tentando modificar o master
  if (targetEmail && isMasterAdmin(targetEmail)) {
    // Apenas o próprio master pode modificar seus dados
    if (!isMasterAdmin(requestingUserEmail)) {
      return res.status(403).json({ 
        status: 'error',
        message: 'O usuário master não pode ser modificado por outros usuários',
        statusCode: 403
      });
    }
  }
  
  next();
};

/**
 * Verifica se o usuário tem permissão de admin (incluindo master)
 */
export const isAdmin = (user: any): boolean => {
  return user.role === 'ADMIN' || isMasterAdmin(user.email);
};

/**
 * Verifica se o usuário tem permissão de manager ou superior
 */
export const isManagerOrAbove = (user: any): boolean => {
  return ['ADMIN', 'MANAGER'].includes(user.role) || isMasterAdmin(user.email);
};

/**
 * Retorna o nível de permissão do usuário
 */
export const getPermissionLevel = (user: any): number => {
  if (isMasterAdmin(user.email)) return 999; // Nível máximo para master
  
  switch (user.role) {
    case 'ADMIN': return 100;
    case 'MANAGER': return 50;
    case 'USER': return 10;
    case 'VIEWER': return 1;
    default: return 0;
  }
};

/**
 * Verifica se um usuário pode modificar outro
 */
export const canModifyUser = (requestingUser: any, targetUser: any): boolean => {
  // Master pode modificar qualquer um
  if (isMasterAdmin(requestingUser.email)) return true;
  
  // Ninguém além do master pode modificar o master
  if (isMasterAdmin(targetUser.email)) return false;
  
  // Admin pode modificar qualquer um exceto outros admins e o master
  if (requestingUser.role === 'ADMIN' && targetUser.role !== 'ADMIN') return true;
  
  // Manager pode modificar USER e VIEWER
  if (requestingUser.role === 'MANAGER' && ['USER', 'VIEWER'].includes(targetUser.role)) return true;
  
  // Usuário pode modificar apenas seus próprios dados
  return requestingUser.id === targetUser.id;
};

/**
 * Registra ações críticas do master
 */
export const logMasterAction = async (action: string, details: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[MASTER ACTION] ${timestamp} - ${action}`, details);
  
  // TODO: Implementar salvamento em banco de dados ou arquivo de log
  // await prisma.auditLog.create({
  //   data: {
  //     action,
  //     details: JSON.stringify(details),
  //     userId: details.userId,
  //     timestamp
  //   }
  // });
};

/**
 * Valida se o IP está na whitelist do master (opcional)
 */
export const validateMasterIP = (req: Request): boolean => {
  const masterWhitelist = process.env.MASTER_IP_WHITELIST?.split(',') || [];
  
  // Se não houver whitelist, permite qualquer IP
  if (masterWhitelist.length === 0) return true;
  
  const clientIP = req.ip || req.connection.remoteAddress;
  return masterWhitelist.includes(clientIP || '');
};

/**
 * Middleware completo de proteção master
 */
export const masterSecurityCheck = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !isMasterAdmin(req.user.email)) {
    return next(); // Não é master, continua normalmente
  }
  
  // Log da ação do master
  await logMasterAction(req.method + ' ' + req.path, {
    userId: req.user.id,
    email: req.user.email,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    body: req.body
  });
  
  // Validar IP se configurado
  if (!validateMasterIP(req)) {
    return res.status(403).json({ 
      status: 'error',
      message: 'IP não autorizado para acesso master',
      statusCode: 403
    });
  }
  
  next();
};
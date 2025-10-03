import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';

interface AuditLog {
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Middleware para registrar todas as operações
export async function auditLog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Captura dados antes da operação
  const startTime = Date.now();
  const originalSend = res.json;

  // Extrai informações da requisição
  const auditData: Partial<AuditLog> = {
    userId: req.user?.id || 'anonymous',
    userEmail: req.user?.email || 'anonymous',
    action: `${req.method} ${req.path}`,
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    timestamp: new Date()
  };

  // Determina a entidade baseada no path
  const pathParts = req.path.split('/');
  if (pathParts.length >= 3) {
    auditData.entity = pathParts[3]; // Ex: /api/v1/cattle-purchases -> cattle-purchases
    if (pathParts.length >= 4) {
      auditData.entityId = pathParts[4]; // ID do registro se houver
    }
  }

  // Para requisições de modificação, captura o body
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    auditData.newData = req.body;
  }

  // Sobrescreve res.json para capturar resposta
  res.json = function(data: any) {
    res.json = originalSend; // Restaura função original

    // Log assíncrono para não bloquear resposta
    setImmediate(async () => {
      try {
        const responseTime = Date.now() - startTime;

        await prisma.auditLog.create({
          data: {
            userId: auditData.userId || 'system',
            action: auditData.action || 'unknown',
            entity: auditData.entity || 'unknown',
            entityId: auditData.entityId,
            details: JSON.stringify({
              request: {
                method: req.method,
                path: req.path,
                query: req.query,
                body: req.body,
                headers: {
                  'user-agent': req.get('user-agent'),
                  'content-type': req.get('content-type')
                }
              },
              response: {
                statusCode: res.statusCode,
                data: res.statusCode === 200 ? data : undefined,
                responseTime: `${responseTime}ms`
              },
              user: {
                id: req.user?.id,
                email: req.user?.email,
                role: req.user?.role
              },
              metadata: {
                ipAddress: auditData.ipAddress,
                timestamp: auditData.timestamp
              }
            })
          }
        });

        console.log(`[Audit] ${req.user?.email || 'anonymous'} - ${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`);
      } catch (error) {
        console.error('[Audit] Erro ao registrar auditoria:', error);
      }
    });

    return originalSend.call(res, data);
  };

  next();
}

// Middleware simplificado para operações de leitura
export function auditReadOperation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log simplificado para operações GET
  if (req.method === 'GET') {
    console.log(`[Read] ${req.user?.email || 'anonymous'} - GET ${req.path}`);
  }
  next();
}

// Middleware para operações críticas
export async function auditCriticalOperation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const criticalPaths = [
    '/users',
    '/financial-transactions',
    '/cattle-purchases',
    '/sale-records',
    '/expenses',
    '/revenues'
  ];

  const isCritical = criticalPaths.some(path => req.path.includes(path));

  if (isCritical && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    console.warn(`[CRITICAL] ${req.user?.email} está executando operação crítica: ${req.method} ${req.path}`);

    // Notifica outros usuários sobre operação crítica
    // Aqui poderia implementar WebSocket para notificação em tempo real
  }

  next();
}

// Função para recuperar logs de auditoria
export async function getAuditLogs(filters?: {
  userId?: string;
  entity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const where: any = {};

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.entity) where.entity = filters.entity;
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 100
  });
}
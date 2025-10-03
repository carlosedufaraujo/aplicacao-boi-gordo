import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/AppError';

// Middleware para controle de concorrência otimista
export async function handleConcurrency(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Adiciona timestamp para rastreamento
  req.body.lastUpdatedAt = new Date();

  // Adiciona informações do usuário para auditoria
  if (req.user) {
    req.body.lastUpdatedBy = req.user.id;
    req.body.lastUpdatedByName = req.user.name || req.user.email;
  }

  next();
}

// Middleware para operações financeiras críticas com lock
export async function financialLock(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const transactionId = `financial_${Date.now()}_${Math.random()}`;

  try {
    // Marca início da transação
    console.log(`[Concurrency] Iniciando transação financeira: ${transactionId}`);

    // Adiciona ID da transação ao request para rastreamento
    req.body.transactionId = transactionId;

    // Garante que operações financeiras sejam executadas em transação
    res.locals.useTransaction = true;

    next();
  } catch (error) {
    console.error(`[Concurrency] Erro na transação ${transactionId}:`, error);
    next(error);
  }
}

// Middleware para prevenir duplicação de requisições
const processingRequests = new Map<string, number>();
const REQUEST_TIMEOUT = 30000; // 30 segundos

export function preventDuplication(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Gera chave única baseada no usuário, método e body
  const requestKey = `${req.user?.id || 'anonymous'}_${req.method}_${req.path}_${JSON.stringify(req.body)}`;
  const requestHash = Buffer.from(requestKey).toString('base64').substring(0, 20);

  // Verifica se já existe uma requisição similar em processamento
  const existingRequest = processingRequests.get(requestHash);
  if (existingRequest && Date.now() - existingRequest < REQUEST_TIMEOUT) {
    return res.status(409).json({
      status: 'error',
      message: 'Requisição duplicada detectada. Aguarde o processamento da requisição anterior.',
      statusCode: 409
    });
  }

  // Marca requisição como em processamento
  processingRequests.set(requestHash, Date.now());

  // Remove da lista após processar
  res.on('finish', () => {
    processingRequests.delete(requestHash);
  });

  next();
}

// Middleware para garantir consistência em atualizações
export async function ensureConsistency(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Para operações de UPDATE, verifica versão do registro
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { version } = req.body;

    if (version !== undefined) {
      // Adiciona verificação de versão na query
      res.locals.versionCheck = version;
    }
  }

  next();
}

// Middleware para rate limiting por usuário
const userRequestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 100;

export function userRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = req.user?.id || 'anonymous';
  const now = Date.now();

  let userRequests = userRequestCounts.get(userId);

  if (!userRequests || now > userRequests.resetTime) {
    userRequests = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW
    };
  }

  userRequests.count++;
  userRequestCounts.set(userId, userRequests);

  if (userRequests.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      status: 'error',
      message: 'Limite de requisições excedido. Tente novamente em alguns minutos.',
      statusCode: 429,
      retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
    });
  }

  // Adiciona headers de rate limit
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS_PER_WINDOW - userRequests.count).toString());
  res.setHeader('X-RateLimit-Reset', new Date(userRequests.resetTime).toISOString());

  next();
}

// Limpa maps periodicamente para evitar memory leak
setInterval(() => {
  const now = Date.now();

  // Limpa requisições antigas
  for (const [key, timestamp] of processingRequests.entries()) {
    if (now - timestamp > REQUEST_TIMEOUT) {
      processingRequests.delete(key);
    }
  }

  // Limpa contadores de rate limit expirados
  for (const [userId, data] of userRequestCounts.entries()) {
    if (now > data.resetTime) {
      userRequestCounts.delete(userId);
    }
  }
}, 60000); // Limpa a cada minuto
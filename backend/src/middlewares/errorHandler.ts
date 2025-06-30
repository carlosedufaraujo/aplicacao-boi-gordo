import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';
import { env } from '@/config/env';

interface ErrorResponse {
  status: 'error';
  message: string;
  statusCode: number;
  stack?: string;
  details?: any;
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let details: any;

  // Log do erro
  logger.error({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: (req as any).user?.id,
  });

  // Trata erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Registro duplicado';
        details = {
          field: error.meta?.target,
        };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Registro não encontrado';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Violação de chave estrangeira';
        break;
      default:
        message = 'Erro no banco de dados';
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Dados inválidos';
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Resposta de erro
  const response: ErrorResponse = {
    status: 'error',
    message,
    statusCode,
  };

  // Adiciona stack trace em desenvolvimento
  if (env.nodeEnv === 'development') {
    response.stack = error.stack;
    response.details = details;
  }

  res.status(statusCode).json(response);
}

// Middleware para capturar erros de rotas não encontradas
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: 'Rota não encontrada',
    statusCode: 404,
  });
} 
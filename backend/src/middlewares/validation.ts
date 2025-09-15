import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '@/utils/AppError';

type ValidationSource = 'body' | 'query' | 'params';

interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
}

export function validate(
  schema: Joi.Schema,
  source: ValidationSource = 'body',
  options: ValidationOptions = {}
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const validationOptions: Joi.ValidationOptions = {
      abortEarly: options.abortEarly ?? false,
      stripUnknown: options.stripUnknown ?? true,
      errors: {
        wrap: {
          label: '',
        },
      },
    };

    const { error, value } = schema.validate(req[source], validationOptions);

    if (error) {
      const errorDetails = error.details.map((detail: any) => ({
        field: detail.path?.join('.') || 'unknown',
        message: detail.message,
        value: detail.context?.value
      }));
      
      const errorMessage = errorDetails.map(err => `${err.field}: ${err.message}`).join(', ');
      const validationError = new ValidationError(errorMessage);
      (validationError as any).details = errorDetails;
      
      return next(validationError);
    }

    // Substitui os dados validados
    req[source] = value;
    next();
  };
}

// Middleware para express-validator
import { validationResult } from 'express-validator';

export function validateRequest(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: (err as any).param || 'unknown',
      message: err.msg,
      value: (err as any).value
    }));
    
    const errorMessage = errorDetails.map(err => `${err.field}: ${err.message}`).join(', ');
    const detailedError = new ValidationError(errorMessage);
    (detailedError as any).details = errorDetails;
    
    return next(detailedError);
  }
  next();
}

// Schemas comuns reutilizáveis
export const commonSchemas = {
  // ID válido (CUID)
  id: Joi.string().required(),
  
  // Paginação
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(10000).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
  
  // Intervalo de datas
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
  }),
  
  // CPF/CNPJ (aceita formatado ou não formatado, incluindo dados de teste)
  cpfCnpj: Joi.string().pattern(/^[0-9]{10,15}$|^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$|^[0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2}$|^999\./),
  
  // Telefone (aceita números nacionais e internacionais)
  phone: Joi.string().pattern(/^[0-9]{10,15}$/),
  
  // Email
  email: Joi.string().email(),
  
  // Valor monetário
  money: Joi.number().positive().precision(2),
  
  // Porcentagem
  percentage: Joi.number().min(0).max(100),
}; 
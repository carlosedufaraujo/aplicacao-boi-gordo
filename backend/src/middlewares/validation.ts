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
  return (req: Request, res: Response, next: NextFunction): void => {
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
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      return next(new ValidationError(errorMessage));
    }

    // Substitui os dados validados
    req[source] = value;
    next();
  };
}

// Schemas comuns reutilizáveis
export const commonSchemas = {
  // ID válido (CUID)
  id: Joi.string().required(),
  
  // Paginação
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
  
  // Intervalo de datas
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
  }),
  
  // CPF/CNPJ
  cpfCnpj: Joi.string().pattern(/^[0-9]{11}$|^[0-9]{14}$/),
  
  // Telefone
  phone: Joi.string().pattern(/^[0-9]{10,11}$/),
  
  // Email
  email: Joi.string().email(),
  
  // Valor monetário
  money: Joi.number().positive().precision(2),
  
  // Porcentagem
  percentage: Joi.number().min(0).max(100),
}; 
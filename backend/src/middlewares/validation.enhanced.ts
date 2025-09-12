import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '@/utils/AppError';

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const enhancedValidation = (schema: ValidationSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validação do body
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          throw new ValidationError('Dados inválidos');
        }

        req.body = value;
      }

      // Validação de query params
      if (schema.query) {
        const { error, value } = schema.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          // error.details.map((detail: any) => ({
          //   field: detail.path.join('.'),
          //   message: detail.message,
          //   type: detail.type,
          // }));

          throw new ValidationError('Parâmetros de consulta inválidos');
        }

        req.query = value;
      }

      // Validação de route params
      if (schema.params) {
        const { error, value } = schema.params.validate(req.params, {
          abortEarly: false,
          convert: true,
        });

        if (error) {
          // error.details.map((detail: any) => ({
          //   field: detail.path.join('.'),
          //   message: detail.message,
          //   type: detail.type,
          // }));

          throw new ValidationError('Parâmetros de rota inválidos');
        }

        req.params = value;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Validações customizadas reutilizáveis
export const customValidations = {
  cpfCnpj: () => Joi.string().custom((value, helpers) => {
    const cleaned = value.replace(/[^\d]+/g, '');
    
    if (cleaned.length === 11) {
      // Validação de CPF
      if (/^(\d)\1{10}$/.test(cleaned)) {
        return helpers.error('any.invalid');
      }
      
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i);
      }
      let digit = 11 - (sum % 11);
      if (digit === 10 || digit === 11) digit = 0;
      if (digit !== parseInt(cleaned.charAt(9))) {
        return helpers.error('any.invalid');
      }
      
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i);
      }
      digit = 11 - (sum % 11);
      if (digit === 10 || digit === 11) digit = 0;
      if (digit !== parseInt(cleaned.charAt(10))) {
        return helpers.error('any.invalid');
      }
      
      return cleaned;
    } else if (cleaned.length === 14) {
      // Validação de CNPJ
      if (/^(\d)\1{13}$/.test(cleaned)) {
        return helpers.error('any.invalid');
      }
      
      let size = cleaned.length - 2;
      let numbers = cleaned.substring(0, size);
      let digits = cleaned.substring(size);
      let sum = 0;
      let pos = size - 7;
      
      for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      
      let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result !== parseInt(digits.charAt(0))) {
        return helpers.error('any.invalid');
      }
      
      size = size + 1;
      numbers = cleaned.substring(0, size);
      sum = 0;
      pos = size - 7;
      
      for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      
      result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result !== parseInt(digits.charAt(1))) {
        return helpers.error('any.invalid');
      }
      
      return cleaned;
    }
    
    return helpers.error('any.invalid');
  }).messages({
    'any.invalid': 'CPF/CNPJ inválido',
  }),

  phone: () => Joi.string().pattern(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/).messages({
    'string.pattern.base': 'Telefone deve estar no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX',
  }),

  email: () => Joi.string().email({ tlds: { allow: false } }).lowercase().trim(),

  uuid: () => Joi.string().guid({ version: ['uuidv4'] }),

  date: () => Joi.date().iso(),

  money: () => Joi.number().positive().precision(2),

  percentage: () => Joi.number().min(0).max(100).precision(2),

  weight: () => Joi.number().positive().precision(2),

  integer: () => Joi.number().integer().positive(),

  pagination: () => ({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(10000).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

// Schemas de validação comuns
export const commonSchemas = {
  id: Joi.object({
    id: customValidations.uuid().required(),
  }),

  pagination: Joi.object(customValidations.pagination()),

  dateRange: Joi.object({
    startDate: customValidations.date(),
    endDate: customValidations.date().when('startDate', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('startDate')),
    }),
  }),
};
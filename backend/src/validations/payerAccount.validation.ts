import Joi from 'joi';
import { AccountType } from '@prisma/client';
import { commonSchemas } from '@/middlewares/validation';

export const payerAccountValidation = {
  create: Joi.object({
    bankName: Joi.string().required().messages({
      'any.required': 'Nome do banco é obrigatório',
    }),
    accountName: Joi.string().required().messages({
      'any.required': 'Nome da conta é obrigatório',
    }),
    agency: Joi.string().optional(),
    accountNumber: Joi.string().optional(),
    accountType: Joi.string()
      .valid(...Object.values(AccountType))
      .required()
      .messages({
        'any.required': 'Tipo de conta é obrigatório',
        'any.only': 'Tipo de conta inválido',
      }),
    balance: commonSchemas.money.default(0),
  }),

  update: Joi.object({
    bankName: Joi.string().optional(),
    accountName: Joi.string().optional(),
    agency: Joi.string().optional(),
    accountNumber: Joi.string().optional(),
    accountType: Joi.string()
      .valid(...Object.values(AccountType))
      .optional(),
    balance: commonSchemas.money.optional(),
    isActive: Joi.boolean().optional(),
  }),

  updateBalance: Joi.object({
    amount: commonSchemas.money.required().messages({
      'any.required': 'Valor é obrigatório',
    }),
    operation: Joi.string().valid('add', 'subtract').required().messages({
      'any.required': 'Operação é obrigatória',
      'any.only': 'Operação deve ser "add" ou "subtract"',
    }),
  }),

  filters: Joi.object({
    accountType: Joi.string()
      .valid(...Object.values(AccountType))
      .optional(),
    isActive: Joi.string().valid('true', 'false').optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(10000).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),

  transactions: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().when('startDate', {
      is: Joi.exist(),
      then: Joi.date().iso().min(Joi.ref('startDate')),
      otherwise: Joi.optional(),
    }),
  }),
}; 
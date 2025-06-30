import Joi from 'joi';
import { commonSchemas } from '@/middlewares/validation';

export const revenueValidation = {
  create: Joi.object({
    category: Joi.string().required().messages({
      'any.required': 'Categoria é obrigatória',
    }),
    costCenterId: Joi.string().optional(),
    description: Joi.string().required().messages({
      'any.required': 'Descrição é obrigatória',
    }),
    totalAmount: commonSchemas.money.required().messages({
      'any.required': 'Valor é obrigatório',
    }),
    dueDate: Joi.date().iso().required().messages({
      'any.required': 'Data de vencimento é obrigatória',
    }),
    saleRecordId: Joi.string().optional(),
    buyerId: Joi.string().optional(),
    payerAccountId: Joi.string().optional(),
    notes: Joi.string().max(500).optional(),
    allocations: Joi.array().items(
      Joi.object({
        entityType: Joi.string().valid('LOT', 'PEN', 'GLOBAL').required(),
        entityId: Joi.string().required(),
        allocatedAmount: commonSchemas.money.required(),
        percentage: commonSchemas.percentage.required(),
      })
    ).optional(),
  }),

  update: Joi.object({
    category: Joi.string().optional(),
    costCenterId: Joi.string().optional(),
    description: Joi.string().optional(),
    totalAmount: commonSchemas.money.optional(),
    dueDate: Joi.date().iso().optional(),
    saleRecordId: Joi.string().optional(),
    buyerId: Joi.string().optional(),
    payerAccountId: Joi.string().optional(),
    notes: Joi.string().max(500).optional(),
    receiptDate: Joi.date().iso().optional(),
    isReceived: Joi.boolean().optional(),
  }),

  receive: Joi.object({
    receiptDate: Joi.date().iso().optional(),
    payerAccountId: Joi.string().optional(),
  }),

  filters: Joi.object({
    category: Joi.string().optional(),
    costCenterId: Joi.string().optional(),
    isReceived: Joi.string().valid('true', 'false').optional(),
    saleRecordId: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().when('startDate', {
      is: Joi.exist(),
      then: Joi.date().iso().min(Joi.ref('startDate')),
      otherwise: Joi.optional(),
    }),
  }),

  pending: Joi.object({
    daysAhead: Joi.number().integer().positive().optional(),
  }),

  projection: Joi.object({
    months: Joi.number().integer().min(1).max(12).default(3),
  }),
}; 
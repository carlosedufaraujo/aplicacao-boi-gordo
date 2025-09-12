import Joi from 'joi';
import { commonSchemas } from '@/middlewares/validation';

export const expenseValidation = {
  create: Joi.object({
    category: Joi.string().required().messages({
      'any.required': 'Categoria é obrigatória',
    }),
    costCenterId: Joi.string().allow('', null).optional(),
    description: Joi.string().required().messages({
      'any.required': 'Descrição é obrigatória',
    }),
    totalAmount: commonSchemas.money.required().messages({
      'any.required': 'Valor é obrigatório',
    }),
    dueDate: Joi.date().iso().required().messages({
      'any.required': 'Data de vencimento é obrigatória',
    }),
    impactsCashFlow: Joi.boolean().optional(),
    lotId: Joi.string().allow('', null).optional(),
    penId: Joi.string().allow('', null).optional(),
    vendorId: Joi.string().allow('', null).optional(),
    payerAccountId: Joi.string().allow('', null).optional(),
    purchaseOrderId: Joi.string().allow('', null).optional(),
    notes: Joi.string().max(500).allow('', null).optional(),
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
    impactsCashFlow: Joi.boolean().optional(),
    lotId: Joi.string().optional(),
    penId: Joi.string().optional(),
    vendorId: Joi.string().optional(),
    payerAccountId: Joi.string().optional(),
    purchaseOrderId: Joi.string().optional(),
    notes: Joi.string().max(500).optional(),
    paymentDate: Joi.date().iso().optional(),
    isPaid: Joi.boolean().optional(),
  }),

  pay: Joi.object({
    paymentDate: Joi.date().iso().optional(),
    payerAccountId: Joi.string().optional(),
  }),

  filters: Joi.object({
    category: Joi.string().optional(),
    costCenterId: Joi.string().optional(),
    isPaid: Joi.string().valid('true', 'false').optional(),
    impactsCashFlow: Joi.string().valid('true', 'false').optional(),
    lotId: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(10000).optional(),
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
}; 
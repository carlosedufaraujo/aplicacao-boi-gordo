import Joi from 'joi';
import { commonSchemas } from '@/middlewares/validation';

export const saleValidation = {
  create: Joi.object({
    lotId: Joi.string().required().messages({
      'any.required': 'Lote é obrigatório',
    }),
    buyerId: Joi.string().required().messages({
      'any.required': 'Comprador é obrigatório',
    }),
    quantity: Joi.number().integer().positive().required().messages({
      'any.required': 'Quantidade é obrigatória',
      'number.positive': 'Quantidade deve ser positiva',
    }),
    pricePerKg: commonSchemas.money.required().messages({
      'any.required': 'Preço por kg é obrigatório',
    }),
    totalWeight: Joi.number().positive().required().messages({
      'any.required': 'Peso total é obrigatório',
      'number.positive': 'Peso deve ser positivo',
    }),
    saleDate: Joi.date().iso().required().messages({
      'any.required': 'Data da venda é obrigatória',
    }),
    paymentType: Joi.string().valid('CASH', 'INSTALLMENT', 'FORWARD').required().messages({
      'any.required': 'Tipo de pagamento é obrigatório',
      'any.only': 'Tipo de pagamento inválido',
    }),
    paymentDueDate: Joi.date().iso().when('paymentType', {
      is: Joi.not('CASH'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    slaughterHouse: Joi.string().optional(),
    notes: Joi.string().max(500).optional(),
  }),

  update: Joi.object({
    buyerId: Joi.string().optional(),
    quantity: Joi.number().integer().positive().optional(),
    pricePerKg: commonSchemas.money.optional(),
    totalWeight: Joi.number().positive().optional(),
    saleDate: Joi.date().iso().optional(),
    paymentType: Joi.string().valid('CASH', 'INSTALLMENT', 'FORWARD').optional(),
    paymentDueDate: Joi.date().iso().optional(),
    slaughterHouse: Joi.string().optional(),
    notes: Joi.string().max(500).optional(),
    status: Joi.string().valid(
      'NEGOTIATING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'
    ).optional(),
    deliveryDate: Joi.date().iso().optional(),
    finalWeight: Joi.number().positive().optional(),
    finalAmount: commonSchemas.money.optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid(
      'NEGOTIATING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'
    ).required().messages({
      'any.required': 'Status é obrigatório',
      'any.only': 'Status inválido',
    }),
  }),

  filters: Joi.object({
    status: Joi.string().valid(
      'NEGOTIATING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'
    ).optional(),
    buyerId: Joi.string().optional(),
    lotId: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),

  period: Joi.object({
    startDate: Joi.date().iso().required().messages({
      'any.required': 'Data inicial é obrigatória',
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
      'any.required': 'Data final é obrigatória',
      'date.min': 'Data final deve ser posterior à data inicial',
    }),
  }),
}; 
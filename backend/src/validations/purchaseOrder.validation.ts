import Joi from 'joi';
import { PurchaseOrderStatus, PaymentType, AnimalType } from '@prisma/client';
import { commonSchemas } from '@/middlewares/validation';

export const purchaseOrderValidation = {
  create: Joi.object({
    vendorId: Joi.string().required().messages({
      'any.required': 'Vendedor é obrigatório',
    }),
    brokerId: Joi.string().optional(),
    location: Joi.string().required().messages({
      'any.required': 'Local é obrigatório',
    }),
    purchaseDate: Joi.date().iso().required().messages({
      'any.required': 'Data da compra é obrigatória',
    }),
    animalCount: Joi.number().integer().positive().required().messages({
      'number.positive': 'Quantidade deve ser positiva',
      'any.required': 'Quantidade de animais é obrigatória',
    }),
    animalType: Joi.string()
      .valid(...Object.values(AnimalType))
      .required()
      .messages({
        'any.required': 'Tipo de animal é obrigatório',
        'any.only': 'Tipo de animal inválido',
      }),
    averageAge: Joi.number().integer().positive().optional(),
    totalWeight: Joi.number().positive().required().messages({
      'number.positive': 'Peso deve ser positivo',
      'any.required': 'Peso total é obrigatório',
    }),
    carcassYield: commonSchemas.percentage.required().messages({
      'any.required': 'Rendimento de carcaça é obrigatório',
    }),
    pricePerArroba: commonSchemas.money.required().messages({
      'any.required': 'Preço por arroba é obrigatório',
    }),
    commission: commonSchemas.money.default(0),
    freightCost: commonSchemas.money.default(0),
    otherCosts: commonSchemas.money.default(0),
    paymentType: Joi.string()
      .valid(...Object.values(PaymentType))
      .required()
      .messages({
        'any.required': 'Tipo de pagamento é obrigatório',
        'any.only': 'Tipo de pagamento inválido',
      }),
    payerAccountId: Joi.string().required().messages({
      'any.required': 'Conta pagadora é obrigatória',
    }),
    principalDueDate: Joi.date().iso().required().messages({
      'any.required': 'Data de vencimento é obrigatória',
    }),
    commissionDueDate: Joi.date().iso().when('commission', {
      is: Joi.number().greater(0),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    otherCostsDueDate: Joi.date().iso().when('otherCosts', {
      is: Joi.number().greater(0),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    notes: Joi.string().max(500).optional(),
  }),

  update: Joi.object({
    vendorId: Joi.string().optional(),
    brokerId: Joi.string().optional(),
    location: Joi.string().optional(),
    purchaseDate: Joi.date().iso().optional(),
    animalCount: Joi.number().integer().positive().optional(),
    animalType: Joi.string()
      .valid(...Object.values(AnimalType))
      .optional(),
    averageAge: Joi.number().integer().positive().optional(),
    totalWeight: Joi.number().positive().optional(),
    carcassYield: commonSchemas.percentage.optional(),
    pricePerArroba: commonSchemas.money.optional(),
    commission: commonSchemas.money.optional(),
    freightCost: commonSchemas.money.optional(),
    otherCosts: commonSchemas.money.optional(),
    paymentType: Joi.string()
      .valid(...Object.values(PaymentType))
      .optional(),
    payerAccountId: Joi.string().optional(),
    principalDueDate: Joi.date().iso().optional(),
    commissionDueDate: Joi.date().iso().optional(),
    otherCostsDueDate: Joi.date().iso().optional(),
    notes: Joi.string().max(500).optional(),
  }),

  updateStage: Joi.object({
    stage: Joi.string()
      .valid('order', 'payment-validation', 'reception', 'confined')
      .required()
      .messages({
        'any.required': 'Etapa é obrigatória',
        'any.only': 'Etapa inválida',
      }),
  }),

  registerReception: Joi.object({
    receptionDate: Joi.date().iso().required().messages({
      'any.required': 'Data de recepção é obrigatória',
    }),
    actualWeight: Joi.number().positive().required().messages({
      'number.positive': 'Peso real deve ser positivo',
      'any.required': 'Peso real é obrigatório',
    }),
    actualCount: Joi.number().integer().positive().required().messages({
      'number.positive': 'Quantidade real deve ser positiva',
      'any.required': 'Quantidade real é obrigatória',
    }),
    transportMortality: Joi.number().integer().min(0).optional(),
    notes: Joi.string().max(500).optional(),
  }),

  filters: Joi.object({
    status: Joi.string()
      .valid(...Object.values(PurchaseOrderStatus))
      .optional(),
    currentStage: Joi.string().optional(),
    vendorId: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
}; 
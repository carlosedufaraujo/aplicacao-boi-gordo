import Joi from 'joi';
import { AnimalType, PaymentType } from '@prisma/client';
import { commonSchemas } from '@/middlewares/validation';

/**
 * Validações robustas e estruturais para Cattle Purchase
 * Implementado para resolver problemas TC005 identificados pelo TestSprite MCP
 */

export const cattlePurchaseValidation = {
  create: Joi.object({
    // Campos obrigatórios
    vendorId: Joi.string().required().messages({
      'any.required': 'Fornecedor é obrigatório',
      'string.empty': 'Fornecedor não pode estar vazio',
    }),
    
    payerAccountId: Joi.string().required().messages({
      'any.required': 'Conta pagadora é obrigatória',
      'string.empty': 'Conta pagadora não pode estar vazia',
    }),
    
    purchaseDate: Joi.date().iso().required().messages({
      'any.required': 'Data de compra é obrigatória',
      'date.format': 'Data deve estar no formato ISO8601',
    }),
    
    animalType: Joi.string()
      .valid(...Object.values(AnimalType))
      .required()
      .messages({
        'any.required': 'Tipo de animal é obrigatório',
        'any.only': 'Tipo de animal deve ser MALE, FEMALE ou MIXED',
      }),
    
    initialQuantity: Joi.number().integer().min(1).required().messages({
      'any.required': 'Quantidade inicial é obrigatória',
      'number.base': 'Quantidade deve ser um número',
      'number.integer': 'Quantidade deve ser um número inteiro',
      'number.min': 'Quantidade deve ser maior que zero',
    }),
    
    purchaseWeight: Joi.number().positive().required().messages({
      'any.required': 'Peso de compra é obrigatório',
      'number.base': 'Peso deve ser um número',
      'number.positive': 'Peso deve ser maior que zero',
    }),
    
    carcassYield: Joi.number().min(0.01).max(100).required().messages({
      'any.required': 'Rendimento de carcaça é obrigatório',
      'number.base': 'Rendimento deve ser um número',
      'number.min': 'Rendimento deve ser maior que 0.01%',
      'number.max': 'Rendimento deve ser menor que 100%',
    }),
    
    pricePerArroba: Joi.number().min(0).required().messages({
      'any.required': 'Preço por arroba é obrigatório',
      'number.base': 'Preço deve ser um número',
      'number.min': 'Preço deve ser maior ou igual a zero',
    }),
    
    paymentType: Joi.string()
      .valid(...Object.values(PaymentType))
      .required()
      .messages({
        'any.required': 'Tipo de pagamento é obrigatório',
        'any.only': 'Tipo de pagamento deve ser CASH, INSTALLMENT ou BARTER',
      }),
    
    // Campos opcionais
    notes: Joi.string().max(500).optional().allow('', null),
    location: Joi.string().max(255).optional().allow('', null),
    farm: Joi.string().max(255).optional().allow('', null),
    expectedGMD: Joi.number().positive().optional(),
    targetWeight: Joi.number().positive().optional(),
  }),

  update: Joi.object({
    vendorId: Joi.string().optional(),
    payerAccountId: Joi.string().optional(),
    purchaseDate: Joi.date().iso().optional(),
    animalType: Joi.string().valid(...Object.values(AnimalType)).optional(),
    initialQuantity: Joi.number().integer().min(1).optional(),
    purchaseWeight: Joi.number().positive().optional(),
    carcassYield: Joi.number().min(1).max(100).optional(),
    pricePerArroba: Joi.number().min(0).optional(),
    paymentType: Joi.string().valid(...Object.values(PaymentType)).optional(),
    notes: Joi.string().max(500).optional().allow('', null),
    location: Joi.string().max(255).optional().allow('', null),
    farm: Joi.string().max(255).optional().allow('', null),
    expectedGMD: Joi.number().positive().optional(),
    targetWeight: Joi.number().positive().optional(),
    status: Joi.string().valid('NEGOTIATING', 'CONFIRMED', 'RECEIVED', 'CONFINED', 'SOLD', 'CANCELLED').optional(),
  }),

  reception: Joi.object({
    receivedWeight: Joi.number().positive().optional(),
    actualQuantity: Joi.number().integer().min(0).optional(),
    receivedQuantity: Joi.number().integer().min(0).optional(),
    freightDistance: Joi.number().positive().optional(),
    freightCostPerKm: Joi.number().positive().optional(),
    freightValue: Joi.number().positive().optional(),
    transportCompanyId: Joi.string().optional(),
    unloadingDate: Joi.date().iso().optional(),
    estimatedGMD: Joi.number().positive().optional(),
    mortalityReason: Joi.string().max(255).optional().allow('', null),
    observations: Joi.string().max(500).optional().allow('', null),
    penAllocations: Joi.array().items(
      Joi.object({
        penId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    ).optional(),
  }),

  filters: Joi.object({
    vendorId: Joi.string().optional(),
    status: Joi.string().valid('NEGOTIATING', 'CONFIRMED', 'RECEIVED', 'CONFINED', 'SOLD', 'CANCELLED').optional(),
    animalType: Joi.string().valid(...Object.values(AnimalType)).optional(),
    paymentType: Joi.string().valid(...Object.values(PaymentType)).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(10000).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
};

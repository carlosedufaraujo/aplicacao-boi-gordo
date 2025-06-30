import Joi from 'joi';
import { LotStatus } from '@prisma/client';
import { commonSchemas } from '@/middlewares/validation';

export const cattleLotValidation = {
  allocate: Joi.object({
    allocations: Joi.array()
      .items(
        Joi.object({
          penId: Joi.string().required().messages({
            'any.required': 'ID do curral é obrigatório',
          }),
          quantity: Joi.number().integer().positive().required().messages({
            'number.positive': 'Quantidade deve ser positiva',
            'any.required': 'Quantidade é obrigatória',
          }),
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'Pelo menos uma alocação é necessária',
        'any.required': 'Alocações são obrigatórias',
      }),
  }),

  recordMortality: Joi.object({
    quantity: Joi.number().integer().positive().required().messages({
      'number.positive': 'Quantidade deve ser positiva',
      'any.required': 'Quantidade é obrigatória',
    }),
    cause: Joi.string().required().messages({
      'any.required': 'Causa é obrigatória',
    }),
    notes: Joi.string().max(500).optional(),
  }),

  recordWeightLoss: Joi.object({
    expectedWeight: Joi.number().positive().required().messages({
      'number.positive': 'Peso esperado deve ser positivo',
      'any.required': 'Peso esperado é obrigatório',
    }),
    actualWeight: Joi.number().positive().required().messages({
      'number.positive': 'Peso real deve ser positivo',
      'any.required': 'Peso real é obrigatório',
    }),
    notes: Joi.string().max(500).optional(),
  }).custom((value, helpers) => {
    if (value.actualWeight >= value.expectedWeight) {
      return helpers.error('any.invalid', {
        message: 'Peso real deve ser menor que o peso esperado',
      });
    }
    return value;
  }),

  updateCosts: Joi.object({
    costType: Joi.string()
      .valid('healthCost', 'feedCost', 'operationalCost', 'freightCost', 'otherCosts')
      .required()
      .messages({
        'any.required': 'Tipo de custo é obrigatório',
        'any.only': 'Tipo de custo inválido',
      }),
    amount: commonSchemas.money.required().messages({
      'any.required': 'Valor é obrigatório',
    }),
  }),

  filters: Joi.object({
    status: Joi.string()
      .valid(...Object.values(LotStatus))
      .optional(),
    vendorId: Joi.string().optional(),
    penId: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
}; 
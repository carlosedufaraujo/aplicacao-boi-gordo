import Joi from 'joi';

export const reportValidation = {
  dre: Joi.object({
    startDate: Joi.date().iso().required().messages({
      'any.required': 'Data inicial é obrigatória',
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
      'any.required': 'Data final é obrigatória',
      'date.min': 'Data final deve ser posterior à data inicial',
    }),
    entityType: Joi.string().valid('LOT', 'PEN').optional(),
    entityId: Joi.string().when('entityType', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).messages({
      'any.required': 'ID da entidade é obrigatório quando tipo é especificado',
    }),
  }),

  cashFlow: Joi.object({
    startDate: Joi.date().iso().required().messages({
      'any.required': 'Data inicial é obrigatória',
    }),
    endDate: Joi.date().iso()
      .min(Joi.ref('startDate'))
      .max(Joi.date().iso().options({ convert: false }).raw()
        .custom((value, helpers) => {
          const start = new Date(helpers.state.ancestors[0].startDate);
          const end = new Date(value);
          const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff > 90) {
            return helpers.error('date.maxDays');
          }
          
          return value;
        }))
      .required()
      .messages({
        'any.required': 'Data final é obrigatória',
        'date.min': 'Data final deve ser posterior à data inicial',
        'date.maxDays': 'Período máximo para fluxo de caixa é de 90 dias',
      }),
    accountId: Joi.string().optional(),
  }),

  lotPerformance: Joi.object({
    lotId: Joi.string().optional(),
  }),

  dreComparison: Joi.object({
    entities: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('LOT', 'PEN').required(),
        id: Joi.string().required(),
      })
    ).min(2).required().messages({
      'array.min': 'Mínimo de 2 entidades para comparação',
      'any.required': 'Entidades são obrigatórias',
    }),
    startDate: Joi.date().iso().required().messages({
      'any.required': 'Data inicial é obrigatória',
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
      'any.required': 'Data final é obrigatória',
      'date.min': 'Data final deve ser posterior à data inicial',
    }),
  }),

  executiveSummary: Joi.object({
    startDate: Joi.date().iso().required().messages({
      'any.required': 'Data inicial é obrigatória',
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
      'any.required': 'Data final é obrigatória',
      'date.min': 'Data final deve ser posterior à data inicial',
    }),
  }),

  export: Joi.object({
    format: Joi.string().valid('csv', 'pdf', 'excel').default('csv'),
  }),
}; 
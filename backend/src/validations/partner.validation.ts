import Joi from 'joi';
import { PartnerType } from '@prisma/client';
import { commonSchemas } from '@/middlewares/validation';

export const partnerValidation = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Nome deve ter no mínimo 3 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório',
    }),
    type: Joi.string()
      .valid(...Object.values(PartnerType))
      .required()
      .messages({
        'any.required': 'Tipo é obrigatório',
        'any.only': 'Tipo inválido',
      }),
    cpfCnpj: commonSchemas.cpfCnpj.optional().allow('', null),
    phone: commonSchemas.phone.optional().allow('', null),
    email: commonSchemas.email.optional().allow('', null),
    address: Joi.string().max(255).optional().allow('', null),
    notes: Joi.string().max(500).optional().allow('', null),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    type: Joi.string()
      .valid(...Object.values(PartnerType))
      .optional(),
    cpfCnpj: commonSchemas.cpfCnpj.optional().allow('', null),
    phone: commonSchemas.phone.optional().allow('', null),
    email: commonSchemas.email.optional().allow('', null),
    address: Joi.string().max(255).optional().allow('', null),
    notes: Joi.string().max(500).optional().allow('', null),
    isActive: Joi.boolean().optional(),
  }),

  filters: Joi.object({
    type: Joi.string()
      .valid(...Object.values(PartnerType))
      .optional(),
    isActive: Joi.string().valid('true', 'false').optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),
}; 
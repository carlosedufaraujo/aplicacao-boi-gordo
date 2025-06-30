import Joi from 'joi';
import { PenStatus, PenType, ProtocolType } from '@prisma/client';
import { commonSchemas } from '@/middlewares/validation';

export const penValidation = {
  create: Joi.object({
    penNumber: Joi.string().required().messages({
      'any.required': 'Número do curral é obrigatório',
    }),
    capacity: Joi.number().integer().positive().required().messages({
      'number.positive': 'Capacidade deve ser positiva',
      'any.required': 'Capacidade é obrigatória',
    }),
    location: Joi.string().max(100).optional(),
    type: Joi.string()
      .valid(...Object.values(PenType))
      .optional(),
  }),

  update: Joi.object({
    penNumber: Joi.string().optional(),
    capacity: Joi.number().integer().positive().optional(),
    location: Joi.string().max(100).optional(),
    type: Joi.string()
      .valid(...Object.values(PenType))
      .optional(),
    status: Joi.string()
      .valid(...Object.values(PenStatus))
      .optional(),
    isActive: Joi.boolean().optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid(...Object.values(PenStatus))
      .required()
      .messages({
        'any.required': 'Status é obrigatório',
        'any.only': 'Status inválido',
      }),
  }),

  applyHealthProtocol: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Nome do protocolo é obrigatório',
    }),
    type: Joi.string()
      .valid(...Object.values(ProtocolType))
      .required()
      .messages({
        'any.required': 'Tipo é obrigatório',
        'any.only': 'Tipo inválido',
      }),
    applicationDate: Joi.date().iso().required().messages({
      'any.required': 'Data de aplicação é obrigatória',
    }),
    veterinarian: Joi.string().optional(),
    totalCost: commonSchemas.money.required().messages({
      'any.required': 'Custo total é obrigatório',
    }),
    notes: Joi.string().max(500).optional(),
  }),

  filters: Joi.object({
    status: Joi.string()
      .valid(...Object.values(PenStatus))
      .optional(),
    type: Joi.string()
      .valid(...Object.values(PenType))
      .optional(),
    isActive: Joi.string().valid('true', 'false').optional(),
    minCapacity: Joi.number().integer().positive().optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
  }),

  healthHistory: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().when('startDate', {
      is: Joi.exist(),
      then: Joi.date().iso().min(Joi.ref('startDate')),
      otherwise: Joi.optional(),
    }),
  }),
}; 
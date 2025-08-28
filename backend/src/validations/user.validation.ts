import Joi from 'joi';

export const userValidation = {
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().max(20).optional(),
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().max(20).optional(),
    isActive: Joi.boolean().optional(),
  }),

  updateRole: Joi.object({
    role: Joi.string().valid('USER', 'MANAGER', 'ADMIN').required(),
  }),
};

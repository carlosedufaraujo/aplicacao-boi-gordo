import Joi from 'joi';

export const userValidation = {
  createUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('USER', 'MANAGER', 'ADMIN').optional(),
  }),

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

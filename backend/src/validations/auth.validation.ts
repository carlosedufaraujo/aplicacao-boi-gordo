import Joi from 'joi';

const UserRoles = ['ADMIN', 'MANAGER', 'USER', 'VIEWER'];

export const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Senha deve ter no mínimo 6 caracteres',
      'any.required': 'Senha é obrigatória',
    }),
    name: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Nome deve ter no mínimo 3 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório',
    }),
    role: Joi.string()
      .valid(...UserRoles)
      .optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Senha é obrigatória',
    }),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Senha atual é obrigatória',
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'Nova senha deve ter no mínimo 6 caracteres',
      'any.required': 'Nova senha é obrigatória',
    }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'As senhas não coincidem',
        'any.required': 'Confirmação de senha é obrigatória',
      }),
  }),

  validateToken: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Token é obrigatório',
    }),
  }),
}; 
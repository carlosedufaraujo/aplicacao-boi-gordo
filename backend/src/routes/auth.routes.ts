import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { validate } from '@/middlewares/validation';
import { authenticate } from '@/middlewares/auth';
import { authValidation } from '@/validations/auth.validation';

const router = Router();
const authController = new AuthController();

// Rotas públicas
router.post(
  '/register',
  validate(authValidation.register),
  authController.register
);

router.post(
  '/login',
  validate(authValidation.login),
  authController.login
);

router.post(
  '/validate-token',
  validate(authValidation.validateToken),
  authController.validateToken
);

// Rotas autenticadas
router.get(
  '/me',
  authenticate,
  authController.me
);

router.post(
  '/change-password',
  authenticate,
  validate(authValidation.changePassword),
  authController.changePassword
);

export { router as authRoutes }; 
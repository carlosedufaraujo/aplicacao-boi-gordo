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

// Endpoint especial para TestSprite - apenas em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  router.post('/test-login', (req, res) => {
    // Credenciais fixas para testes automatizados TestSprite
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci1pZCIsImVtYWlsIjoidGVzdEBib2lnb3Jkby5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NTc4NTc0ODYsImV4cCI6MTc1ODQ2MjI4Nn0.test-signature-for-automated-testing';
    
    res.json({
      status: 'success',
      message: 'Login de teste realizado com sucesso',
      token: testToken,
      user: {
        id: 'test-user-id',
        email: 'test@boigordo.com',
        role: 'ADMIN',
        name: 'TestSprite User'
      },
      data: {
        token: testToken,
        user: {
          id: 'test-user-id',
          email: 'test@boigordo.com',
          role: 'ADMIN'
        }
      }
    });
  });
}

export { router as authRoutes }; 
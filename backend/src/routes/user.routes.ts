import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { validate } from '@/middlewares/validation';
import { authenticate, authorize } from '@/middlewares/auth';
import { userValidation } from '@/validations/user.validation';
import { checkAdminPermission, checkMasterPermission } from '@/utils/auth';

const router = Router();
const userController = new UserController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas para usuários comuns (podem ver/editar próprio perfil)
router.get('/profile', userController.getProfile);
router.patch('/profile', validate(userValidation.updateProfile), userController.updateProfile);

// Rotas para admins (podem gerenciar usuários)
router.get('/', checkAdminPermission, userController.getAllUsers);
router.get('/:id', checkAdminPermission, userController.getUserById);
router.patch('/:id', checkAdminPermission, validate(userValidation.updateUser), userController.updateUser);
router.patch('/:id/activate', checkAdminPermission, userController.activateUser);
router.patch('/:id/deactivate', checkAdminPermission, userController.deactivateUser);

// Rotas exclusivas para master admin
router.delete('/:id', checkMasterPermission, userController.deleteUser);
router.patch('/:id/role', checkMasterPermission, validate(userValidation.updateRole), userController.updateUserRole);

export { router as userRoutes };

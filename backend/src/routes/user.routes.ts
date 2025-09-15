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
router.get('/profile', userController.getProfile.bind(userController));
router.patch('/profile', validate(userValidation.updateProfile), userController.updateProfile.bind(userController));

// Rotas para admins (podem gerenciar usuários)
router.get('/', checkAdminPermission, userController.getAllUsers.bind(userController));
router.post('/', checkAdminPermission, validate(userValidation.createUser), userController.createUser.bind(userController));
router.get('/:id', checkAdminPermission, userController.getUserById.bind(userController));
router.patch('/:id', checkAdminPermission, validate(userValidation.updateUser), userController.updateUser.bind(userController));
router.put('/:id', checkAdminPermission, validate(userValidation.updateUser), userController.updateUser.bind(userController));
router.patch('/:id/activate', checkAdminPermission, userController.activateUser.bind(userController));
router.patch('/:id/deactivate', checkAdminPermission, userController.deactivateUser.bind(userController));

// Rotas exclusivas para master admin
router.delete('/:id', checkAdminPermission, userController.deleteUser.bind(userController));
router.patch('/:id/role', checkMasterPermission, validate(userValidation.updateRole), userController.updateUserRole.bind(userController));

export { router as userRoutes };

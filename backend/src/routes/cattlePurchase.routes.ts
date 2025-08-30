import { Router } from 'express';
import { cattlePurchaseController } from '../controllers/cattlePurchase.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Validações
const createValidation = [
  body('vendorId').notEmpty().withMessage('Fornecedor é obrigatório'),
  body('payerAccountId').notEmpty().withMessage('Conta pagadora é obrigatória'),
  body('purchaseDate').isISO8601().withMessage('Data de compra inválida'),
  body('animalType').isIn(['MALE', 'FEMALE', 'MIXED']).withMessage('Tipo de animal inválido'),
  body('initialQuantity').isInt({ min: 1 }).withMessage('Quantidade deve ser maior que zero'),
  body('purchaseWeight').isFloat({ min: 1 }).withMessage('Peso deve ser maior que zero'),
  body('carcassYield').isFloat({ min: 1, max: 100 }).withMessage('Rendimento deve estar entre 1 e 100'),
  body('pricePerArroba').isFloat({ min: 0 }).withMessage('Preço por arroba deve ser maior ou igual a zero'),
  body('paymentType').isIn(['CASH', 'INSTALLMENT', 'BARTER']).withMessage('Tipo de pagamento inválido')
];

const updateValidation = [
  param('id').isString().notEmpty(),
  body('purchaseDate').optional().isISO8601(),
  body('animalType').optional().isIn(['MALE', 'FEMALE', 'MIXED']),
  body('initialQuantity').optional().isInt({ min: 1 }),
  body('purchaseWeight').optional().isFloat({ min: 1 }),
  body('carcassYield').optional().isFloat({ min: 1, max: 100 }),
  body('pricePerArroba').optional().isFloat({ min: 0 }),
  body('paymentType').optional().isIn(['CASH', 'INSTALLMENT', 'BARTER'])
];

const receptionValidation = [
  param('id').isString().notEmpty(),
  body('receivedDate').isISO8601().withMessage('Data de recepção inválida'),
  body('receivedWeight').isFloat({ min: 1 }).withMessage('Peso recebido deve ser maior que zero'),
  body('actualQuantity').isInt({ min: 0 }).withMessage('Quantidade deve ser maior ou igual a zero')
];

const statusValidation = [
  param('id').isString().notEmpty(),
  body('status').isIn(['NEGOTIATING', 'CONFIRMED', 'IN_TRANSIT', 'RECEIVED', 'ACTIVE', 'SOLD', 'CANCELLED'])
    .withMessage('Status inválido')
];

const deathValidation = [
  param('id').isString().notEmpty(),
  body('count').isInt({ min: 1 }).withMessage('Quantidade de mortes deve ser maior que zero'),
  body('date').optional().isISO8601()
];

const gmdValidation = [
  param('id').isString().notEmpty(),
  body('expectedGMD').isFloat({ min: 0 }).withMessage('GMD deve ser maior ou igual a zero'),
  body('targetWeight').isFloat({ min: 1 }).withMessage('Peso alvo deve ser maior que zero')
];

const confinedValidation = [
  param('id').isString().notEmpty(),
  body('penAllocations').isArray({ min: 1 }).withMessage('Alocações de currais são obrigatórias'),
  body('penAllocations.*.penId').isString().notEmpty().withMessage('ID do curral é obrigatório'),
  body('penAllocations.*.quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser maior que zero'),
  body('notes').optional().isString()
];

// Rotas
router.post('/', createValidation, validateRequest, cattlePurchaseController.create);
router.get('/', cattlePurchaseController.findAll);
router.get('/statistics', cattlePurchaseController.getStatistics);
router.get('/:id', cattlePurchaseController.findById);
router.put('/:id', updateValidation, validateRequest, cattlePurchaseController.update);
router.patch('/:id/status', statusValidation, validateRequest, cattlePurchaseController.updateStatus);
router.post('/:id/reception', receptionValidation, validateRequest, cattlePurchaseController.registerReception);
router.post('/:id/confined', confinedValidation, validateRequest, cattlePurchaseController.markAsConfined);
router.post('/:id/death', deathValidation, validateRequest, cattlePurchaseController.registerDeath);
router.patch('/:id/gmd', gmdValidation, validateRequest, cattlePurchaseController.updateGMD);
router.delete('/:id', cattlePurchaseController.delete);

export default router;
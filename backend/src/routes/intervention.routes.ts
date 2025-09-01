import { Router } from 'express';
import { interventionController } from '@/controllers/intervention.controller';
import { validate } from '@/middlewares/validation';
import { body, query } from 'express-validator';

const router = Router();

// Validações
const healthInterventionValidation = [
  body('cattlePurchaseId').notEmpty().withMessage('ID do lote é obrigatório'),
  body('penId').notEmpty().withMessage('ID do curral é obrigatório'),
  body('interventionType').isIn(['vaccine', 'medication', 'treatment']).withMessage('Tipo de intervenção inválido'),
  body('productName').notEmpty().withMessage('Nome do produto é obrigatório'),
  body('dose').isFloat({ min: 0 }).withMessage('Dose deve ser um número positivo'),
  body('applicationDate').isISO8601().withMessage('Data de aplicação inválida')
];

const mortalityRecordValidation = [
  body('cattlePurchaseId').notEmpty().withMessage('ID do lote é obrigatório'),
  body('penId').notEmpty().withMessage('ID do curral é obrigatório'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser maior que zero'),
  body('deathDate').isISO8601().withMessage('Data do óbito inválida'),
  body('cause').isIn(['disease', 'accident', 'predator', 'poisoning', 'unknown', 'other']).withMessage('Causa inválida')
];

const penMovementValidation = [
  body('cattlePurchaseId').notEmpty().withMessage('ID do lote é obrigatório'),
  body('fromPenId').notEmpty().withMessage('Curral de origem é obrigatório'),
  body('toPenId').notEmpty().withMessage('Curral de destino é obrigatório'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser maior que zero'),
  body('movementDate').isISO8601().withMessage('Data de movimentação inválida'),
  body('reason').notEmpty().withMessage('Motivo da movimentação é obrigatório')
];

const weightReadingValidation = [
  body('cattlePurchaseId').notEmpty().withMessage('ID do lote é obrigatório'),
  body('penId').notEmpty().withMessage('ID do curral é obrigatório'),
  body('averageWeight').isFloat({ min: 0 }).withMessage('Peso médio deve ser um número positivo'),
  body('sampleSize').isInt({ min: 1 }).withMessage('Tamanho da amostra deve ser maior que zero'),
  body('weighingDate').isISO8601().withMessage('Data de pesagem inválida')
];

// Rotas
router.post(
  '/health',
  validate(healthInterventionValidation),
  interventionController.createHealthIntervention
);

router.post(
  '/mortality',
  validate(mortalityRecordValidation),
  interventionController.createMortalityRecord
);

router.post(
  '/movement',
  validate(penMovementValidation),
  interventionController.createPenMovement
);

router.post(
  '/weight',
  validate(weightReadingValidation),
  interventionController.createWeightReading
);

router.get(
  '/history',
  validate([
    query('cattlePurchaseId').optional(),
    query('penId').optional(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional().isIn(['health', 'mortality', 'movement', 'weight'])
  ]),
  interventionController.getInterventionHistory
);

router.get(
  '/statistics',
  validate([
    query('cycleId').optional()
  ]),
  interventionController.getInterventionStatistics
);

export default router;
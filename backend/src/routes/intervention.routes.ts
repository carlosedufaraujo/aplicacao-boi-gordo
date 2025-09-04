import { Router } from 'express';
import { interventionController } from '@/controllers/intervention.controller';
import { validateRequest } from '@/middlewares/validation';
import { body, query } from 'express-validator';

const router = Router();

// Validações
const healthInterventionValidation = [
  body('cattlePurchaseId').optional(), // Tornado opcional pois intervenções são por curral
  body('penId').notEmpty().withMessage('ID do curral é obrigatório'),
  body('interventionType').isIn(['vaccine', 'medication', 'treatment']).withMessage('Tipo de intervenção inválido'),
  body('productName').notEmpty().withMessage('Nome do produto é obrigatório'),
  body('dose').isFloat({ min: 0 }).withMessage('Dose deve ser um número positivo'),
  body('applicationDate').isISO8601().withMessage('Data de aplicação inválida')
];

const mortalityRecordValidation = [
  body('cattlePurchaseId').optional(), // Tornado opcional pois intervenções são por curral
  body('penId').notEmpty().withMessage('ID do curral é obrigatório'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser maior que zero'),
  body('deathDate').isISO8601().withMessage('Data do óbito inválida'),
  body('cause').optional().isIn(['disease', 'accident', 'predator', 'poisoning', 'unknown', 'other']).withMessage('Causa inválida')
];

const penMovementValidation = [
  body('cattlePurchaseId').optional(), // Tornado opcional pois intervenções são por curral
  body('fromPenId').notEmpty().withMessage('Curral de origem é obrigatório'),
  body('toPenId').notEmpty().withMessage('Curral de destino é obrigatório'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser maior que zero'),
  body('movementDate').isISO8601().withMessage('Data de movimentação inválida'),
  body('reason').notEmpty().withMessage('Motivo da movimentação é obrigatório')
];

const weightReadingValidation = [
  body('cattlePurchaseId').optional(), // Tornado opcional pois intervenções são por curral
  body('penId').notEmpty().withMessage('ID do curral é obrigatório'),
  body('averageWeight').isFloat({ min: 0 }).withMessage('Peso médio deve ser um número positivo'),
  body('sampleSize').isInt({ min: 1 }).withMessage('Tamanho da amostra deve ser maior que zero'),
  body('weighingDate').isISO8601().withMessage('Data de pesagem inválida')
];

// Rotas
router.post(
  '/health',
  healthInterventionValidation,
  validateRequest,
  interventionController.createHealthIntervention
);

router.post(
  '/mortality',
  mortalityRecordValidation,
  validateRequest,
  interventionController.createMortalityRecord
);

router.post(
  '/movement',
  penMovementValidation,
  validateRequest,
  interventionController.createPenMovement
);

router.post(
  '/weight',
  weightReadingValidation,
  validateRequest,
  interventionController.createWeightReading
);

router.get(
  '/history',
  [
    query('cattlePurchaseId').optional(),
    query('penId').optional(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional().isIn(['health', 'mortality', 'movement', 'weight'])
  ],
  validateRequest,
  interventionController.getInterventionHistory
);

router.get(
  '/statistics',
  [
    query('cycleId').optional()
  ],
  validateRequest,
  interventionController.getInterventionStatistics
);

export default router;
import { Router } from 'express';
import { PartnerController } from '@/controllers/partner.controller';
import { validate } from '@/middlewares/validation';
import { authenticate, authorize } from '@/middlewares/auth';
import { partnerValidation } from '@/validations/partner.validation';

const router = Router();
const partnerController = new PartnerController();

// Todas as rotas precisam de autenticação
router.use(authenticate);

/**
 * @swagger
 * /partners:
 *   get:
 *     summary: Lista todos os parceiros
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Itens por página
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [VENDOR, BROKER, BUYER, INVESTOR, SERVICE_PROVIDER, OTHER]
 *         description: Filtrar por tipo de parceiro
 *     responses:
 *       200:
 *         description: Lista de parceiros
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /partners:
 *   post:
 *     summary: Criar novo parceiro
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Partner'
 *     responses:
 *       201:
 *         description: Parceiro criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Partner'
 */

// Rotas
router.get(
  '/',
  validate(partnerValidation.filters, 'query'),
  partnerController.index
);

router.get(
  '/type/:type',
  partnerController.byType
);

router.get(
  '/:id',
  partnerController.show
);

router.get(
  '/:id/stats',
  partnerController.stats
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(partnerValidation.create),
  partnerController.create
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(partnerValidation.update),
  partnerController.update
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  partnerController.delete
);

export { router as partnerRoutes }; 
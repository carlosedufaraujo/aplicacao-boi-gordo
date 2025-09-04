import express from 'express';
import { CalendarEventController } from '../controllers/calendarEvent.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { calendarEventValidation } from '../validations/calendarEvent.validation';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas CRUD básicas
router.get('/', CalendarEventController.getEvents);
router.get('/stats', CalendarEventController.getEventStats);
router.get('/:id', CalendarEventController.getEvent);

router.post('/', 
  validate(calendarEventValidation.createEvent), 
  CalendarEventController.createEvent
);

router.put('/:id', 
  validate(calendarEventValidation.updateEvent), 
  CalendarEventController.updateEvent
);

router.delete('/:id', CalendarEventController.deleteEvent);

// Rotas especiais
router.post('/generate-auto', CalendarEventController.generateAutoEvents);
router.patch('/update-overdue', CalendarEventController.updateOverdueEvents);
router.patch('/:id/complete', CalendarEventController.completeEvent);
router.patch('/:id/cancel', CalendarEventController.cancelEvent);

export { router as calendarEventRoutes };
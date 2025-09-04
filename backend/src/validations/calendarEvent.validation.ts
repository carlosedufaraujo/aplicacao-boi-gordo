import Joi from 'joi';
import { EventType, EventStatus, EventPriority } from '@prisma/client';

const createEventSchema = Joi.object({
  title: Joi.string().required().min(3).max(255),
  description: Joi.string().optional().max(1000),
  type: Joi.string().valid(...Object.values(EventType)).required(),
  date: Joi.date().required(),
  time: Joi.string().optional().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  location: Joi.string().optional().max(255),
  participants: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid(...Object.values(EventStatus)).optional(),
  priority: Joi.string().valid(...Object.values(EventPriority)).optional(),
  recurring: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  color: Joi.string().optional().pattern(/^#[0-9A-Fa-f]{6}$/),
  relatedId: Joi.string().optional(),
  amount: Joi.number().min(0).optional(),
  cycleId: Joi.string().optional()
});

const updateEventSchema = Joi.object({
  title: Joi.string().optional().min(3).max(255),
  description: Joi.string().optional().max(1000),
  type: Joi.string().valid(...Object.values(EventType)).optional(),
  date: Joi.date().optional(),
  time: Joi.string().optional().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  location: Joi.string().optional().max(255),
  participants: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid(...Object.values(EventStatus)).optional(),
  priority: Joi.string().valid(...Object.values(EventPriority)).optional(),
  recurring: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  color: Joi.string().optional().pattern(/^#[0-9A-Fa-f]{6}$/),
  relatedId: Joi.string().optional(),
  amount: Joi.number().min(0).optional(),
  cycleId: Joi.string().optional()
});

export const calendarEventValidation = {
  createEvent: createEventSchema,
  updateEvent: updateEventSchema
};
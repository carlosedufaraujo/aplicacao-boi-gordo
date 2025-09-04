import { Request, Response } from 'express';
import cashFlowService from '@/services/cashFlow.service';
import { logger } from '@/config/logger';

export class CashFlowController {
  async create(req: Request, res: Response) {
    try {
      const cashFlow = await cashFlowService.create(req.body);
      res.status(201).json(cashFlow);
    } catch (error: any) {
      logger.error('Error in CashFlowController.create:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        type: req.query.type as any,
        categoryId: req.query.categoryId as string,
        accountId: req.query.accountId as string,
        status: req.query.status as any,
        cycleId: req.query.cycleId as string,
      };

      const cashFlows = await cashFlowService.findAll(filters);
      res.json(cashFlows);
    } catch (error: any) {
      logger.error('Error in CashFlowController.findAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const cashFlow = await cashFlowService.findById(req.params.id);
      res.json(cashFlow);
    } catch (error: any) {
      logger.error('Error in CashFlowController.findById:', error);
      if (error.message === 'CashFlow not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  async update(req: Request, res: Response) {
    try {
      const cashFlow = await cashFlowService.update(req.params.id, req.body);
      res.json(cashFlow);
    } catch (error: any) {
      logger.error('Error in CashFlowController.update:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await cashFlowService.delete(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error in CashFlowController.delete:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status, paymentDate } = req.body;
      const cashFlow = await cashFlowService.updateStatus(
        req.params.id,
        status,
        paymentDate ? new Date(paymentDate) : undefined
      );
      res.json(cashFlow);
    } catch (error: any) {
      logger.error('Error in CashFlowController.updateStatus:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        type: req.query.type as any,
        categoryId: req.query.categoryId as string,
        accountId: req.query.accountId as string,
        status: req.query.status as any,
        cycleId: req.query.cycleId as string,
      };

      const summary = await cashFlowService.getSummary(filters);
      res.json(summary);
    } catch (error: any) {
      logger.error('Error in CashFlowController.getSummary:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new CashFlowController();
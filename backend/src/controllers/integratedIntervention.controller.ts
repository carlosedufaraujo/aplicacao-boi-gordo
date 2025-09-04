import { Request, Response } from 'express';
import mortalityCalculationService from '@/services/mortalityCalculation.service';
import healthProtocolIntegrationService from '@/services/healthProtocolIntegration.service';
import { logger } from '@/config/logger';

export class IntegratedInterventionController {
  /**
   * Registra uma mortalidade com cálculo de perda
   */
  async registerMortality(req: Request, res: Response) {
    try {
      const data = req.body;
      
      // Validação básica
      if (!data.penId || !data.quantity) {
        return res.status(400).json({
          error: 'Curral e quantidade são obrigatórios'
        });
      }

      // Registrar mortalidade
      const result = await mortalityCalculationService.registerMortality({
        penId: data.penId,
        quantity: data.quantity,
        date: new Date(data.date || Date.now()),
        cause: data.cause || 'DESCONHECIDA',
        notes: data.notes,
        integrateFinancial: data.integrateFinancial !== false
      });

      res.status(201).json({
        success: true,
        message: `Mortalidade registrada. Perda estimada: R$ ${result.calculation.totalLoss.toFixed(2)}`,
        data: result
      });

    } catch (error: any) {
      logger.error('Erro ao registrar mortalidade:', error);
      res.status(500).json({
        error: error.message || 'Erro ao processar registro de mortalidade'
      });
    }
  }

  /**
   * Calcula a perda estimada por mortalidade
   */
  async calculateMortalityLoss(req: Request, res: Response) {
    try {
      const { penId, quantity } = req.query;
      
      if (!penId || !quantity) {
        return res.status(400).json({
          error: 'Curral e quantidade são obrigatórios'
        });
      }

      const calculation = await mortalityCalculationService.calculateMortalityLoss(
        penId as string,
        parseInt(quantity as string)
      );

      res.json({
        success: true,
        data: calculation
      });

    } catch (error: any) {
      logger.error('Erro ao calcular perda:', error);
      res.status(500).json({
        error: error.message || 'Erro ao calcular perda por mortalidade'
      });
    }
  }

  /**
   * Busca histórico de mortalidade
   */
  async getMortalityHistory(req: Request, res: Response) {
    try {
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        penId: req.query.penId as string,
        cycleId: req.query.cycleId as string
      };

      const history = await mortalityCalculationService.getMortalityHistory(filters);

      res.json({
        success: true,
        data: history
      });

    } catch (error: any) {
      logger.error('Erro ao buscar histórico:', error);
      res.status(500).json({
        error: error.message || 'Erro ao buscar histórico de mortalidade'
      });
    }
  }

  /**
   * Calcula impacto da mortalidade no DRE
   */
  async calculateDREImpact(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Período é obrigatório'
        });
      }

      const impact = await mortalityCalculationService.calculateDREImpact({
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      });

      res.json({
        success: true,
        data: impact
      });

    } catch (error: any) {
      logger.error('Erro ao calcular impacto no DRE:', error);
      res.status(500).json({
        error: error.message || 'Erro ao calcular impacto no DRE'
      });
    }
  }

  /**
   * Registra um protocolo sanitário com integração financeira
   */
  async registerHealthProtocol(req: Request, res: Response) {
    try {
      const data = req.body;
      
      // Validação básica
      if (!data.name || !data.animalCount || !data.costPerAnimal) {
        return res.status(400).json({
          error: 'Nome, quantidade de animais e custo por animal são obrigatórios'
        });
      }

      if (data.integrateFinancial !== false && !data.payerAccountId) {
        return res.status(400).json({
          error: 'Conta para pagamento é obrigatória quando há integração financeira'
        });
      }

      // Registrar protocolo
      const result = await healthProtocolIntegrationService.createHealthProtocolWithFinancial({
        type: data.type || 'MEDICAMENTO',
        name: data.name,
        description: data.description,
        applicationDate: new Date(data.applicationDate || Date.now()),
        penId: data.penId,
        lotId: data.lotId,
        animalCount: data.animalCount,
        costPerAnimal: data.costPerAnimal,
        totalCost: data.totalCost,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        dueDate: new Date(data.dueDate || Date.now()),
        paymentMethod: data.paymentMethod,
        payerAccountId: data.payerAccountId,
        veterinarianName: data.veterinarianName,
        prescription: data.prescription,
        notes: data.notes,
        integrateFinancial: data.integrateFinancial !== false
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: result
      });

    } catch (error: any) {
      logger.error('Erro ao registrar protocolo sanitário:', error);
      res.status(500).json({
        error: error.message || 'Erro ao processar protocolo sanitário'
      });
    }
  }

  /**
   * Atualiza status de pagamento de protocolo
   */
  async updateProtocolPaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, paymentDate } = req.body;
      
      if (!status || !['PAID', 'CANCELLED'].includes(status)) {
        return res.status(400).json({
          error: 'Status inválido. Use PAID ou CANCELLED'
        });
      }

      const result = await healthProtocolIntegrationService.updateProtocolPaymentStatus(
        id,
        status,
        paymentDate ? new Date(paymentDate) : undefined
      );

      res.json({
        success: true,
        message: result.message,
        data: result
      });

    } catch (error: any) {
      logger.error('Erro ao atualizar status:', error);
      res.status(500).json({
        error: error.message || 'Erro ao atualizar status de pagamento'
      });
    }
  }

  /**
   * Busca protocolos com informações financeiras
   */
  async getProtocolsWithFinancial(req: Request, res: Response) {
    try {
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        type: req.query.type as string,
        penId: req.query.penId as string,
        lotId: req.query.lotId as string,
        paid: req.query.paid === 'true'
      };

      const protocols = await healthProtocolIntegrationService.getProtocolsWithFinancial(filters);

      res.json({
        success: true,
        data: protocols
      });

    } catch (error: any) {
      logger.error('Erro ao buscar protocolos:', error);
      res.status(500).json({
        error: error.message || 'Erro ao buscar protocolos'
      });
    }
  }

  /**
   * Calcula ROI dos investimentos em saúde
   */
  async calculateHealthROI(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Período é obrigatório'
        });
      }

      const roi = await healthProtocolIntegrationService.calculateHealthROI({
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      });

      res.json({
        success: true,
        data: roi
      });

    } catch (error: any) {
      logger.error('Erro ao calcular ROI:', error);
      res.status(500).json({
        error: error.message || 'Erro ao calcular ROI de saúde'
      });
    }
  }

  /**
   * Registra intervenção integrada (genérica)
   */
  async registerIntegratedIntervention(req: Request, res: Response) {
    try {
      const { type } = req.body;

      if (type === 'MORTALITY') {
        return this.registerMortality(req, res);
      } else if (type === 'HEALTH_PROTOCOL') {
        return this.registerHealthProtocol(req, res);
      } else {
        return res.status(400).json({
          error: 'Tipo de intervenção inválido. Use MORTALITY ou HEALTH_PROTOCOL'
        });
      }

    } catch (error: any) {
      logger.error('Erro ao registrar intervenção:', error);
      res.status(500).json({
        error: error.message || 'Erro ao processar intervenção'
      });
    }
  }
}

export default new IntegratedInterventionController();
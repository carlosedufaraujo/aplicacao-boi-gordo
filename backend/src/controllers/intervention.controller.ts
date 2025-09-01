import { Request, Response } from 'express';
import { interventionService } from '@/services/intervention.service';
import catchAsync from '@/utils/catchAsync';
import { AppError } from '@/utils/AppError';

class InterventionController {
  // Criar intervenção de saúde
  createHealthIntervention = catchAsync(async (req: Request, res: Response) => {
    const data = {
      ...req.body,
      applicationDate: new Date(req.body.applicationDate),
      expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined,
      dose: parseFloat(req.body.dose),
      cost: req.body.cost ? parseFloat(req.body.cost) : 0
    };

    const intervention = await interventionService.createHealthIntervention(data);

    res.status(201).json({
      status: 'success',
      message: 'Intervenção de saúde registrada com sucesso',
      data: intervention
    });
  });

  // Criar registro de mortalidade
  createMortalityRecord = catchAsync(async (req: Request, res: Response) => {
    const data = {
      ...req.body,
      deathDate: new Date(req.body.deathDate),
      quantity: parseInt(req.body.quantity),
      estimatedLoss: req.body.estimatedLoss ? parseFloat(req.body.estimatedLoss) : 0,
      necropsy: req.body.necropsy || false
    };

    const mortality = await interventionService.createMortalityRecord(data);

    res.status(201).json({
      status: 'success',
      message: `${data.quantity} morte(s) registrada(s) com sucesso`,
      data: mortality
    });
  });

  // Criar movimentação entre currais
  createPenMovement = catchAsync(async (req: Request, res: Response) => {
    const data = {
      ...req.body,
      movementDate: new Date(req.body.movementDate),
      quantity: parseInt(req.body.quantity)
    };

    const movement = await interventionService.createPenMovement(data);

    res.status(201).json({
      status: 'success',
      message: `${data.quantity} animais movidos com sucesso`,
      data: movement
    });
  });

  // Criar leitura de peso
  createWeightReading = catchAsync(async (req: Request, res: Response) => {
    const data = {
      ...req.body,
      weighingDate: new Date(req.body.weighingDate),
      averageWeight: parseFloat(req.body.averageWeight),
      totalWeight: req.body.totalWeight ? parseFloat(req.body.totalWeight) : undefined,
      sampleSize: parseInt(req.body.sampleSize)
    };

    const reading = await interventionService.createWeightReading(data);

    res.status(201).json({
      status: 'success',
      message: 'Pesagem registrada com sucesso',
      data: reading
    });
  });

  // Buscar histórico de intervenções
  getInterventionHistory = catchAsync(async (req: Request, res: Response) => {
    const { cattlePurchaseId, penId, startDate, endDate, type } = req.query;

    const filters = {
      cattlePurchaseId: cattlePurchaseId as string,
      penId: penId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      type: type as 'health' | 'mortality' | 'movement' | 'weight' | undefined
    };

    const history = await interventionService.getInterventionHistory(filters);

    res.json({
      status: 'success',
      results: history.length,
      data: history
    });
  });

  // Obter estatísticas de intervenções
  getInterventionStatistics = catchAsync(async (req: Request, res: Response) => {
    const { cycleId } = req.query;

    const statistics = await interventionService.getInterventionStatistics(cycleId as string);

    res.json({
      status: 'success',
      data: statistics
    });
  });
}

export const interventionController = new InterventionController();
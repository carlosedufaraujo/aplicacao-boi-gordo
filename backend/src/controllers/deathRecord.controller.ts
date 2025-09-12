import { Request, Response } from 'express';
import { deathRecordService } from '../services/deathRecord.service';
import { DeathType } from '@prisma/client';
import { AppError } from '../utils/AppError';
import catchAsync from '../utils/catchAsync';

class DeathRecordController {
  // Criar novo registro de morte
  create = catchAsync(async (req: Request, res: Response) => {
    const {
      purchaseId,
      penId,
      quantity,
      deathDate,
      deathType,
      cause,
      veterinaryNotes,
      estimatedLoss
    } = req.body;

    // Validações
    if (!purchaseId || !penId || !quantity || !deathType) {
      throw new AppError('Campos obrigatórios: purchaseId, penId, quantity, deathType', 400);
    }

    if (quantity <= 0) {
      throw new AppError('Quantidade deve ser maior que zero', 400);
    }

    // Validar tipo de morte
    if (!Object.values(DeathType).includes(deathType)) {
      throw new AppError('Tipo de morte inválido', 400);
    }

    const deathRecord = await deathRecordService.create({
      purchaseId,
      penId,
      quantity: parseInt(quantity),
      deathDate: deathDate ? new Date(deathDate) : new Date(),
      deathType,
      cause,
      veterinaryNotes,
      estimatedLoss: estimatedLoss ? parseFloat(estimatedLoss) : undefined,
      userId: (req as any).user?.id
    });

    res.status(201).json({
      status: 'success',
      message: `${quantity} morte(s) registrada(s) com sucesso`,
      data: deathRecord
    });
  });

  // Listar registros de morte
  findAll = catchAsync(async (req: Request, res: Response) => {
    const { purchaseId, penId, startDate, endDate, deathType } = req.query;

    const filters: any = {};
    if (purchaseId) filters.purchaseId = purchaseId as string;
    if (penId) filters.penId = penId as string;
    if (deathType) filters.deathType = deathType as DeathType;
    
    if (startDate || endDate) {
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
    }

    const records = await deathRecordService.findAll(filters);

    res.json({
      status: 'success',
      results: records.length,
      data: records
    });
  });

  // Buscar registro por ID
  findById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const record = await deathRecordService.findById(id);

    res.json({
      status: 'success',
      data: record
    });
  });

  // Atualizar registro de morte
  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Validar quantidade se fornecida
    if (updateData.quantity !== undefined && updateData.quantity <= 0) {
      throw new AppError('Quantidade deve ser maior que zero', 400);
    }

    // Validar tipo de morte se fornecido
    if (updateData.deathType && !Object.values(DeathType).includes(updateData.deathType)) {
      throw new AppError('Tipo de morte inválido', 400);
    }

    const updated = await deathRecordService.update(id, {
      ...updateData,
      quantity: updateData.quantity ? parseInt(updateData.quantity) : undefined,
      deathDate: updateData.deathDate ? new Date(updateData.deathDate) : undefined,
      estimatedLoss: updateData.estimatedLoss ? parseFloat(updateData.estimatedLoss) : undefined
    });

    res.json({
      status: 'success',
      message: 'Registro de morte atualizado com sucesso',
      data: updated
    });
  });

  // Deletar registro de morte
  delete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await deathRecordService.delete(id);

    res.json({
      status: 'success',
      message: result.message
    });
  });

  // Obter estatísticas
  getStatistics = catchAsync(async (req: Request, res: Response) => {
    const { startDate, endDate, purchaseId, penId } = req.query;

    const filters: any = {};
    if (purchaseId) filters.purchaseId = purchaseId as string;
    if (penId) filters.penId = penId as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const stats = await deathRecordService.getStatistics(filters);

    res.json({
      status: 'success',
      data: stats
    });
  });

  // Análise por período
  getAnalysisByPeriod = catchAsync(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError('Datas de início e fim são obrigatórias', 400);
    }

    const analysis = await deathRecordService.getAnalysisByPeriod(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      status: 'success',
      data: analysis
    });
  });
}

export const deathRecordController = new DeathRecordController();
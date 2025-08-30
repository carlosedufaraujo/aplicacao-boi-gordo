import { Request, Response } from 'express';
import { cattlePurchaseService } from '../services/cattlePurchase.service';
import { AppError } from '../utils/AppError';
import catchAsync from '../utils/catchAsync';

class CattlePurchaseController {
  // Criar nova compra
  create = catchAsync(async (req: Request, res: Response) => {
    const purchase = await cattlePurchaseService.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: purchase
    });
  });
  
  // Listar todas as compras
  findAll = catchAsync(async (req: Request, res: Response) => {
    const { status, vendorId, startDate, endDate, page, limit } = req.query;
    
    // Constrói filtros apenas com valores definidos
    const filters: any = {};
    if (status) filters.status = status;
    if (vendorId) filters.vendorId = vendorId;
    if (startDate || endDate) {
      filters.purchaseDate = {};
      if (startDate) filters.purchaseDate.gte = new Date(startDate as string);
      if (endDate) filters.purchaseDate.lte = new Date(endDate as string);
    }
    
    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10
    };
    
    const result = await cattlePurchaseService.findAll(filters, pagination);
    
    res.json({
      status: 'success',
      results: result.total,
      ...result
    });
  });
  
  // Buscar compra por ID
  findById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const purchase = await cattlePurchaseService.findById(id);
    
    if (!purchase) {
      throw new AppError('Compra não encontrada', 404);
    }
    
    res.json({
      status: 'success',
      data: purchase
    });
  });
  
  // Atualizar compra
  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const purchase = await cattlePurchaseService.update(id, req.body);
    
    res.json({
      status: 'success',
      data: purchase
    });
  });
  
  // Registrar recepção
  registerReception = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const purchase = await cattlePurchaseService.registerReception(id, req.body);
    
    res.json({
      status: 'success',
      message: 'Recepção registrada com sucesso',
      data: purchase
    });
  });
  
  // Atualizar status
  updateStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      throw new AppError('Status é obrigatório', 400);
    }
    
    const purchase = await cattlePurchaseService.updateStatus(id, status);
    
    res.json({
      status: 'success',
      data: purchase
    });
  });
  
  // Registrar morte
  registerDeath = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { count, date } = req.body;
    
    if (!count || count <= 0) {
      throw new AppError('Quantidade de mortes deve ser maior que zero', 400);
    }
    
    const purchase = await cattlePurchaseService.registerDeath(
      id, 
      count, 
      date ? new Date(date) : new Date()
    );
    
    res.json({
      status: 'success',
      message: `${count} morte(s) registrada(s)`,
      data: purchase
    });
  });
  
  // Deletar compra
  delete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    await cattlePurchaseService.delete(id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
  
  // Obter estatísticas
  getStatistics = catchAsync(async (req: Request, res: Response) => {
    const stats = await cattlePurchaseService.getStatistics();
    
    res.json({
      status: 'success',
      data: stats
    });
  });
  
  // Atualizar GMD
  updateGMD = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { expectedGMD, targetWeight } = req.body;
    
    if (!expectedGMD || !targetWeight) {
      throw new AppError('GMD esperado e peso alvo são obrigatórios', 400);
    }
    
    const purchase = await cattlePurchaseService.update(id, {
      expectedGMD,
      targetWeight
    });
    
    res.json({
      status: 'success',
      message: 'GMD atualizado com sucesso',
      data: purchase
    });
  });

  // Marcar como confinado com alocação de currais
  markAsConfined = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { penAllocations, notes } = req.body;
    
    if (!penAllocations || !Array.isArray(penAllocations) || penAllocations.length === 0) {
      throw new AppError('Alocações de currais são obrigatórias', 400);
    }
    
    const purchase = await cattlePurchaseService.markAsConfined(id, {
      penAllocations,
      notes
    });
    
    res.json({
      status: 'success',
      message: 'Lote marcado como confinado com sucesso',
      data: purchase
    });
  });
}

export const cattlePurchaseController = new CattlePurchaseController();
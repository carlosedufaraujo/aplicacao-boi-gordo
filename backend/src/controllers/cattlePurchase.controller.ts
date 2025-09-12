import { Request, Response } from 'express';
import { cattlePurchaseService } from '../services/cattlePurchase.service';
import { cattlePurchaseIntegration } from '../services/cattlePurchaseIntegration.service';
import cattlePurchaseCashFlowService from '../services/cattlePurchaseCashFlow.service';
import { AppError } from '../utils/AppError';
import catchAsync from '../utils/catchAsync';

class CattlePurchaseController {
  // Criar nova compra
  create = catchAsync(async (req: Request, res: Response) => {
    // Adicionar userId do token de autenticação
    const purchaseData = {
      ...req.body,
      userId: (req as any).user?.id
    };
    
    const purchase = await cattlePurchaseService.create(purchaseData);
    
    // Criar movimentações no CashFlow automaticamente
    try {
      await cattlePurchaseCashFlowService.createPurchaseCashFlows(purchase.id);
      console.log('✅ Movimentações do CashFlow criadas para o lote', purchase.lotCode);
    } catch (error) {
      console.error('⚠️ Erro ao criar movimentações no CashFlow:', error);
      // Não falha a criação da compra se houver erro no CashFlow
    }
    
    // Criar despesas no sistema antigo (mantém compatibilidade)
    try {
      await cattlePurchaseIntegration.createPurchaseExpenses(purchase.id);
      console.log('✅ Despesas criadas para o lote', purchase.lotCode);
    } catch (error) {
      console.error('⚠️ Erro ao criar despesas:', error);
    }
    
    res.status(201).json({
      status: 'success',
      data: purchase
    });
  });
  
  // Listar todas as compras
  findAll = catchAsync(async (req: Request, res: Response) => {
    const { status, vendorId, cycleId, startDate, endDate, page, limit } = req.query;
    
    // Constrói filtros apenas com valores definidos
    const filters: any = {};
    if (status) filters.status = status;
    if (vendorId) filters.vendorId = vendorId;
    if (cycleId) filters.cycleId = cycleId;
    if (startDate || endDate) {
      filters.purchaseDate = {};
      if (startDate) filters.purchaseDate.gte = new Date(startDate as string);
      if (endDate) filters.purchaseDate.lte = new Date(endDate as string);
    }
    
    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 100 // Aumentado para análises
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
    
    // Atualizar movimentações no CashFlow
    try {
      await cattlePurchaseCashFlowService.updatePurchaseCashFlows(purchase.id);
      console.log('✅ Movimentações do CashFlow atualizadas para o lote', purchase.lotCode);
    } catch (error) {
      console.error('⚠️ Erro ao atualizar movimentações no CashFlow:', error);
    }
    
    // Atualizar despesas no sistema antigo (mantém compatibilidade)
    try {
      await cattlePurchaseIntegration.updatePurchaseExpenses(purchase.id);
      console.log('✅ Despesas atualizadas para o lote', purchase.lotCode);
    } catch (error) {
      console.error('⚠️ Erro ao atualizar despesas:', error);
    }
    
    res.json({
      status: 'success',
      data: purchase
    });
  });
  
  // Registrar recepção (agora com alocação opcional)
  registerReception = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      receivedWeight,
      receivedQuantity,
      actualQuantity,
      freightDistance,
      freightCostPerKm,
      freightValue,
      transportCompanyId,
      unloadingDate,
      estimatedGMD,
      mortalityReason,
      observations,
      penAllocations
    } = req.body;
    
    // Preparar dados para o serviço
    const receptionData = {
      receivedDate: unloadingDate ? new Date(unloadingDate) : new Date(),
      receivedWeight: parseFloat(receivedWeight),
      actualQuantity: parseInt(actualQuantity || receivedQuantity),
      freightDistance: freightDistance ? parseFloat(freightDistance) : undefined,
      freightCostPerKm: freightCostPerKm ? parseFloat(freightCostPerKm) : undefined,
      freightValue: freightValue ? parseFloat(freightValue) : undefined,
      transportCompanyId: transportCompanyId || undefined,
      estimatedGMD: estimatedGMD ? parseFloat(estimatedGMD) : undefined,
      transportMortality: undefined,
      mortalityReason: mortalityReason || undefined,
      notes: observations,
      penAllocations: penAllocations || []
    };
    
    const purchase = await cattlePurchaseService.registerReception(id, receptionData);
    
    const message = penAllocations && penAllocations.length > 0
      ? `Recepção registrada e ${receivedQuantity} animais alocados em ${penAllocations.length} curral(is)`
      : 'Recepção registrada com sucesso';
    
    res.json({
      status: 'success',
      message,
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
  
  // Sincronizar despesas com centro financeiro
  syncExpenses = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    const result = await cattlePurchaseService.syncFinancialExpenses(id, userId);
    
    res.json({
      status: 'success',
      data: result
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
    
    res.status(200).json({
      status: 'success',
      message: 'Compra excluída com sucesso',
      data: null
    });
  });
  
  // Obter estatísticas
  getStatistics = catchAsync(async (_req: Request, res: Response) => {
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
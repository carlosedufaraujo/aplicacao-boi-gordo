import { PurchaseStatus } from '@prisma/client';
import { CattlePurchaseRepository } from '@/repositories/cattlePurchase.repository';
import { PenRepository } from '@/repositories/pen.repository';
import { AppError } from '@/utils/AppError';
import { prisma } from '@/config/database';
import { CodeGeneratorService } from '@/services/codeGenerator.service';
import { ExpenseService } from '@/services/expense.service';
import { CattlePurchaseCashFlowService } from '@/services/cattlePurchaseCashFlow.service';

interface CreateCattlePurchaseData {
  vendorId: string;
  brokerId?: string;
  transportCompanyId?: string;
  payerAccountId: string;
  cycleId?: string;
  location?: string;
  city?: string;
  state?: string;
  farm?: string;
  purchaseDate: Date;
  animalType: 'MALE' | 'FEMALE' | 'MIXED';
  animalAge?: number;
  initialQuantity: number;
  purchaseWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  paymentType: 'CASH' | 'INSTALLMENT' | 'BARTER';
  paymentTerms?: string;
  principalDueDate?: Date;
  freightCost?: number;
  freightDistance?: number;
  commission?: number;
  userId?: string;
  notes?: string;
}

interface RegisterReceptionData {
  receivedDate: Date;
  receivedWeight: number;
  actualQuantity: number;
  freightDistance?: number;
  freightCostPerKm?: number;
  freightValue?: number;
  transportCompanyId?: string;
  estimatedGMD?: number;
  transportMortality?: number;
  mortalityReason?: string;
  notes?: string;
  penAllocations?: Array<{ penId: string; quantity: number }>;
}

interface MarkAsConfinedData {
  penAllocations: Array<{ penId: string; quantity: number }>;
  notes?: string;
}

export class CattlePurchaseService {
  private repository: CattlePurchaseRepository;
  private penRepository: PenRepository;
  private expenseService: ExpenseService;
  private cashFlowService: CattlePurchaseCashFlowService;

  constructor() {
    this.repository = new CattlePurchaseRepository();
    this.penRepository = new PenRepository();
    this.expenseService = new ExpenseService();
    this.cashFlowService = new CattlePurchaseCashFlowService();
  }

  async create(data: CreateCattlePurchaseData) {
    // Gerar códigos únicos
    const lotCode = await this.generateLotCode();
    // Removido internalCode - usando apenas lotCode
    
    // Se purchaseValue foi fornecido, usa ele; senão calcula
    let purchaseValue: number;
    if (data.purchaseValue && data.purchaseValue > 0) {
      // Usar valor fornecido (útil para importação)
      purchaseValue = data.purchaseValue;
    } else {
      // Calcular valor da compra - preço por arroba é aplicado sobre peso da carcaça
      const carcassWeight = (data.purchaseWeight * (data.carcassYield || 50)) / 100;
      purchaseValue = (carcassWeight / 15) * data.pricePerArroba;
    }
    
    // Calcular custos totais
    const totalCost = purchaseValue + 
                     (data.freightCost || 0) + 
                     (data.commission || 0);

    // Filtrar campos nulos/undefined para evitar violações de FK
    const createData: any = {
      vendorId: data.vendorId,
      payerAccountId: data.payerAccountId,
      userId: data.userId,
      lotCode,
      purchaseDate: data.purchaseDate,
      animalType: data.animalType,
      initialQuantity: data.initialQuantity,
      purchaseWeight: data.purchaseWeight,
      carcassYield: data.carcassYield,
      pricePerArroba: data.pricePerArroba,
      paymentType: data.paymentType,
      purchaseValue,
      totalCost,
      currentQuantity: data.initialQuantity,
      status: 'CONFIRMED' as const,
      deathCount: 0,
      averageWeight: data.purchaseWeight / data.initialQuantity
    };

    // Adicionar campos opcionais apenas se existirem
    if (data.brokerId) createData.brokerId = data.brokerId;
    if (data.transportCompanyId) createData.transportCompanyId = data.transportCompanyId;
    if (data.location) createData.location = data.location;
    if (data.city) createData.city = data.city;
    if (data.state) createData.state = data.state;
    if (data.farm) createData.farm = data.farm;
    if (data.animalAge) createData.animalAge = data.animalAge;
    if (data.paymentTerms) createData.paymentTerms = data.paymentTerms;
    if (data.freightCost) createData.freightCost = data.freightCost;
    if (data.freightDistance) createData.freightDistance = data.freightDistance;
    if (data.commission) createData.commission = data.commission;
    if (data.notes) createData.notes = data.notes;
    
    // Mapear campos com nomes diferentes
    if (data.paymentDate) createData.principalDueDate = data.paymentDate;
    if (data.commissionType) createData.commissionPaymentType = data.commissionType;

    // Criar a compra
    const purchase = await this.repository.create(createData);
    
    // Status de integração financeira
    const integrationStatus = {
      success: true,
      expensesCreated: 0,
      errors: [] as string[]
    };
    
    // NOTA: Despesas são criadas pelo CattlePurchaseIntegrationService no controller
    // para evitar duplicação, não criamos aqui
    
    // // Criar despesas no centro financeiro
    // try {
    //   // 1. Despesa principal da compra
    //   try {
    //     await this.expenseService.create({
    //     category: 'animal_purchase',
    //     description: `Compra de gado - Lote ${lotCode}`,
    //     totalAmount: purchaseValue,
    //     dueDate: data.paymentDate || data.principalDueDate || data.purchaseDate,
    //     impactsCashFlow: true,
    //     purchaseId: purchase.id,
    //     vendorId: data.vendorId,
    //     payerAccountId: data.payerAccountId,
    //     notes: `Compra de ${data.initialQuantity} animais - ${data.purchaseWeight}kg total`
    //   }, data.userId || purchase.userId);
    //     integrationStatus.expensesCreated++;
    //   } catch (err: any) {
    //     integrationStatus.success = false;
    //     integrationStatus.errors.push(`Despesa principal não criada: ${err.message}`);
    //     console.error('Erro ao criar despesa principal:', err);
    //   }
      
      // // 2. Despesa de frete se houver
      // if (data.freightCost && data.freightCost > 0) {
      //   try {
      //     await this.expenseService.create({
      //     category: 'freight',
      //     description: `Frete - Lote ${lotCode}`,
      //     totalAmount: data.freightCost,
      //     dueDate: data.freightDueDate || data.purchaseDate,
      //     impactsCashFlow: true,
      //     purchaseId: purchase.id,
      //     vendorId: data.transportCompanyId,
      //     payerAccountId: data.payerAccountId,
      //     notes: data.freightDistance ? `Distância: ${data.freightDistance}km` : null
      //   }, data.userId || purchase.userId);
      //     integrationStatus.expensesCreated++;
      //   } catch (err: any) {
      //     integrationStatus.success = false;
      //     integrationStatus.errors.push(`Despesa de frete não criada: ${err.message}`);
      //     console.error('Erro ao criar despesa de frete:', err);
      //   }
      // }
      
      // // 3. Despesa de comissão se houver
      // if (data.commission && data.commission > 0) {
      //   try {
      //     await this.expenseService.create({
      //     category: 'commission',
      //     description: `Comissão - Lote ${lotCode}`,
      //     totalAmount: data.commission,
      //     dueDate: data.commissionDueDate || data.purchaseDate,
      //     impactsCashFlow: true,
      //     purchaseId: purchase.id,
      //     vendorId: data.brokerId,
      //     payerAccountId: data.payerAccountId,
      //     notes: `Comissão sobre compra do lote ${lotCode}`
      //   }, data.userId || purchase.userId);
      //     integrationStatus.expensesCreated++;
      //   } catch (err: any) {
      //     integrationStatus.success = false;
      //     integrationStatus.errors.push(`Despesa de comissão não criada: ${err.message}`);
      //     console.error('Erro ao criar despesa de comissão:', err);
      //   }
      // }
    // } catch (error: any) {
    //   console.error('Erro geral ao criar despesas no centro financeiro:', error);
    //   integrationStatus.success = false;
    //   integrationStatus.errors.push(`Erro na integração: ${error.message}`);
    // }
    
    // Criar entradas no CashFlow com categorias padronizadas
    try {
      await this.cashFlowService.createPurchaseCashFlows(purchase.id);
      console.log('✅ Entradas do CashFlow criadas com sucesso');
    } catch (error: any) {
      console.error('Erro ao criar entradas no CashFlow:', error);
      integrationStatus.success = false;
      integrationStatus.errors.push(`CashFlow não criado: ${error.message}`);
    }
    
    // Retornar compra com status de integração
    return {
      ...purchase,
      financialIntegration: integrationStatus
    };
  }

  async findAll(filters: any = {}, pagination?: any) {
    // Temporariamente sem include para testar
    return await this.repository.findAll(filters, pagination);
  }

  async findById(id: string) {
    const purchase = await this.repository.findWithRelations(id);
    if (!purchase) {
      throw new AppError('Compra não encontrada', 404);
    }
    return purchase;
  }

  async update(id: string, data: any) {
    const purchase = await this.findById(id);
    
    // Recalcular custos se necessário
    if (data.purchaseWeight || data.pricePerArroba || data.carcassYield) {
      const weight = data.purchaseWeight || purchase.purchaseWeight;
      const price = data.pricePerArroba || purchase.pricePerArroba;
      const carcassYield = data.carcassYield || purchase.carcassYield || 50;
      
      // Preço por arroba é aplicado sobre o peso da carcaça (15kg/@), não peso vivo
      const carcassWeight = (weight * carcassYield) / 100;
      data.purchaseValue = (carcassWeight / 15) * price;
    }

    if (data.freightCost !== undefined || data.commission !== undefined) {
      data.totalCost = (data.purchaseValue || purchase.purchaseValue) +
                      (data.freightCost ?? purchase.freightCost) +
                      (data.commission ?? purchase.commission);
    }

    // Transformar IDs de relações em conexões Prisma
    const updateData: any = {};
    
    // Campos simples (apenas campos que existem no schema)
    const simpleFields = [
      'purchaseDate', 'city', 'state', 'farm', 'location',
      'animalType', 'animalAge', 'initialQuantity', 'purchaseWeight',
      'carcassYield', 'pricePerArroba', 'purchaseValue', 'paymentType',
      'freightCost', 'freightDistance', 'commission',
      'notes', 'totalCost'
    ];
    
    simpleFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });
    
    // Mapear campos com nomes diferentes
    if (data.commissionType !== undefined) {
      updateData.commissionPaymentType = data.commissionType;
    }
    
    if (data.paymentDate !== undefined) {
      updateData.principalDueDate = data.paymentDate;
    }

    // Relações que precisam ser conectadas
    if (data.vendorId) {
      updateData.vendor = { connect: { id: data.vendorId } };
    }
    
    if (data.payerAccountId) {
      updateData.payerAccount = { connect: { id: data.payerAccountId } };
    }
    
    if (data.brokerId) {
      updateData.broker = { connect: { id: data.brokerId } };
    } else if (data.hasBroker === false && purchase.brokerId) {
      updateData.broker = { disconnect: true };
    }
    
    if (data.transportCompanyId) {
      updateData.transportCompany = { connect: { id: data.transportCompanyId } };
    } else if (data.hasFreight === false && purchase.transportCompanyId) {
      updateData.transportCompany = { disconnect: true };
    }

    return await this.repository.update(id, updateData);
  }

  async updateStatus(id: string, status: PurchaseStatus) {
    return await this.repository.update(id, { 
      status
    });
  }

  async registerReception(id: string, data: RegisterReceptionData) {
    const purchase = await this.findById(id);
    
    // Verificar se já foi recepcionada
    if (purchase.status === 'RECEIVED' || purchase.status === 'CONFINED' || purchase.status === 'SOLD') {
      throw new AppError('Esta compra já foi recepcionada', 400);
    }
    
    if (purchase.status !== 'CONFIRMED') {
      throw new AppError('Apenas compras confirmadas podem ser recepcionadas', 400);
    }

    // Calcular quebra de peso
    const weightBreak = purchase.purchaseWeight - data.receivedWeight;
    const weightBreakPercentage = (weightBreak / purchase.purchaseWeight) * 100;
    
    // Calcular mortalidade
    const transportMortality = data.transportMortality || 
                              (purchase.initialQuantity - data.actualQuantity);

    // Se tiver alocações de curral, processar recepção e alocação juntas
    if (data.penAllocations && data.penAllocations.length > 0) {
      // Validar total de animais alocados
      const totalAllocated = data.penAllocations.reduce((sum: number, alloc) => sum + alloc.quantity, 0);
      if (totalAllocated !== data.actualQuantity) {
        throw new AppError(`Total alocado (${totalAllocated}) deve ser igual à quantidade recebida (${data.actualQuantity})`, 400);
      }

      // Executar em transação
      return await prisma.$transaction(async (tx) => {
        // Atualizar compra para ACTIVE direto
        const updatedPurchase = await tx.cattlePurchase.update({
          where: { id },
          data: {
            receivedDate: data.receivedDate,
            receivedWeight: data.receivedWeight,
            currentQuantity: data.actualQuantity,
            transportMortality,
            weightBreakPercentage,
            deathCount: transportMortality,
            freightDistance: data.freightDistance || purchase.freightDistance,
            freightCostPerKm: data.freightCostPerKm || purchase.freightCostPerKm,
            freightCost: data.freightValue || purchase.freightCost,
            // transportCompanyId removido temporariamente - será tratado separadamente se necessário
            expectedGMD: data.estimatedGMD || purchase.expectedGMD,
            // Atualizar status para CONFINED quando recepcionado com alocação
            status: 'CONFINED' as PurchaseStatus,
            averageWeight: data.receivedWeight / data.actualQuantity,
            notes: [
              purchase.notes,
              data.mortalityReason ? `Motivo da mortalidade: ${data.mortalityReason}` : null,
              data.notes
            ].filter(Boolean).join('\n').trim() || null
          },
          include: {
            vendor: true,
            broker: true,
            penAllocations: {
              include: { pen: true }
            }
          }
        });

        // Criar alocações de curral
        for (const allocation of data.penAllocations) {
          // Buscar capacidade do curral para calcular percentageOfPen
          const pen = await tx.pen.findUnique({
            where: { id: allocation.penId }
          });
          
          await tx.lotPenLink.create({
            data: {
              purchaseId: id,
              penId: allocation.penId,
              quantity: allocation.quantity,
              allocationDate: new Date(),
              status: 'ACTIVE',
              percentageOfLot: (allocation.quantity / data.actualQuantity) * 100,
              percentageOfPen: pen ? (allocation.quantity / pen.capacity) * 100 : 0
            }
          });

          // Atualização de ocupação removida - currentOccupancy é calculado dinamicamente
        }

        return updatedPurchase;
      });
    } else {
      // Apenas registrar recepção sem alocação (mantém compatibilidade)
      return await this.repository.update(id, {
        receivedDate: data.receivedDate,
        receivedWeight: data.receivedWeight,
        currentQuantity: data.actualQuantity,
        transportMortality,
        weightBreakPercentage,
        deathCount: transportMortality,
        freightDistance: data.freightDistance || purchase.freightDistance,
        freightCostPerKm: data.freightCostPerKm || purchase.freightCostPerKm,
        freightCost: data.freightValue || purchase.freightCost,
        // transportCompanyId removido temporariamente
        expectedGMD: data.estimatedGMD || purchase.expectedGMD,
        // Atualizar status para RECEIVED
        status: 'RECEIVED' as PurchaseStatus,
        averageWeight: data.receivedWeight / data.actualQuantity,
        notes: [
          purchase.notes,
          data.mortalityReason ? `Motivo da mortalidade: ${data.mortalityReason}` : null,
          data.notes
        ].filter(Boolean).join('\n').trim() || null
      });
    }
  }
  
  async syncFinancialExpenses(purchaseId: string, userId: string) {
    // Buscar a compra
    const purchase = await this.findById(purchaseId);
    
    // Verificar se já existem despesas
    const existingExpenses = await this.expenseService.findByPurchaseId(purchaseId);
    
    const syncStatus = {
      purchaseId,
      expensesCreated: 0,
      expensesExisting: existingExpenses.length,
      errors: [] as string[],
      success: true
    };
    
    // Se já existem despesas, retornar status
    if (existingExpenses.length >= 3) {
      return {
        ...syncStatus,
        message: 'Despesas já estão sincronizadas'
      };
    }
    
    const lotCode = purchase.lotCode || `LOT-${purchase.id.slice(-6)}`;
    
    // Verificar e criar despesa principal se não existir
    const hasMainExpense = existingExpenses.some(exp => exp.category === 'animal_purchase');
    if (!hasMainExpense && purchase.purchaseValue > 0) {
      try {
        await this.expenseService.create({
          category: 'animal_purchase',
          description: `Compra de gado - ${lotCode}`,
          totalAmount: purchase.purchaseValue,
          dueDate: purchase.principalDueDate || purchase.purchaseDate,
          impactsCashFlow: true,
          purchaseId: purchase.id,
          vendorId: purchase.vendorId,
          payerAccountId: purchase.payerAccountId,
          notes: `Compra de ${purchase.initialQuantity} animais - ${purchase.purchaseWeight}kg total`
        }, userId);
        syncStatus.expensesCreated++;
      } catch (err: any) {
        syncStatus.errors.push(`Erro ao criar despesa principal: ${err.message}`);
        syncStatus.success = false;
      }
    }
    
    // Verificar e criar despesa de frete se não existir
    const hasFreightExpense = existingExpenses.some(exp => exp.category === 'freight');
    if (!hasFreightExpense && purchase.freightCost && purchase.freightCost > 0) {
      try {
        await this.expenseService.create({
          category: 'freight',
          description: `Frete - ${lotCode}`,
          totalAmount: purchase.freightCost,
          dueDate: purchase.freightDueDate || purchase.purchaseDate,
          impactsCashFlow: true,
          purchaseId: purchase.id,
          vendorId: purchase.transportCompanyId,
          payerAccountId: purchase.payerAccountId,
          notes: purchase.freightDistance ? `Distância: ${purchase.freightDistance}km` : null
        }, userId);
        syncStatus.expensesCreated++;
      } catch (err: any) {
        syncStatus.errors.push(`Erro ao criar despesa de frete: ${err.message}`);
        syncStatus.success = false;
      }
    }
    
    // Verificar e criar despesa de comissão se não existir
    const hasCommissionExpense = existingExpenses.some(exp => exp.category === 'commission');
    if (!hasCommissionExpense && purchase.commission && purchase.commission > 0) {
      try {
        await this.expenseService.create({
          category: 'commission',
          description: `Comissão - ${lotCode}`,
          totalAmount: purchase.commission,
          dueDate: purchase.commissionDueDate || purchase.purchaseDate,
          impactsCashFlow: true,
          purchaseId: purchase.id,
          vendorId: purchase.brokerId,
          payerAccountId: purchase.payerAccountId,
          notes: `Comissão sobre compra - ${lotCode}`
        }, userId);
        syncStatus.expensesCreated++;
      } catch (err: any) {
        syncStatus.errors.push(`Erro ao criar despesa de comissão: ${err.message}`);
        syncStatus.success = false;
      }
    }
    
    return {
      ...syncStatus,
      message: syncStatus.expensesCreated > 0 
        ? `${syncStatus.expensesCreated} despesa(s) criada(s) com sucesso`
        : 'Nenhuma despesa nova foi necessária'
    };
  }

  async markAsConfined(id: string, data: MarkAsConfinedData) {
    const purchase = await this.findById(id);
    
    if (purchase.status !== 'RECEIVED') {
      throw new AppError('Apenas compras recepcionadas podem ser confinadas', 400);
    }

    // Validar total de animais alocados
    const totalAllocated = data.penAllocations.reduce((sum: number, alloc) => sum + alloc.quantity, 0);
    if (totalAllocated !== purchase.currentQuantity) {
      throw new AppError(`Total alocado (${totalAllocated}) deve ser igual à quantidade atual (${purchase.currentQuantity})`, 400);
    }

    // Executar em transação
    return await prisma.$transaction(async (tx) => {
      // Remover alocações antigas se existirem
      await tx.lotPenLink.updateMany({
        where: {
          purchaseId: id,
          status: 'ACTIVE'
        },
        data: {
          status: 'REMOVED',
          removalDate: new Date()
        }
      });

      // Criar novas alocações
      const allocationDate = new Date();
      for (const allocation of data.penAllocations) {
        // Verificar disponibilidade do curral
        const pen = await tx.pen.findUnique({
          where: { id: allocation.penId },
          include: {
            lotAllocations: {
              where: { status: 'ACTIVE' }
            }
          }
        });

        if (!pen) {
          throw new AppError(`Curral ${allocation.penId} não encontrado`, 404);
        }

        const currentOccupation = pen.lotAllocations.reduce((sum: number, alloc: any) => sum + alloc.quantity, 0);
        const availableSpace = pen.capacity - currentOccupation;

        if (allocation.quantity > availableSpace) {
          throw new AppError(`Curral ${pen.penNumber} não tem espaço suficiente. Disponível: ${availableSpace}`, 400);
        }

        // Criar alocação
        await tx.lotPenLink.create({
          data: {
            purchaseId: id,
            penId: allocation.penId,
            quantity: allocation.quantity,
            percentageOfLot: (allocation.quantity / purchase.currentQuantity) * 100,
            percentageOfPen: (allocation.quantity / pen.capacity) * 100,
            allocationDate,
            status: 'ACTIVE'
          }
        });

        // Atualizar status do curral
        if (currentOccupation + allocation.quantity >= pen.capacity) {
          await tx.pen.update({
            where: { id: allocation.penId },
            data: { status: 'OCCUPIED' }
          });
        }
      }

      // Atualizar status da compra
      const updated = await tx.cattlePurchase.update({
        where: { id },
        data: {
          status: 'CONFINED' as PurchaseStatus,
          notes: data.notes ? `${purchase.notes || ''}\n${data.notes}`.trim() : purchase.notes
        },
        include: {
          vendor: true,
          broker: true,
          transportCompany: true,
          payerAccount: true,
          penAllocations: {
            where: { status: 'ACTIVE' },
            include: { pen: true }
          }
        }
      });

      return updated;
    });
  }

  // DEPRECATED: Método antigo de registro de morte - será removido
  // Mortes agora são gerenciadas pelo DeathRecordService
  async registerDeath(id: string, count: number, date: Date) {
    // Este método está deprecated e não deve mais ser usado
    // Mortes devem ser registradas através do DeathRecordService
    // que mantém a quantidade de compra imutável
    throw new AppError(
      'Método deprecated. Use o sistema de gestão de mortes na página de Currais', 
      400
    );
  }

  async delete(id: string) {
    const purchase = await this.findById(id);
    
    // Verificar se existem dados relacionados importantes
    const relatedData = {
      penAllocations: 0,
      expenses: 0,
      revenues: 0
    };
    
    try {
      // Verificar apenas as tabelas que existem
      relatedData.penAllocations = await prisma.lotPenLink.count({ where: { purchaseId: id } }).catch(() => 0);
    } catch (error) {
      console.log('Erro ao verificar dados relacionados:', error);
    }
    
    const hasRelatedData = Object.values(relatedData).some(count => count > 0);
    
    // Se tem dados relacionados, avisar mas permitir exclusão
    if (hasRelatedData) {
      console.log(`⚠️ Excluindo lote ${purchase.lotCode} com dados relacionados:`, relatedData);
    }
    
    // Executar exclusões sem transação para evitar erro de transaction aborted
    // 1. Remover alocações de currais
    await prisma.lotPenLink.deleteMany({ where: { purchaseId: id } }).catch((error) => {
      console.log('Erro ao deletar alocações de currais:', error);
    });
    
    // 2. Finalmente, excluir a compra
    const deleted = await prisma.cattlePurchase.delete({ where: { id } });
    
    console.log(`✅ Lote ${purchase.lotCode} excluído com sucesso`);
    
    return deleted;
  }

  async getStatistics() {
    return await this.repository.getStatistics();
  }

  async getDashboardSummary(dateRange?: { start: Date; end: Date }) {
    return await this.repository.getDashboardSummary(dateRange);
  }

  private async generateLotCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    const lastPurchase = await this.repository.findOne(
      { lotCode: { startsWith: `LOT-${year}${month}` } },
      { orderBy: { lotCode: 'desc' } }
    );
    
    let sequence = '001';
    if (lastPurchase) {
      const lastSequence = parseInt(lastPurchase.lotCode.slice(-3));
      sequence = (lastSequence + 1).toString().padStart(3, '0');
    }
    
    return `LOT-${year}${month}${sequence}`;
  }
}

export const cattlePurchaseService = new CattlePurchaseService();
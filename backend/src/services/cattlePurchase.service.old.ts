import { PrismaClient, Prisma, CattlePurchase, PurchaseStatus } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export interface CreateCattlePurchaseDto {
  // Identificação
  purchaseCode?: string;
  lotCode?: string;
  
  // Relacionamentos
  vendorId: string;
  brokerId?: string;
  transportCompanyId?: string;
  payerAccountId: string;
  userId?: string;
  
  // Localização e data
  location?: string;
  purchaseDate: Date;
  
  // Informações dos animais
  animalType: 'MALE' | 'FEMALE' | 'MIXED';
  animalAge?: number;
  initialQuantity: number;
  
  // Pesos
  purchaseWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  
  // Custos
  freightCost?: number;
  freightDistance?: number;
  freightCostPerKm?: number;
  commission?: number;
  
  // Pagamentos
  paymentType: 'CASH' | 'INSTALLMENT' | 'BARTER';
  paymentTerms?: string;
  principalDueDate?: Date;
  commissionPaymentType?: string;
  commissionDueDate?: Date;
  freightPaymentType?: string;
  freightDueDate?: Date;
  
  // GMD
  expectedGMD?: number;
  targetWeight?: number;
  
  // Outros
  notes?: string;
}

export interface UpdateCattlePurchaseDto extends Partial<CreateCattlePurchaseDto> {
  // Campos que podem ser atualizados após recepção
  receivedDate?: Date;
  receivedWeight?: number;
  currentWeight?: number;
  currentQuantity?: number;
  deathCount?: number;
  weightBreakPercentage?: number;
  transportMortality?: number;
  
  // Custos adicionais
  healthCost?: number;
  feedCost?: number;
  operationalCost?: number;
  
  // Status
  status?: PurchaseStatus;
  stage?: string;
  
  // GMD updates
  estimatedSlaughterDate?: Date;
}

class CattlePurchaseService {
  // Criar nova compra
  async create(data: CreateCattlePurchaseDto): Promise<CattlePurchase> {
    try {
      // Gerar código no formato LOT-AAMM### (ex: LOT-2501001)
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2); // 25 para 2025
      const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 01 para janeiro
      
      // Buscar último código do mês para incrementar
      const lastPurchase = await prisma.cattlePurchase.findFirst({
        where: {
          lotCode: {
            startsWith: `LOT-${year}${month}`
          }
        },
        orderBy: {
          lotCode: 'desc'
        }
      });
      
      let sequence = '001';
      if (lastPurchase) {
        const lastSequence = parseInt(lastPurchase.lotCode.slice(-3));
        sequence = (lastSequence + 1).toString().padStart(3, '0');
      }
      
      const lotCode = `LOT-${year}${month}${sequence}`;
      
      // Calcular valores
      const averageWeight = data.purchaseWeight / data.initialQuantity;
      const carcassWeight = data.purchaseWeight * (data.carcassYield / 100);
      const carcassArrobas = carcassWeight / 15;
      const purchaseValue = data.pricePerArroba * carcassArrobas;
      
      // Calcular custo total inicial
      const totalCost = purchaseValue + 
                       (data.freightCost || 0) + 
                       (data.commission || 0);
      
      // Estimar data de abate se tiver GMD e peso alvo
      let estimatedSlaughterDate = undefined;
      if (data.expectedGMD && data.targetWeight) {
        const weightToGain = data.targetWeight - averageWeight;
        const daysToTarget = Math.ceil(weightToGain / data.expectedGMD);
        estimatedSlaughterDate = new Date();
        estimatedSlaughterDate.setDate(estimatedSlaughterDate.getDate() + daysToTarget);
      }
      
      return await prisma.cattlePurchase.create({
        data: {
          lotCode,
          
          // Relacionamentos
          vendorId: data.vendorId,
          brokerId: data.brokerId,
          transportCompanyId: data.transportCompanyId,
          payerAccountId: data.payerAccountId,
          userId: data.userId,
          
          // Dados básicos
          location: data.location,
          purchaseDate: data.purchaseDate,
          animalType: data.animalType,
          animalAge: data.animalAge,
          
          // Quantidades
          initialQuantity: data.initialQuantity,
          currentQuantity: data.initialQuantity,
          
          // Pesos
          purchaseWeight: data.purchaseWeight,
          averageWeight,
          
          // Valores
          carcassYield: data.carcassYield,
          pricePerArroba: data.pricePerArroba,
          purchaseValue,
          
          // Custos
          freightCost: data.freightCost || 0,
          freightDistance: data.freightDistance,
          freightCostPerKm: data.freightCostPerKm,
          commission: data.commission || 0,
          totalCost,
          
          // Pagamentos
          paymentType: data.paymentType,
          paymentTerms: data.paymentTerms,
          principalDueDate: data.principalDueDate,
          commissionPaymentType: data.commissionPaymentType,
          commissionDueDate: data.commissionDueDate,
          freightPaymentType: data.freightPaymentType,
          freightDueDate: data.freightDueDate,
          
          // GMD
          expectedGMD: data.expectedGMD,
          targetWeight: data.targetWeight,
          estimatedSlaughterDate,
          
          // Status inicial
          status: 'CONFIRMED',
          notes: data.notes
        },
        include: {
          vendor: true,
          broker: true,
          transportCompany: true,
          payerAccount: true
        }
      });
    } catch (error) {
      console.error('Erro ao criar CattlePurchase:', error);
      throw new AppError('Erro ao criar compra de gado', 500);
    }
  }
  
  // Buscar todas as compras
  async findAll(filters?: {
    status?: PurchaseStatus;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<CattlePurchase[]> {
    const where: Prisma.CattlePurchaseWhereInput = {};
    
    if (filters?.status) where.status = filters.status;
    if (filters?.vendorId) where.vendorId = filters.vendorId;
    if (filters?.startDate || filters?.endDate) {
      where.purchaseDate = {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate })
      };
    }
    
    return await prisma.cattlePurchase.findMany({
      where,
      include: {
        vendor: true,
        broker: true,
        transportCompany: true,
        payerAccount: true,
        penAllocations: {
          include: {
            pen: true
          }
        }
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    });
  }
  
  // Buscar por ID
  async findById(id: string): Promise<CattlePurchase | null> {
    return await prisma.cattlePurchase.findUnique({
      where: { id },
      include: {
        vendor: true,
        broker: true,
        transportCompany: true,
        payerAccount: true,
        penAllocations: {
          include: {
            pen: true
          }
        },
        healthRecords: {
          include: {
            protocol: true
          }
        },
        weightReadings: {
          orderBy: {
            readingDate: 'desc'
          }
        },
        expenses: true,
        saleRecords: true
      }
    });
  }
  
  // Atualizar compra
  async update(id: string, data: UpdateCattlePurchaseDto): Promise<CattlePurchase> {
    try {
      // Recalcular valores se necessário
      const updateData: any = { ...data };
      
      // Se estiver atualizando pesos ou preços, recalcular valores
      if (data.purchaseWeight || data.carcassYield || data.pricePerArroba) {
        const current = await prisma.cattlePurchase.findUnique({
          where: { id }
        });
        
        if (current) {
          const purchaseWeight = data.purchaseWeight || current.purchaseWeight;
          const carcassYield = data.carcassYield || current.carcassYield;
          const pricePerArroba = data.pricePerArroba || current.pricePerArroba;
          const initialQuantity = data.initialQuantity || current.initialQuantity;
          
          updateData.averageWeight = purchaseWeight / initialQuantity;
          const carcassWeight = purchaseWeight * (carcassYield / 100);
          const carcassArrobas = carcassWeight / 15;
          updateData.purchaseValue = pricePerArroba * carcassArrobas;
        }
      }
      
      // Recalcular custo total se algum custo mudou
      if (data.freightCost !== undefined || 
          data.commission !== undefined || 
          data.healthCost !== undefined || 
          data.feedCost !== undefined || 
          data.operationalCost !== undefined) {
        
        const current = await prisma.cattlePurchase.findUnique({
          where: { id }
        });
        
        if (current) {
          updateData.totalCost = (updateData.purchaseValue || current.purchaseValue) +
                                (data.freightCost ?? current.freightCost) +
                                (data.commission ?? current.commission) +
                                (data.healthCost ?? current.healthCost) +
                                (data.feedCost ?? current.feedCost) +
                                (data.operationalCost ?? current.operationalCost);
        }
      }
      
      // Atualizar GMD e estimativas
      if (data.expectedGMD || data.targetWeight) {
        const current = await prisma.cattlePurchase.findUnique({
          where: { id }
        });
        
        if (current) {
          const expectedGMD = data.expectedGMD || current.expectedGMD;
          const targetWeight = data.targetWeight || current.targetWeight;
          const currentWeight = current.averageWeight || 0;
          
          if (expectedGMD && targetWeight) {
            const weightToGain = targetWeight - currentWeight;
            const daysToTarget = Math.ceil(weightToGain / expectedGMD);
            updateData.estimatedSlaughterDate = new Date();
            updateData.estimatedSlaughterDate.setDate(
              updateData.estimatedSlaughterDate.getDate() + daysToTarget
            );
          }
        }
      }
      
      return await prisma.cattlePurchase.update({
        where: { id },
        data: updateData,
        include: {
          vendor: true,
          broker: true,
          transportCompany: true,
          payerAccount: true
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar CattlePurchase:', error);
      throw new AppError('Erro ao atualizar compra de gado', 500);
    }
  }
  
  // Registrar recepção com integrações automáticas
  async registerReception(id: string, data: {
    receivedDate: Date;
    receivedWeight: number;
    actualQuantity: number;
    transportMortality?: number;
    weightBreakPercentage?: number;
    penIds?: string[];
    createExpenses?: boolean; // Flag para criar despesas automaticamente
    applyHealthProtocol?: boolean; // Flag para aplicar protocolo de saúde
  }): Promise<CattlePurchase> {
    try {
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id },
        include: {
          vendor: true,
          broker: true,
          transportCompany: true,
          payerAccount: true
        }
      });
      
      if (!purchase) {
        throw new AppError('Compra não encontrada', 404);
      }
      
      // Calcular quebra de peso
      const weightBreak = purchase.purchaseWeight - data.receivedWeight;
      const weightBreakPercentage = data.weightBreakPercentage || 
                                   (weightBreak / purchase.purchaseWeight * 100);
      
      // Calcular mortalidade
      const transportMortality = data.transportMortality || 
                                (purchase.initialQuantity - data.actualQuantity);
      
      // Iniciar transação para garantir consistência
      const result = await prisma.$transaction(async (tx) => {
        // 1. Atualizar compra principal
        const updated = await tx.cattlePurchase.update({
          where: { id },
          data: {
            receivedDate: data.receivedDate,
            receivedWeight: data.receivedWeight,
            currentQuantity: data.actualQuantity,
            transportMortality,
            weightBreakPercentage,
            deathCount: transportMortality,
            status: 'RECEIVED',
            stage: 'received'
          }
        });
        
        // 2. Alocar em currais se fornecidos
        if (data.penIds && data.penIds.length > 0) {
          const animalsPerPen = Math.floor(data.actualQuantity / data.penIds.length);
          let remainingAnimals = data.actualQuantity % data.penIds.length;
          
          for (const penId of data.penIds) {
            const quantity = animalsPerPen + (remainingAnimals > 0 ? 1 : 0);
            remainingAnimals--;
            
            await tx.lotPenLink.create({
              data: {
                purchaseId: id,
                penId,
                quantity,
                entryDate: data.receivedDate
              }
            });
          }
        }
        
        // 3. Criar despesas automaticamente se solicitado
        if (data.createExpenses !== false) { // Por padrão, cria despesas
          const expensesToCreate = [];
          
          // Despesa de frete
          if (purchase.freightCost > 0) {
            expensesToCreate.push({
              category: 'FRETE',
              description: `Frete - ${purchase.lotCode}`,
              totalAmount: purchase.freightCost,
              dueDate: purchase.freightDueDate || data.receivedDate,
              purchaseId: id,
              vendorId: purchase.transportCompanyId,
              payerAccountId: purchase.payerAccountId,
              impactsCashFlow: true,
              isPaid: false
            });
          }
          
          // Despesa de comissão
          if (purchase.commission > 0) {
            expensesToCreate.push({
              category: 'COMISSÃO',
              description: `Comissão - ${purchase.lotCode}`,
              totalAmount: purchase.commission,
              dueDate: purchase.commissionDueDate || data.receivedDate,
              purchaseId: id,
              vendorId: purchase.brokerId,
              payerAccountId: purchase.payerAccountId,
              impactsCashFlow: true,
              isPaid: false
            });
          }
          
          // Despesa principal de compra
          if (purchase.purchaseValue > 0) {
            expensesToCreate.push({
              category: 'COMPRA_GADO',
              description: `Compra de gado - ${purchase.lotCode}`,
              totalAmount: purchase.purchaseValue,
              dueDate: purchase.principalDueDate || data.receivedDate,
              purchaseId: id,
              vendorId: purchase.vendorId,
              payerAccountId: purchase.payerAccountId,
              impactsCashFlow: true,
              isPaid: false
            });
          }
          
          // Criar todas as despesas
          if (expensesToCreate.length > 0) {
            await tx.expense.createMany({
              data: expensesToCreate
            });
          }
        }
        
        // 4. Aplicar protocolo de saúde inicial se solicitado
        if (data.applyHealthProtocol !== false && data.actualQuantity > 0) {
          // Buscar protocolo padrão de recepção
          const receptionProtocol = await tx.healthProtocol.findFirst({
            where: {
              isDefault: true,
              type: 'RECEPTION'
            }
          });
          
          if (receptionProtocol) {
            await tx.healthRecord.create({
              data: {
                protocolId: receptionProtocol.id,
                purchaseId: id,
                lotId: id, // Temporário, precisa ajustar
                animalCount: data.actualQuantity,
                costPerAnimal: receptionProtocol.costPerAnimal || 0,
                totalCost: (receptionProtocol.costPerAnimal || 0) * data.actualQuantity,
                userId: purchase.userId || 'system'
              }
            });
          }
        }
        
        return updated;
      });
      
      // 5. Disparar eventos/notificações (fora da transação)
      // TODO: Implementar sistema de eventos
      // this.eventEmitter.emit('cattle.received', result);
      
      return result;
    } catch (error) {
      console.error('Erro ao registrar recepção:', error);
      throw error instanceof AppError ? error : 
            new AppError('Erro ao registrar recepção', 500);
    }
  }
  
  // Atualizar status
  async updateStatus(id: string, status: PurchaseStatus): Promise<CattlePurchase> {
    return await prisma.cattlePurchase.update({
      where: { id },
      data: { 
        status,
        stage: status.toLowerCase()
      }
    });
  }

  // Marcar como confinado com alocação de currais
  async markAsConfined(id: string, data: {
    penAllocations: Array<{ penId: string; quantity: number }>;
    notes?: string;
  }): Promise<CattlePurchase> {
    try {
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id },
        include: {
          penAllocations: {
            where: { status: 'ACTIVE' }
          }
        }
      });

      if (!purchase) {
        throw new AppError('Compra não encontrada', 404);
      }

      if (purchase.status !== 'RECEIVED') {
        throw new AppError('Apenas compras recepcionadas podem ser confinadas', 400);
      }

      // Validar total de animais alocados
      const totalAllocated = data.penAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
      if (totalAllocated !== purchase.currentQuantity) {
        throw new AppError(`Total alocado (${totalAllocated}) deve ser igual à quantidade atual (${purchase.currentQuantity})`, 400);
      }

      // Executar em transação
      return await prisma.$transaction(async (tx) => {
        // Remover alocações antigas se existirem
        if (purchase.penAllocations.length > 0) {
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
        }

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
            status: 'CONFINED',
            stage: 'confined',
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
    } catch (error) {
      console.error('Erro ao marcar como confinado:', error);
      throw error instanceof AppError ? error : 
            new AppError('Erro ao marcar como confinado', 500);
    }
  }
  
  // Registrar morte
  async registerDeath(id: string, count: number, date: Date): Promise<CattlePurchase> {
    const purchase = await prisma.cattlePurchase.findUnique({
      where: { id }
    });
    
    if (!purchase) {
      throw new AppError('Compra não encontrada', 404);
    }
    
    const newDeathCount = purchase.deathCount + count;
    const newCurrentQuantity = purchase.currentQuantity - count;
    
    if (newCurrentQuantity < 0) {
      throw new AppError('Quantidade de mortes excede quantidade atual', 400);
    }
    
    return await prisma.cattlePurchase.update({
      where: { id },
      data: {
        deathCount: newDeathCount,
        currentQuantity: newCurrentQuantity
      }
    });
  }
  
  // Deletar compra
  async delete(id: string): Promise<void> {
    try {
      // Verificar se pode deletar
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id },
        include: {
          saleRecords: true,
          expenses: true
        }
      });
      
      if (!purchase) {
        throw new AppError('Compra não encontrada', 404);
      }
      
      if (purchase.saleRecords.length > 0) {
        throw new AppError('Não é possível excluir compra com vendas registradas', 400);
      }
      
      if (purchase.status === 'ACTIVE' || purchase.status === 'SOLD') {
        throw new AppError('Não é possível excluir compra ativa ou vendida', 400);
      }
      
      // Deletar relacionamentos primeiro
      await prisma.$transaction([
        prisma.lotPenLink.deleteMany({ where: { purchaseId: id } }),
        prisma.healthRecord.deleteMany({ where: { purchaseId: id } }),
        prisma.weightReading.deleteMany({ where: { purchaseId: id } }),
        prisma.expense.deleteMany({ where: { purchaseId: id } }),
        prisma.financialAccount.deleteMany({ where: { purchaseId: id } }),
        prisma.cattlePurchase.delete({ where: { id } })
      ]);
    } catch (error) {
      console.error('Erro ao deletar CattlePurchase:', error);
      throw error instanceof AppError ? error : 
            new AppError('Erro ao deletar compra', 500);
    }
  }
  
  // Buscar estatísticas
  async getStatistics(): Promise<any> {
    const [
      total,
      active,
      totalAnimals,
      averagePrice
    ] = await Promise.all([
      prisma.cattlePurchase.count(),
      prisma.cattlePurchase.count({ where: { status: 'ACTIVE' } }),
      prisma.cattlePurchase.aggregate({
        _sum: { currentQuantity: true }
      }),
      prisma.cattlePurchase.aggregate({
        _avg: { pricePerArroba: true }
      })
    ]);
    
    return {
      totalPurchases: total,
      activePurchases: active,
      totalAnimals: totalAnimals._sum.currentQuantity || 0,
      averagePricePerArroba: averagePrice._avg.pricePerArroba || 0
    };
  }
}

export const cattlePurchaseService = new CattlePurchaseService();
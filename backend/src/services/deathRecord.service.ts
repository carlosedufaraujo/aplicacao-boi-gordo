import { PrismaClient, DeathType } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

interface CreateDeathRecordData {
  purchaseId: string;
  penId: string;
  quantity: number;
  deathDate: Date;
  deathType: DeathType;
  cause?: string;
  veterinaryNotes?: string;
  estimatedLoss?: number;
  userId?: string;
}

interface DeathStatistics {
  totalDeaths: number;
  deathsByType: Record<string, number>;
  deathsByPen: Record<string, number>;
  deathsByPurchase: Record<string, number>;
  mortalityRate: number;
  totalEstimatedLoss: number;
}

class DeathRecordService {
  // Criar novo registro de morte
  async create(data: CreateDeathRecordData) {
    // Verificar se a compra existe
    const purchase = await prisma.cattlePurchase.findUnique({
      where: { id: data.purchaseId },
      include: {
        penAllocations: {
          where: { 
            penId: data.penId,
            status: 'ACTIVE'
          }
        }
      }
    });

    if (!purchase) {
      throw new AppError('Compra não encontrada', 404);
    }

    // Verificar se o curral existe
    const pen = await prisma.pen.findUnique({
      where: { id: data.penId }
    });

    if (!pen) {
      throw new AppError('Curral não encontrado', 404);
    }

    // Verificar se há animais suficientes no curral
    const allocation = purchase.penAllocations[0];
    if (!allocation || allocation.quantity < data.quantity) {
      throw new AppError('Quantidade de animais insuficiente no curral', 400);
    }

    // Calcular perda estimada se não fornecida
    let estimatedLoss = data.estimatedLoss;
    if (!estimatedLoss) {
      const averageWeight = purchase.averageWeight || purchase.purchaseWeight / purchase.initialQuantity;
      const pricePerKg = purchase.totalCost / (purchase.initialQuantity * purchase.purchaseWeight);
      estimatedLoss = data.quantity * averageWeight * pricePerKg;
    }

    // Criar registro de morte
    const deathRecord = await prisma.deathRecord.create({
      data: {
        purchaseId: data.purchaseId,
        penId: data.penId,
        quantity: data.quantity,
        deathDate: data.deathDate,
        deathType: data.deathType,
        cause: data.cause,
        veterinaryNotes: data.veterinaryNotes,
        estimatedLoss,
        userId: data.userId
      },
      include: {
        purchase: true,
        pen: true
      }
    });

    // Atualizar quantidade no curral (diminuir)
    await prisma.lotPenLink.update({
      where: { 
        id: allocation.id 
      },
      data: {
        quantity: allocation.quantity - data.quantity
      }
    });

    // Atualizar contadores na compra (apenas para controle de estoque)
    await prisma.cattlePurchase.update({
      where: { id: data.purchaseId },
      data: {
        currentQuantity: purchase.currentQuantity - data.quantity,
        deathCount: purchase.deathCount + data.quantity
      }
    });

    return deathRecord;
  }

  // Listar registros de morte
  async findAll(filters?: {
    purchaseId?: string;
    penId?: string;
    startDate?: Date;
    endDate?: Date;
    deathType?: DeathType;
  }) {
    const where: any = {};

    if (filters?.purchaseId) where.purchaseId = filters.purchaseId;
    if (filters?.penId) where.penId = filters.penId;
    if (filters?.deathType) where.deathType = filters.deathType;
    
    if (filters?.startDate || filters?.endDate) {
      where.deathDate = {};
      if (filters.startDate) where.deathDate.gte = filters.startDate;
      if (filters.endDate) where.deathDate.lte = filters.endDate;
    }

    const deathRecords = await prisma.deathRecord.findMany({
      where,
      include: {
        purchase: {
          select: {
            lotCode: true,
            vendor: true
          }
        },
        pen: {
          select: {
            penNumber: true,
            type: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        deathDate: 'desc'
      }
    });

    return deathRecords;
  }

  // Buscar registro por ID
  async findById(id: string) {
    const deathRecord = await prisma.deathRecord.findUnique({
      where: { id },
      include: {
        purchase: true,
        pen: true,
        user: true
      }
    });

    if (!deathRecord) {
      throw new AppError('Registro de morte não encontrado', 404);
    }

    return deathRecord;
  }

  // Atualizar registro de morte
  async update(id: string, data: Partial<CreateDeathRecordData>) {
    const existingRecord = await this.findById(id);

    // Se quantidade mudou, ajustar alocações
    if (data.quantity && data.quantity !== existingRecord.quantity) {
      const difference = data.quantity - existingRecord.quantity;
      
      // Buscar alocação atual
      const allocation = await prisma.lotPenLink.findFirst({
        where: {
          purchaseId: existingRecord.purchaseId,
          penId: existingRecord.penId,
          status: 'ACTIVE'
        }
      });

      if (allocation) {
        // Verificar se há animais suficientes
        if (difference > 0 && allocation.quantity < difference) {
          throw new AppError('Quantidade de animais insuficiente no curral', 400);
        }

        // Atualizar alocação
        await prisma.lotPenLink.update({
          where: { id: allocation.id },
          data: {
            quantity: allocation.quantity - difference
          }
        });

        // Atualizar contadores na compra
        const purchase = await prisma.cattlePurchase.findUnique({
          where: { id: existingRecord.purchaseId }
        });

        if (purchase) {
          await prisma.cattlePurchase.update({
            where: { id: existingRecord.purchaseId },
            data: {
              currentQuantity: purchase.currentQuantity - difference,
              deathCount: purchase.deathCount + difference
            }
          });
        }
      }
    }

    const updatedRecord = await prisma.deathRecord.update({
      where: { id },
      data: {
        ...data,
        deathDate: data.deathDate || undefined
      },
      include: {
        purchase: true,
        pen: true,
        user: true
      }
    });

    return updatedRecord;
  }

  // Deletar registro de morte (reverter morte)
  async delete(id: string) {
    const record = await this.findById(id);

    // Reverter quantidade no curral
    const allocation = await prisma.lotPenLink.findFirst({
      where: {
        purchaseId: record.purchaseId,
        penId: record.penId,
        status: 'ACTIVE'
      }
    });

    if (allocation) {
      await prisma.lotPenLink.update({
        where: { id: allocation.id },
        data: {
          quantity: allocation.quantity + record.quantity
        }
      });
    }

    // Reverter contadores na compra
    const purchase = await prisma.cattlePurchase.findUnique({
      where: { id: record.purchaseId }
    });

    if (purchase) {
      await prisma.cattlePurchase.update({
        where: { id: record.purchaseId },
        data: {
          currentQuantity: purchase.currentQuantity + record.quantity,
          deathCount: Math.max(0, purchase.deathCount - record.quantity)
        }
      });
    }

    await prisma.deathRecord.delete({
      where: { id }
    });

    return { message: 'Registro de morte removido com sucesso' };
  }

  // Obter estatísticas de mortes
  async getStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    purchaseId?: string;
    penId?: string;
  }): Promise<DeathStatistics> {
    const where: any = {};
    
    if (filters?.purchaseId) where.purchaseId = filters.purchaseId;
    if (filters?.penId) where.penId = filters.penId;
    
    if (filters?.startDate || filters?.endDate) {
      where.deathDate = {};
      if (filters.startDate) where.deathDate.gte = filters.startDate;
      if (filters.endDate) where.deathDate.lte = filters.endDate;
    }

    // Buscar todos os registros
    const records = await prisma.deathRecord.findMany({
      where,
      include: {
        purchase: true,
        pen: true
      }
    });

    // Calcular estatísticas
    const stats: DeathStatistics = {
      totalDeaths: 0,
      deathsByType: {},
      deathsByPen: {},
      deathsByPurchase: {},
      mortalityRate: 0,
      totalEstimatedLoss: 0
    };

    // Processar registros
    for (const record of records) {
      stats.totalDeaths += record.quantity;
      stats.totalEstimatedLoss += record.estimatedLoss || 0;

      // Por tipo
      if (!stats.deathsByType[record.deathType]) {
        stats.deathsByType[record.deathType] = 0;
      }
      stats.deathsByType[record.deathType] += record.quantity;

      // Por curral
      const penKey = record.pen.penNumber;
      if (!stats.deathsByPen[penKey]) {
        stats.deathsByPen[penKey] = 0;
      }
      stats.deathsByPen[penKey] += record.quantity;

      // Por compra
      const purchaseKey = record.purchase.lotCode;
      if (!stats.deathsByPurchase[purchaseKey]) {
        stats.deathsByPurchase[purchaseKey] = 0;
      }
      stats.deathsByPurchase[purchaseKey] += record.quantity;
    }

    // Calcular taxa de mortalidade
    if (filters?.purchaseId) {
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id: filters.purchaseId }
      });
      if (purchase) {
        stats.mortalityRate = (stats.totalDeaths / purchase.initialQuantity) * 100;
      }
    } else {
      // Taxa geral
      const totalPurchases = await prisma.cattlePurchase.aggregate({
        _sum: {
          initialQuantity: true
        }
      });
      if (totalPurchases._sum.initialQuantity) {
        stats.mortalityRate = (stats.totalDeaths / totalPurchases._sum.initialQuantity) * 100;
      }
    }

    return stats;
  }

  // Análise de mortes por período
  async getAnalysisByPeriod(startDate: Date, endDate: Date) {
    const records = await prisma.deathRecord.findMany({
      where: {
        deathDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        purchase: true,
        pen: true
      },
      orderBy: {
        deathDate: 'asc'
      }
    });

    // Agrupar por dia
    const byDay: Record<string, any> = {};
    
    for (const record of records) {
      const day = record.deathDate.toISOString().split('T')[0];
      
      if (!byDay[day]) {
        byDay[day] = {
          date: day,
          totalDeaths: 0,
          records: [],
          estimatedLoss: 0
        };
      }
      
      byDay[day].totalDeaths += record.quantity;
      byDay[day].estimatedLoss += record.estimatedLoss || 0;
      byDay[day].records.push(record);
    }

    return Object.values(byDay);
  }
}

export const deathRecordService = new DeathRecordService();
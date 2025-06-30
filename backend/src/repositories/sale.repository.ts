import { SaleRecord, SaleStatus, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { prisma } from '@/config/database';

export class SaleRepository extends BaseRepository<SaleRecord> {
  constructor() {
    super(prisma.saleRecord);
  }

  async findWithRelations(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        buyer: true,
        lot: {
          include: {
            purchaseOrder: {
              include: {
                vendor: true,
              },
            },
          },
        },
        user: true,
        revenues: true,
      },
    });
  }

  async findByStatus(status: SaleStatus) {
    return this.model.findMany({
      where: { status },
      include: {
        buyer: true,
        lot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByLot(lotId: string) {
    return this.model.findMany({
      where: { lotId },
      include: {
        buyer: true,
        revenues: true,
      },
      orderBy: { saleDate: 'desc' },
    });
  }

  async createWithRevenue(saleData: Prisma.SaleRecordCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      // Cria o registro de venda
      const sale = await tx.saleRecord.create({
        data: saleData,
      });

      // Se a venda está confirmada, cria a receita
      if (sale.status === 'CONFIRMED' || sale.status === 'SHIPPED') {
        await tx.revenue.create({
          data: {
            category: 'cattle_sales',
            description: `Venda de gado - Lote ${sale.lotId}`,
            totalAmount: sale.totalAmount,
            dueDate: sale.paymentDueDate || sale.saleDate,
            saleRecordId: sale.id,
            buyerId: sale.buyerId,
            userId: sale.userId,
            isReceived: false,
          },
        });
      }

      // Atualiza o status do lote se toda a quantidade foi vendida
      const lot = await tx.cattleLot.findUnique({
        where: { id: sale.lotId },
        include: {
          sales: true,
        },
      });

      if (lot) {
        const totalSold = lot.sales.reduce((sum, s) => sum + s.quantity, 0);
        if (totalSold >= lot.quantity) {
          await tx.cattleLot.update({
            where: { id: lot.id },
            data: { status: 'SOLD' },
          });
        }
      }

      return tx.saleRecord.findUnique({
        where: { id: sale.id },
        include: {
          buyer: true,
          lot: true,
          revenues: true,
        },
      });
    });
  }

  async updateStatus(id: string, status: SaleStatus) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.saleRecord.update({
        where: { id },
        data: { status },
      });

      // Se mudou para confirmado/enviado, cria receita se não existir
      if ((status === 'CONFIRMED' || status === 'SHIPPED') && sale) {
        const existingRevenue = await tx.revenue.findFirst({
          where: { saleRecordId: sale.id },
        });

        if (!existingRevenue) {
          await tx.revenue.create({
            data: {
              category: 'cattle_sales',
              description: `Venda de gado - Lote ${sale.lotId}`,
              totalAmount: sale.totalAmount,
              dueDate: sale.paymentDueDate || sale.saleDate,
              saleRecordId: sale.id,
              buyerId: sale.buyerId,
              userId: sale.userId,
              isReceived: false,
            },
          });
        }
      }

      // Se cancelou, remove a receita se não foi recebida
      if (status === 'CANCELLED') {
        await tx.revenue.deleteMany({
          where: {
            saleRecordId: sale.id,
            isReceived: false,
          },
        });
      }

      return sale;
    });
  }

  async getSalesByPeriod(startDate: Date, endDate: Date) {
    return this.model.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        buyer: true,
        lot: true,
        revenues: true,
      },
      orderBy: { saleDate: 'asc' },
    });
  }

  async getSalesStatistics(startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = startDate;
      if (endDate) where.saleDate.lte = endDate;
    }

    const sales = await this.model.findMany({
      where,
      include: {
        lot: true,
        revenues: true,
      },
    });

    const stats = {
      totalSales: sales.length,
      totalAnimals: sales.reduce((sum, s) => sum + s.quantity, 0),
      totalWeight: sales.reduce((sum, s) => sum + s.totalWeight, 0),
      totalRevenue: sales.reduce((sum, s) => sum + s.totalAmount, 0),
      averagePricePerKg: 0,
      averagePricePerHead: 0,
      byStatus: {
        negotiating: sales.filter(s => s.status === 'NEGOTIATING').length,
        confirmed: sales.filter(s => s.status === 'CONFIRMED').length,
        shipped: sales.filter(s => s.status === 'SHIPPED').length,
        delivered: sales.filter(s => s.status === 'DELIVERED').length,
        cancelled: sales.filter(s => s.status === 'CANCELLED').length,
      },
      receivedAmount: 0,
      pendingAmount: 0,
    };

    // Calcula médias
    if (stats.totalWeight > 0) {
      stats.averagePricePerKg = stats.totalRevenue / stats.totalWeight;
    }
    if (stats.totalAnimals > 0) {
      stats.averagePricePerHead = stats.totalRevenue / stats.totalAnimals;
    }

    // Calcula valores recebidos/pendentes
    sales.forEach(sale => {
      sale.revenues.forEach(revenue => {
        if (revenue.isReceived) {
          stats.receivedAmount += revenue.totalAmount;
        } else {
          stats.pendingAmount += revenue.totalAmount;
        }
      });
    });

    return stats;
  }

  async getProfitabilityByLot(lotId: string) {
    const lot = await prisma.cattleLot.findUnique({
      where: { id: lotId },
      include: {
        sales: {
          include: {
            revenues: true,
          },
        },
        expenses: true,
      },
    });

    if (!lot) {
      throw new Error('Lote não encontrado');
    }

    const totalSales = lot.sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalExpenses = lot.totalCost;
    const profit = totalSales - totalExpenses;
    const margin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

    return {
      lotId,
      totalSales,
      totalExpenses,
      profit,
      margin,
      roi: totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0,
      salesCount: lot.sales.length,
      totalAnimals: lot.quantity,
      soldAnimals: lot.sales.reduce((sum, s) => sum + s.quantity, 0),
      remainingAnimals: lot.remainingQuantity,
    };
  }
} 
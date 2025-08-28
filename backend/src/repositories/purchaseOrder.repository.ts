import { PurchaseOrder, PurchaseOrderStatus, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { prisma } from '@/config/database';

export class PurchaseOrderRepository extends BaseRepository<PurchaseOrder> {
  constructor() {
    super(prisma.purchaseOrder);
  }

  async findWithRelations(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        vendor: true,
        lot: {
          include: {
            penAllocations: {
              include: {
                pen: true,
              },
            },
          },
        },
        user: true,
      },
    });
  }

  async findByStatus(status: PurchaseOrderStatus) {
    return this.model.findMany({
      where: { status },
      include: {
        vendor: true,
        lot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: PurchaseOrderStatus) {
    return this.model.update({
      where: { id },
      data: { status },
    });
  }

  async createWithLot(orderData: Prisma.PurchaseOrderCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      // Cria a ordem de compra
      const order = await tx.purchaseOrder.create({
        data: orderData,
      });

      // Cria o lote automaticamente
      await tx.cattleLot.create({
        data: {
          lotNumber: `LOT-${order.orderNumber}`,
          purchaseOrderId: order.id,
          entryDate: new Date(),
          entryQuantity: order.animalCount,
          currentQuantity: order.animalCount,
          entryWeight: order.totalWeight,
          acquisitionCost: order.totalValue,
          feedCost: 0,
          healthCost: 0,
          operationalCost: 0,
          freightCost: 0,
          otherCosts: 0,
          totalCost: order.totalValue,
          status: 'ACTIVE' as const,
        },
      });

      // Não precisa atualizar a ordem pois o lote já tem purchaseOrderId

      return tx.purchaseOrder.findUnique({
        where: { id: order.id },
        include: {
          vendor: true,
          lot: true,
        },
      });
    });
  }

  async getStatistics(filters?: any) {
    const where = filters || {};
    
    const orders = await this.model.findMany({
      where,
      include: {
        lot: true,
      },
    });

    const stats = {
      total: orders.length,
      pending: orders.filter((o: any) => o.status === 'PENDING').length,
      confirmed: orders.filter((o: any) => o.status === 'CONFIRMED').length,
      shipped: orders.filter((o: any) => o.status === 'SHIPPED').length,
      completed: orders.filter((o: any) => o.status === 'COMPLETED').length,
      cancelled: orders.filter((o: any) => o.status === 'CANCELLED').length,
      totalValue: orders.reduce((sum: number, o: any) => sum + o.totalValue, 0),
      totalAnimals: orders.reduce((sum: number, o: any) => sum + o.animalCount, 0),
      averagePrice: 0,
    };

    if (stats.totalAnimals > 0) {
      stats.averagePrice = stats.totalValue / stats.totalAnimals;
    }

    return stats;
  }

  async findByStage(stage: string) {
    return this.model.findMany({
      where: {
        status: stage as any,
      },
      include: {
        vendor: true,
        lot: true,
      },
    });
  }

  async getNextOrderNumber(): Promise<string> {
    const lastOrder = await this.model.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    const nextNumber = lastOrder ? 
      (parseInt(lastOrder.orderNumber.replace(/\D/g, '')) + 1) : 1;
    
    return `PO-${nextNumber.toString().padStart(6, '0')}`;
  }

  async createWithFinancialAccounts(data: any) {
    return this.model.create({
      data,
      include: {
        vendor: true,
      },
    });
  }

  async createLotFromOrder(orderId: string, lotData: any) {
    return this.prisma.cattleLot.create({
      data: {
        ...lotData,
        purchaseOrderId: orderId,
      },
      include: {
        purchaseOrder: true,
      },
    });
  }
} 
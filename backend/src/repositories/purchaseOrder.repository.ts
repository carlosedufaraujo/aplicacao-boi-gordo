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
      const lot = await tx.cattleLot.create({
        data: {
          purchaseOrderId: order.id,
          quantity: order.quantity,
          remainingQuantity: order.quantity,
          averageWeight: order.averageWeight,
          totalWeight: order.quantity * order.averageWeight,
          purchasePrice: order.pricePerKg,
          purchaseCost: order.totalAmount,
          feedCost: 0,
          healthCost: 0,
          operationalCost: 0,
          otherCosts: 0,
          totalCost: order.totalAmount,
          status: 'PENDING',
        },
      });

      // Atualiza a ordem com o ID do lote
      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { lotId: lot.id },
      });

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
      pending: orders.filter(o => o.status === 'PENDING').length,
      confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
      shipped: orders.filter(o => o.status === 'SHIPPED').length,
      completed: orders.filter(o => o.status === 'COMPLETED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      totalAnimals: orders.reduce((sum, o) => sum + o.quantity, 0),
      averagePrice: 0,
    };

    if (stats.totalAnimals > 0) {
      stats.averagePrice = stats.totalValue / stats.totalAnimals;
    }

    return stats;
  }
} 
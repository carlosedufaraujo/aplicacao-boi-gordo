import { BaseRepository } from './base.repository';

export class SaleRecordRepository extends BaseRepository {
  constructor() {
    super('saleRecord');
  }

  async findWithRelations(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        purchase: true,
        buyer: true,
        payerAccount: true,
      },
    });
  }

  async findByPeriod(startDate: Date, endDate: Date, filters?: any) {
    const where: any = {
      saleDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (filters?.buyerId) {
      where.buyerId = filters.buyerId;
    }

    if (filters?.purchaseId) {
      where.purchaseId = filters.purchaseId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.model.findMany({
      where,
      include: {
        purchase: true,
        buyer: true,
        payerAccount: true,
      },
      orderBy: { saleDate: 'desc' },
    });
  }

  async findByPurchase(purchaseId: string) {
    return this.model.findMany({
      where: { purchaseId },
      include: {
        buyer: true,
        payerAccount: true,
      },
      orderBy: { saleDate: 'desc' },
    });
  }

  async findByBuyer(buyerId: string) {
    return this.model.findMany({
      where: { buyerId },
      include: {
        purchase: true,
        payerAccount: true,
      },
      orderBy: { saleDate: 'desc' },
    });
  }

  async getStatsByPeriod(startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = startDate;
      if (endDate) where.saleDate.lte = endDate;
    }

    const sales = await this.model.findMany({ where });
    
    const stats = {
      totalSales: sales.length,
      totalQuantity: sales.reduce((sum, s) => sum + s.quantity, 0),
      totalWeight: sales.reduce((sum, s) => sum + s.totalWeight, 0),
      totalGrossValue: sales.reduce((sum, s) => sum + s.grossValue, 0),
      totalNetValue: sales.reduce((sum, s) => sum + s.netValue, 0),
      averagePrice: 0,
    };

    if (stats.totalWeight > 0) {
      stats.averagePrice = stats.totalNetValue / stats.totalWeight;
    }

    return stats;
  }

  async getSalesByStatus() {
    const sales = await this.model.findMany({});
    
    return {
      PENDING: sales.filter(s => s.status === 'PENDING').length,
      CONFIRMED: sales.filter(s => s.status === 'CONFIRMED').length,
      DELIVERED: sales.filter(s => s.status === 'DELIVERED').length,
      COMPLETED: sales.filter(s => s.status === 'COMPLETED').length,
      CANCELLED: sales.filter(s => s.status === 'CANCELLED').length,
    };
  }

  async findAll(where: any = {}, pagination?: any, include?: any) {
    const query: any = { where };
    
    if (pagination) {
      query.skip = pagination.skip;
      query.take = pagination.take;
    }
    
    if (include) {
      query.include = include;
    }
    
    const [items, total] = await Promise.all([
      this.model.findMany(query),
      this.model.count({ where })
    ]);
    
    return { items, total };
  }

  async create(data: any) {
    return this.model.create({ data });
  }

  async update(id: string, data: any) {
    return this.model.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return this.model.delete({
      where: { id }
    });
  }
}
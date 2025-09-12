import { BaseRepository, PaginationParams, QueryOptions } from './base.repository';

export class SaleRecordRepository extends BaseRepository<any> {
  constructor() {
    super('saleRecord');
  }

  async findWithRelations(id: string) {
    return (this as any).model.findUnique({
      where: { id },
      include: {
        pen: true,
        purchase: true,
        buyer: true,
        receiverAccount: true,
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

    return (this as any).model.findMany({
      where,
      include: {
        pen: true,
        purchase: true,
        buyer: true,
        receiverAccount: true,
      },
      orderBy: { saleDate: 'desc' },
    });
  }

  async findByPurchase(purchaseId: string) {
    return (this as any).model.findMany({
      where: { purchaseId },
      include: {
        buyer: true,
        receiverAccount: true,
      },
      orderBy: { saleDate: 'desc' },
    });
  }

  async findByBuyer(buyerId: string) {
    return (this as any).model.findMany({
      where: { buyerId },
      include: {
        purchase: true,
        receiverAccount: true,
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

    const sales = await (this as any).model.findMany({ where });
    
    const stats = {
      totalSales: sales.length,
      totalQuantity: sales.reduce((sum: number, s: any) => sum + s.quantity, 0),
      totalWeight: sales.reduce((sum: number, s: any) => sum + s.exitWeight, 0),
      totalCarcassWeight: sales.reduce((sum: number, s: any) => sum + s.carcassWeight, 0),
      totalGrossValue: sales.reduce((sum: number, s: any) => sum + s.totalValue, 0),
      totalNetValue: sales.reduce((sum: number, s: any) => sum + s.netValue, 0),
      averagePrice: 0,
    };

    if (stats.totalCarcassWeight > 0) {
      stats.averagePrice = stats.totalNetValue / (stats.totalCarcassWeight / 15); // preço por arroba
    }

    return stats;
  }

  async getSalesByStatus() {
    const sales = await (this as any).model.findMany({});
    
    return {
      PENDING: sales.filter((s: any) => s.status === 'PENDING').length,
      CONFIRMED: sales.filter((s: any) => s.status === 'CONFIRMED').length,
      DELIVERED: sales.filter((s: any) => s.status === 'DELIVERED').length,
      PAID: sales.filter((s: any) => s.status === 'PAID').length,
      CANCELLED: sales.filter((s: any) => s.status === 'CANCELLED').length,
    };
  }

  async findAll(where: any = {}, pagination?: PaginationParams, options?: QueryOptions) {
    const query: any = { where };
    
    if (pagination) {
      const { page = 1, limit = 20 } = pagination;
      query.skip = (page - 1) * limit;
      query.take = limit;
    }
    
    if (options?.include) {
      query.include = options.include;
    }
    
    const [items, total] = await Promise.all([
      (this as any).model.findMany(query),
      (this as any).model.count({ where })
    ]);
    
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const totalPages = Math.ceil(total / limit);
    
    return { 
      items, 
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  async create(data: any) {
    // Limpar strings vazias de campos opcionais
    const cleanData = { ...data };
    ['receiverAccountId', 'invoiceNumber', 'contractNumber', 'observations', 'penId', 'purchaseId'].forEach(field => {
      if (cleanData[field] === '' || cleanData[field] === undefined) {
        delete cleanData[field];
      }
    });
    
    return (this as any).model.create({ 
      data: cleanData,
      include: {
        pen: true,
        purchase: true,
        buyer: true,
        receiverAccount: true,
      }
    });
  }

  async update(id: string, data: any) {
    return (this as any).model.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return (this as any).model.delete({
      where: { id }
    });
  }
}
import { Partner, PartnerType } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class PartnerRepository extends BaseRepository<Partner> {
  constructor() {
    super('partner');
  }

  async findByType(type: PartnerType) {
    return await this.model.findMany({
      where: { type, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByCpfCnpj(cpfCnpj: string): Promise<Partner | null> {
    return await this.model.findUnique({
      where: { cpfCnpj },
    });
  }

  async findActive() {
    return await this.model.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async toggleStatus(id: string): Promise<Partner> {
    const partner = await this.findById(id);
    if (!partner) {
      throw new Error('Partner not found');
    }

    return await this.model.update({
      where: { id },
      data: { isActive: !partner.isActive },
    });
  }

  async getStats() {
    const [total, active, byType] = await Promise.all([
      this.model.count(),
      this.model.count({ where: { isActive: true } }),
      this.model.groupBy({
        by: ['type'],
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byType: byType.reduce((acc: Record<PartnerType, number>, curr: any) => {
        acc[curr.type] = curr._count;
        return acc;
      }, {} as Record<PartnerType, number>),
    };
  }

  async search(query: string) {
    return await this.model.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { cpfCnpj: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findWithRelations(id: string) {
    return await this.model.findUnique({
      where: { id },
      include: {
        purchaseOrdersAsVendor: true,
        purchaseOrdersAsBroker: true,
        saleRecords: true,
        contributions: true,
      },
    });
  }

  async getPartnerStats(id: string) {
    const partner = await this.model.findUnique({
      where: { id },
      include: {
        purchaseOrdersAsVendor: {
          select: {
            id: true,
            totalValue: true,
            status: true,
          },
        },
        purchaseOrdersAsBroker: {
          select: {
            id: true,
            totalValue: true,
            status: true,
          },
        },
        saleRecords: {
          select: {
            id: true,
            totalValue: true,
            status: true,
          },
        },
        contributions: {
          select: {
            id: true,
            amount: true,
            type: true,
          },
        },
      },
    });

    if (!partner) return null;

    return {
      partner: {
        id: partner.id,
        name: partner.name,
        type: partner.type,
      },
      totals: {
        asVendor: partner.purchaseOrdersAsVendor.reduce((sum, po) => sum + (po.totalValue || 0), 0),
        asBroker: partner.purchaseOrdersAsBroker.reduce((sum, po) => sum + (po.totalValue || 0), 0),
        sales: partner.saleRecords.reduce((sum, sale) => sum + (sale.totalValue || 0), 0),
        contributions: partner.contributions.reduce((sum, contrib) => sum + (contrib.amount || 0), 0),
      },
      counts: {
        purchaseOrdersAsVendor: partner.purchaseOrdersAsVendor.length,
        purchaseOrdersAsBroker: partner.purchaseOrdersAsBroker.length,
        saleRecords: partner.saleRecords.length,
        contributions: partner.contributions.length,
      },
    };
  }
}

export const partnerRepository = new PartnerRepository();
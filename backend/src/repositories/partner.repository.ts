import { Partner, PartnerType } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { prisma } from '@/config/database';

export class PartnerRepository extends BaseRepository<Partner> {
  constructor() {
    super(prisma.partner);
  }

  async findByType(type: PartnerType) {
    return this.model.findMany({
      where: { type, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByCpfCnpj(cpfCnpj: string): Promise<Partner | null> {
    return this.model.findUnique({
      where: { cpfCnpj },
    });
  }

  async findWithRelations(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        purchaseOrdersAsVendor: {
          include: {
            lot: true,
          },
        },
        purchaseOrdersAsBroker: {
          include: {
            lot: true,
          },
        },
        saleRecords: true,
        contributions: true,
      },
    });
  }

  async getPartnerStats(id: string) {
    const partner = await this.findWithRelations(id);
    if (!partner) return null;

    const stats = {
      totalPurchasesAsVendor: partner.purchaseOrdersAsVendor.length,
      totalPurchasesAsBroker: partner.purchaseOrdersAsBroker.length,
      totalSales: partner.saleRecords.length,
      totalContributions: partner.contributions.reduce((sum, c) => sum + c.amount, 0),
      activeLots: partner.purchaseOrdersAsVendor.filter(po => po.lot?.status === 'ACTIVE').length,
    };

    return { partner, stats };
  }
} 
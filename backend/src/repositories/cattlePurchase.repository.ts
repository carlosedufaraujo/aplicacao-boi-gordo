import { CattlePurchase, PurchaseStatus, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class CattlePurchaseRepository extends BaseRepository<CattlePurchase> {
  constructor() {
    super('cattlePurchase');
  }

  // Método findAll específico para bypass problema com BaseRepository
  async findAll(where: any = {}, pagination?: any, _options?: any) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.cattlePurchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          penAllocations: {
            where: { status: 'ACTIVE' },
            include: {
              pen: {
                select: {
                  id: true,
                  penNumber: true,
                  capacity: true,
                  status: true
                }
              }
            }
          }
          // payerAccount relação não existe no schema
        }
      }),
      this.prisma.cattlePurchase.count({ where })
    ]);

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

  async findByStatus(status: PurchaseStatus) {
    return await this.findMany(
      { status },
      {
        include: {
          vendor: true,
          broker: true,
          transportCompany: true,
          payerAccount: true,
          penAllocations: {
            where: { status: 'ACTIVE' },
            include: { pen: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    );
  }

  async findWithRelations(id: string) {
    return await this.prisma.cattlePurchase.findUnique({
      where: { id },
      include: {
        vendor: true,
        broker: true,
        transportCompany: true,
        payerAccount: true,
        penAllocations: {
          where: { status: 'ACTIVE' },
          include: {
            pen: {
              select: {
                id: true,
                penNumber: true,
                capacity: true,
                status: true
              }
            }
          }
        }
      }
    });
  }

  async findActive() {
    return await this.findMany(
      {
        status: {
          in: ['CONFIRMED', 'RECEIVED', 'ACTIVE']
        }
      },
      {
        include: {
          vendor: true,
          penAllocations: {
            where: { status: 'ACTIVE' }
          }
        }
      }
    );
  }

  async getStatistics() {
    const [total, confirmed, received, confined, totalAnimals, totalWeight] = await Promise.all([
      this.count({}),
      this.count({ status: 'CONFIRMED' }),
      this.count({ status: 'RECEIVED' }),
      this.count({ status: 'CONFINED' }),
      this.aggregate({
        _sum: { currentQuantity: true }
      }),
      this.aggregate({
        _sum: { currentWeight: true }
      })
    ]);

    return {
      total,
      byStatus: {
        confirmed,
        received,
        confined
      },
      totalAnimals: totalAnimals._sum.currentQuantity || 0,
      totalWeight: totalWeight._sum.currentWeight || 0
    };
  }

  async updatePenAllocations(purchaseId: string, allocations: any[]) {
    // Remove alocações antigas
    await this.prisma.lotPenLink.updateMany({
      where: {
        purchaseId,
        status: 'ACTIVE'
      },
      data: {
        status: 'REMOVED',
        removalDate: new Date()
      }
    });

    // Cria novas alocações
    if (allocations.length > 0) {
      await this.prisma.lotPenLink.createMany({
        data: allocations.map(alloc => ({
          ...alloc,
          purchaseId,
          status: 'ACTIVE',
          allocationDate: new Date()
        }))
      });
    }
  }

  async getDashboardSummary(dateRange?: { start: Date; end: Date }) {
    const where: Prisma.CattlePurchaseWhereInput = {};
    
    if (dateRange) {
      where.purchaseDate = {
        gte: dateRange.start,
        lte: dateRange.end
      };
    }

    const purchases = await this.findMany(where, {
      include: {
        vendor: true,
        penAllocations: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    const summary = {
      totalPurchases: purchases.length,
      totalAnimals: purchases.reduce((sum: number, p) => sum + p.currentQuantity, 0),
      totalWeight: purchases.reduce((sum: number, p) => sum + (p.currentWeight || 0), 0),
      totalValue: purchases.reduce((sum: number, p) => sum + p.purchaseValue, 0),
      averagePrice: 0,
      mortalityRate: 0
    };

    if (summary.totalWeight > 0) {
      summary.averagePrice = summary.totalValue / (summary.totalWeight / 30); // Preço médio por arroba
    }

    const totalInitial = purchases.reduce((sum: number, p) => sum + p.initialQuantity, 0);
    const totalDead = purchases.reduce((sum: number, p) => sum + p.deathCount, 0);
    
    if (totalInitial > 0) {
      summary.mortalityRate = (totalDead / totalInitial) * 100;
    }

    return summary;
  }
}
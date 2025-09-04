import { Pen, PenStatus, PenType, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class PenRepository extends BaseRepository<Pen> {
  constructor() {
    super('pen');
  }

  async findByStatus(status: PenStatus) {
    return await this.findMany(
      { status, isActive: true },
      {
        include: {
          lotAllocations: {
            where: { status: 'ACTIVE' },
            include: {
              purchase: {
                include: { vendor: true }
              }
            }
          }
        },
        orderBy: { penNumber: 'asc' }
      }
    );
  }

  async findByType(type: PenType) {
    return await this.findMany(
      { type, isActive: true },
      { orderBy: { penNumber: 'asc' } }
    );
  }

  // Método findAll específico para incluir ocupação calculada
  async findAll(where: any = {}, pagination?: any) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 100;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.pen.findMany({
        where,
        skip,
        take: limit,
        orderBy: { penNumber: 'asc' },
        include: {
          lotAllocations: {
            where: { status: 'ACTIVE' },
            include: {
              purchase: {
                select: {
                  id: true,
                  lotCode: true,
                  vendor: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      this.prisma.pen.count({ where })
    ]);

    // Calcular ocupação para cada curral
    const itemsWithOccupancy = items.map(pen => {
      const allocations = (pen as any).lotAllocations || [];
      const currentOccupancy = allocations.reduce(
        (sum: number, alloc: any) => sum + (alloc.quantity || 0),
        0
      );

      return {
        ...pen,
        currentOccupancy,
        activeLots: allocations.length
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: itemsWithOccupancy,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  async findAvailable(minCapacity?: number) {
    const where: Prisma.PenWhereInput = {
      status: 'AVAILABLE',
      isActive: true
    };

    if (minCapacity) {
      where.capacity = { gte: minCapacity };
    }

    return await this.findMany(where, {
      include: {
        lotAllocations: {
          where: { status: 'ACTIVE' }
        }
      },
      orderBy: { capacity: 'desc' }
    });
  }

  async findWithOccupation(id: string) {
    const pen = await this.findById(id, {
      include: {
        lotAllocations: {
          where: { status: 'ACTIVE' },
          include: {
            purchase: {
              include: { vendor: true }
            }
          }
        },
        healthProtocols: {
          orderBy: { applicationDate: 'desc' },
          take: 10
        },
        feedRecords: {
          orderBy: { feedDate: 'desc' },
          take: 10
        }
      }
    });

    if (!pen) return null;

    const penAllocations = (pen as any).penAllocations || [];
    const totalOccupied = penAllocations.reduce(
      (sum: number, allocation: any) => sum + (allocation.quantity || 0), 
      0
    );
    
    const occupationRate = (totalOccupied / pen.capacity) * 100;
    const availableSpace = pen.capacity - totalOccupied;

    const lotsSummary = penAllocations.map((allocation: any) => ({
      purchaseId: allocation.purchase?.id,
      lotCode: allocation.purchase?.lotCode,
      vendorName: allocation.purchase?.vendor?.name,
      quantity: allocation.quantity || 0,
      percentage: allocation.quantity || 0,
      allocationDate: allocation.entryDate
    }));

    return {
      ...pen,
      occupation: {
        totalOccupied,
        occupationRate,
        availableSpace,
        lotsSummary
      }
    };
  }

  async getOccupationStats() {
    const pens = await this.findMany(
      { isActive: true },
      {
        include: {
          lotAllocations: {
            where: { status: 'ACTIVE' }
          }
        }
      }
    );

    const stats = {
      totalPens: pens.length,
      totalCapacity: 0,
      totalOccupied: 0,
      availablePens: 0,
      occupiedPens: 0,
      maintenancePens: 0,
      quarantinePens: 0,
      occupationRate: 0,
      availableSpace: 0
    };

    pens.forEach(pen => {
      const penAllocations = (pen as any).penAllocations || [];
      const occupied = penAllocations.reduce(
        (sum: number, a: any) => sum + (a.quantity || 0), 
        0
      );
      
      stats.totalCapacity += pen.capacity;
      stats.totalOccupied += occupied;
      
      if (pen.status === 'AVAILABLE' && occupied === 0) {
        stats.availablePens++;
      } else if (pen.status === 'OCCUPIED') {
        stats.occupiedPens++;
      } else if (pen.status === 'MAINTENANCE') {
        stats.maintenancePens++;
      } else if (pen.status === 'QUARANTINE') {
        stats.quarantinePens++;
      }
    });

    stats.occupationRate = stats.totalCapacity > 0 
      ? (stats.totalOccupied / stats.totalCapacity) * 100 
      : 0;
    
    stats.availableSpace = stats.totalCapacity - stats.totalOccupied;

    return stats;
  }

  async getOccupationData() {
    const pens = await this.findMany(
      { isActive: true },
      {
        include: {
          lotAllocations: {
            where: { status: 'ACTIVE' },
            include: {
              purchase: true
            }
          }
        }
      }
    );

    return pens.map(pen => {
      const allocations = (pen as any).lotAllocations || [];
      const currentOccupancy = allocations.reduce(
        (sum: number, a: any) => sum + (a.quantity || 0), 
        0
      );
      
      return {
        penId: pen.id,
        penNumber: pen.penNumber,
        capacity: pen.capacity,
        currentOccupancy,
        percentageOccupied: pen.capacity > 0 ? (currentOccupancy / pen.capacity) * 100 : 0,
        availableSpace: pen.capacity - currentOccupancy,
        status: pen.status,
        type: pen.type
      };
    });
  }

  async updateStatus(id: string, status: PenStatus) {
    return await this.update(id, { status });
  }

  async allocatePurchase(
    penId: string, 
    purchaseId: string, 
    quantity: number
  ) {
    const pen = await this.findById(penId);
    if (!pen) throw new Error('Curral não encontrado');

    const purchase = await this.prisma.cattlePurchase.findUnique({
      where: { id: purchaseId }
    });
    if (!purchase) throw new Error('Compra não encontrada');

    // Cria alocação
    await this.prisma.lotPenLink.create({
      data: {
        purchaseId,
        penId,
        quantity,
        percentageOfLot: (quantity / purchase.currentQuantity) * 100,
        percentageOfPen: (quantity / pen.capacity) * 100,
        allocationDate: new Date(),
        status: 'ACTIVE'
      }
    });

    // Atualiza status do curral se necessário
    const currentOccupation = await this.prisma.lotPenLink.aggregate({
      where: {
        penId,
        status: 'ACTIVE'
      },
      _sum: { quantity: true }
    });

    const totalOccupied = currentOccupation._sum.quantity || 0;
    
    if (totalOccupied >= pen.capacity) {
      await this.updateStatus(penId, 'OCCUPIED');
    }
  }

  async getPenOccupation(id: string) {
    return this.findWithOccupation(id);
  }

  async applyHealthProtocol(penId: string, data: any) {
    return this.prisma.healthProtocol.create({
      data: {
        ...data,
        penId,
      }
    });
  }
}
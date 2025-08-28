import { Pen, PenStatus, PenType } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { prisma } from '@/config/database';

export class PenRepository extends BaseRepository<Pen> {
  constructor() {
    super(prisma.pen);
  }

  async findWithOccupation(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        lotAllocations: {
          where: { status: 'ACTIVE' },
          include: {
            lot: {
              include: {
                purchaseOrder: {
                  include: {
                    vendor: true,
                  },
                },
              },
            },
          },
        },
        healthProtocols: {
          orderBy: { applicationDate: 'desc' },
          take: 10,
        },
        feedRecords: {
          orderBy: { feedDate: 'desc' },
          take: 10,
        },
      },
    });
  }

  async findByStatus(status: PenStatus) {
    return this.model.findMany({
      where: { status, isActive: true },
      include: {
        lotAllocations: {
          where: { status: 'ACTIVE' },
          include: {
            lot: true,
          },
        },
      },
      orderBy: { penNumber: 'asc' },
    });
  }

  async findByType(type: PenType) {
    return this.model.findMany({
      where: { type, isActive: true },
      orderBy: { penNumber: 'asc' },
    });
  }

  async findAvailable(minCapacity?: number) {
    const where: any = {
      status: 'AVAILABLE',
      isActive: true,
    };

    if (minCapacity) {
      where.capacity = { gte: minCapacity };
    }

    return this.model.findMany({
      where,
      include: {
        lotAllocations: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: { capacity: 'desc' },
    });
  }

  async getPenOccupation(id: string) {
    const pen = await this.findWithOccupation(id);
    if (!pen) return null;

    const totalOccupied = pen.lotAllocations.reduce((sum: number, allocation: any) => sum + allocation.quantity, 0);
    const occupationRate = (totalOccupied / pen.capacity) * 100;
    const availableSpace = pen.capacity - totalOccupied;

    const lotsSummary = pen.lotAllocations.map((allocation: any) => ({
      lotId: allocation.lot.id,
      lotNumber: allocation.lot.lotNumber,
      vendorName: allocation.lot.purchaseOrder.vendor.name,
      quantity: allocation.quantity,
      percentage: allocation.percentageOfPen,
      allocationDate: allocation.allocationDate,
    }));

    return {
      pen,
      occupation: {
        totalOccupied,
        occupationRate,
        availableSpace,
        lotsSummary,
      },
    };
  }

  async updateStatus(id: string, status: PenStatus) {
    return this.model.update({
      where: { id },
      data: { status },
    });
  }

  async getOccupationStats() {
    const pens = await this.model.findMany({
      where: { isActive: true },
      include: {
        lotAllocations: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    const stats = pens.reduce((acc: any, pen: any) => {
      const occupied = pen.lotAllocations.reduce((sum: number, a: any) => sum + a.quantity, 0);
      
      acc.totalPens++;
      acc.totalCapacity += pen.capacity;
      acc.totalOccupied += occupied;
      
      if (pen.status === 'AVAILABLE' && occupied === 0) {
        acc.availablePens++;
      } else if (pen.status === 'OCCUPIED') {
        acc.occupiedPens++;
      } else if (pen.status === 'MAINTENANCE') {
        acc.maintenancePens++;
      } else if (pen.status === 'QUARANTINE') {
        acc.quarantinePens++;
      }

      return acc;
    }, {
      totalPens: 0,
      totalCapacity: 0,
      totalOccupied: 0,
      availablePens: 0,
      occupiedPens: 0,
      maintenancePens: 0,
      quarantinePens: 0,
    });

    return {
      ...stats,
      occupationRate: stats.totalCapacity > 0 
        ? (stats.totalOccupied / stats.totalCapacity) * 100 
        : 0,
      availableSpace: stats.totalCapacity - stats.totalOccupied,
    };
  }

  async applyHealthProtocol(penId: string, protocolData: any) {
    return this.prisma.$transaction(async (tx) => {
      // Cria o protocolo
      const protocol = await tx.healthProtocol.create({
        data: {
          ...protocolData,
          penId,
        },
      });

      // Busca alocações ativas no curral
      const allocations = await tx.lotPenLink.findMany({
        where: {
          penId,
          status: 'ACTIVE',
        },
        include: {
          lot: true,
        },
      });

      // Cria registros de saúde para cada lote proporcionalmente
      const healthRecords = await Promise.all(
        allocations.map(async (allocation) => {
          const costPerAnimal = protocol.totalCost / 
            allocations.reduce((sum, a) => sum + a.quantity, 0);
          
          const record = await tx.healthRecord.create({
            data: {
              protocolId: protocol.id,
              lotId: allocation.lotId,
              animalCount: allocation.quantity,
              costPerAnimal,
              totalCost: costPerAnimal * allocation.quantity,
              userId: protocolData.userId,
            },
          });

          // Atualiza custos do lote
          await tx.cattleLot.update({
            where: { id: allocation.lotId },
            data: {
              healthCost: { increment: record.totalCost },
              totalCost: { increment: record.totalCost },
            },
          });

          return record;
        })
      );

      return { protocol, healthRecords };
    });
  }
} 
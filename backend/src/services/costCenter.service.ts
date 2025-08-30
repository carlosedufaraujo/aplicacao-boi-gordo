import { CostCenter, CostCenterType } from '@prisma/client';
import { prisma } from '@/config/database';

export class CostCenterService {
  async findAll() {
    const costCenters = await prisma.costCenter.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    // Calcular valores alocados para cada centro
    const costCentersWithStats = await Promise.all(
      costCenters.map(async (center) => {
        const expenses = await prisma.expense.findMany({
          where: { costCenterId: center.id },
        });

        const allocated = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
        const budget = 100000; // Valor padrão, pode vir de outra tabela
        const percentage = budget > 0 ? (allocated / budget) * 100 : 0;

        return {
          ...center,
          allocated,
          budget,
          percentage,
        };
      })
    );

    return costCentersWithStats;
  }

  async findById(id: string) {
    return prisma.costCenter.findUnique({
      where: { id },
      include: {
        expenses: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        revenues: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(data: {
    code: string;
    name: string;
    type: CostCenterType;
    parentId?: string;
  }) {
    return prisma.costCenter.create({
      data,
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    type: CostCenterType;
    isActive: boolean;
  }>) {
    return prisma.costCenter.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    // Soft delete - apenas desativa
    return prisma.costCenter.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats() {
    const costCenters = await prisma.costCenter.findMany({
      where: { isActive: true },
    });

    const stats = await Promise.all(
      costCenters.map(async (center) => {
        const expenses = await prisma.expense.aggregate({
          where: { costCenterId: center.id },
          _sum: { totalAmount: true },
          _count: true,
        });

        const revenues = await prisma.revenue.aggregate({
          where: { costCenterId: center.id },
          _sum: { totalAmount: true },
          _count: true,
        });

        return {
          id: center.id,
          code: center.code,
          name: center.name,
          type: center.type,
          totalExpenses: expenses._sum.totalAmount || 0,
          totalRevenues: revenues._sum.totalAmount || 0,
          transactionCount: expenses._count + revenues._count,
        };
      })
    );

    return stats;
  }
}

export const costCenterService = new CostCenterService();
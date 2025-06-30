import { PrismaClient } from '@prisma/client';
import { prisma } from '@/config/database';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected model: any;

  constructor(model: any) {
    this.prisma = prisma;
    this.model = model;
  }

  async findAll(
    where: any = {},
    pagination?: PaginationParams,
    include?: any
  ): Promise<PaginatedResult<T>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const orderBy: any = {};
    if (pagination?.sortBy) {
      orderBy[pagination.sortBy] = pagination.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
      }),
      this.model.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, include?: any): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
      include,
    });
  }

  async findOne(where: any, include?: any): Promise<T | null> {
    return this.model.findFirst({
      where,
      include,
    });
  }

  async create(data: any, include?: any): Promise<T> {
    return this.model.create({
      data,
      include,
    });
  }

  async update(id: string, data: any, include?: any): Promise<T> {
    return this.model.update({
      where: { id },
      data,
      include,
    });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }

  async deleteMany(where: any): Promise<{ count: number }> {
    return this.model.deleteMany({
      where,
    });
  }

  async count(where: any = {}): Promise<number> {
    return this.model.count({ where });
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  async transaction<R>(fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<R>): Promise<R> {
    return this.prisma.$transaction(fn);
  }
} 
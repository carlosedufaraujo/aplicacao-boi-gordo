import { PrismaClient } from '@prisma/client';
import { prisma } from '@/config/database';

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
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

  constructor(modelName: string) {
    this.prisma = prisma;
    this.model = (prisma as any)[modelName];
  }

  async findAll(
    filters?: Record<string, any>,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<T>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(pagination);

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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

  async findById(id: string): Promise<T | null> {
    return await this.model.findUnique({
      where: { id },
    });
  }

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create({
      data,
    });
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return await this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.model.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.model.count({
      where: { id },
    });
    return count > 0;
  }

  protected buildWhereClause(filters?: Record<string, any>): any {
    if (!filters) return {};
    
    const where: any = {};
    
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && key.endsWith('_like')) {
          const field = key.replace('_like', '');
          where[field] = { contains: value, mode: 'insensitive' };
        } else {
          where[key] = value;
        }
      }
    }
    
    return where;
  }

  protected buildOrderBy(pagination?: PaginationParams): any {
    if (!pagination?.orderBy) {
      return { createdAt: 'desc' };
    }
    
    return {
      [pagination.orderBy]: pagination.order || 'asc',
    };
  }
}
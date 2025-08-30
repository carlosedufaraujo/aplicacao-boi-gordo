import { PrismaClient } from '@prisma/client';
import { prisma } from '@/config/database';

export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface QueryOptions {
  where?: any;
  include?: any;
  select?: any;
  orderBy?: any;
}

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  async findById(id: string, options?: QueryOptions): Promise<T | null> {
    return await this.model.findUnique({
      where: { id },
      ...options,
    });
  }

  async findOne(where: any, options?: QueryOptions): Promise<T | null> {
    return await this.model.findFirst({
      where,
      ...options,
    });
  }

  async findMany(where: any = {}, options?: QueryOptions): Promise<T[]> {
    return await this.model.findMany({
      where,
      ...options,
    });
  }

  async findAll(
    where: any = {},
    pagination?: PaginationParams,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const orderBy = pagination?.orderBy
      ? { [pagination.orderBy]: pagination.orderDirection || 'desc' }
      : { createdAt: 'desc' };

    // Debug para identificar o problema
    console.log('BaseRepository.findAll - modelName:', this.modelName);
    console.log('BaseRepository.findAll - where:', JSON.stringify(where, null, 2));
    console.log('BaseRepository.findAll - options:', JSON.stringify(options, null, 2));
    
    const [items, total] = await Promise.all([
      this.model.findMany({
        ...options,
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.model.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async create(data: any): Promise<T> {
    return await this.model.create({ data });
  }

  async createMany(data: any[]): Promise<{ count: number }> {
    return await this.model.createMany({ data });
  }

  async update(id: string, data: any): Promise<T> {
    return await this.model.update({
      where: { id },
      data,
    });
  }

  async updateMany(where: any, data: any): Promise<{ count: number }> {
    return await this.model.updateMany({
      where,
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return await this.model.delete({
      where: { id },
    });
  }

  async deleteMany(where: any): Promise<{ count: number }> {
    return await this.model.deleteMany({ where });
  }

  async count(where: any = {}): Promise<number> {
    return await this.model.count({ where });
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  async aggregate(options: any): Promise<any> {
    return await this.model.aggregate(options);
  }

  async groupBy(options: any): Promise<any> {
    return await this.model.groupBy(options);
  }
}
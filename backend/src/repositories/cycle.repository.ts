import { cycles } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class CycleRepository extends BaseRepository<cycles> {
  constructor() {
    super('cycles');
  }

  async findActive() {
    return await this.findOne({ status: 'ACTIVE' });
  }

  async findByStatus(status: string) {
    return await this.findMany({ status });
  }
}
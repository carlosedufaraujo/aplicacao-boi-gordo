import { CycleRepository } from '@/repositories/cycle.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';

interface CreateCycleData {
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  status?: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  targetAnimals?: number;
  budget?: number;
}

interface UpdateCycleData extends Partial<CreateCycleData> {}

interface CycleFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export class CycleService {
  private cycleRepository: CycleRepository;

  constructor() {
    this.cycleRepository = new CycleRepository();
  }

  async findAll(filters: CycleFilters, pagination?: PaginationParams) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.OR = [];
      
      if (filters.startDate) {
        where.OR.push({
          startDate: { gte: filters.startDate }
        });
      }
      
      if (filters.endDate) {
        where.OR.push({
          endDate: { lte: filters.endDate }
        });
      }
    }

    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    const include = undefined;

    return this.cycleRepository.findAll(where, pagination, include);
  }

  async findById(id: string) {
    const cycle = await this.cycleRepository.findWithRelations(id);
    
    if (!cycle) {
      throw new NotFoundError('Ciclo não encontrado');
    }

    return cycle;
  }

  async findActive() {
    return this.cycleRepository.findActive();
  }

  async findByPeriod(startDate: Date, endDate: Date) {
    return this.cycleRepository.findByPeriod(startDate, endDate);
  }

  async create(data: CreateCycleData) {
    // Valida datas
    if (data.endDate && data.endDate < data.startDate) {
      throw new ValidationError('Data final não pode ser anterior à data inicial');
    }

    // Verifica se já existe um ciclo ativo
    if (data.status === 'ACTIVE') {
      const activeCycles = await this.findActive();
      if (activeCycles.length > 0) {
        throw new ValidationError('Já existe um ciclo ativo');
      }
    }

    const cycleData = {
      ...data,
      status: data.status || 'PLANNED',
    };

    return this.cycleRepository.create(cycleData);
  }

  async update(id: string, data: UpdateCycleData) {
    // Verifica se o ciclo existe
    const cycle = await this.findById(id);

    // Valida datas
    if (data.endDate && data.startDate && data.endDate < data.startDate) {
      throw new ValidationError('Data final não pode ser anterior à data inicial');
    }

    // Valida mudança de status
    if (data.status === 'ACTIVE' && cycle.status !== 'ACTIVE') {
      const activeCycles = await this.findActive();
      if (activeCycles.length > 0) {
        throw new ValidationError('Já existe um ciclo ativo');
      }
    }

    return this.cycleRepository.update(id, data);
  }

  async updateStatus(id: string, status: string) {
    // Verifica se o ciclo existe
    const cycle = await this.findById(id);

    // Valida transição de status
    const validTransitions: Record<string, string[]> = {
      PLANNED: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[cycle.status]?.includes(status)) {
      throw new ValidationError(`Não é possível mudar de ${cycle.status} para ${status}`);
    }

    // Se está ativando, verifica se não há outro ativo
    if (status === 'ACTIVE') {
      const activeCycles = await this.findActive();
      if (activeCycles.length > 0) {
        throw new ValidationError('Já existe um ciclo ativo');
      }
    }

    return this.cycleRepository.update(id, { status });
  }

  async delete(id: string) {
    // Verifica se o ciclo existe
    const cycle = await this.findById(id);

    // Não permite deletar ciclos completos
    if (cycle.status === 'COMPLETED') {
      throw new ValidationError('Não é possível excluir ciclos completos');
    }

    return this.cycleRepository.delete(id);
  }

  async getStats() {
    return this.cycleRepository.getOverallStats();
  }

  async getCycleStats(id: string) {
    const stats = await this.cycleRepository.getCycleStats(id);
    
    if (!stats) {
      throw new NotFoundError('Ciclo não encontrado');
    }

    return stats;
  }

  async getSummary(filters?: CycleFilters) {
    const cycles = await this.findAll(filters || {}, { page: 1, limit: 10000 });

    const summary = {
      total: cycles.total,
      planned: cycles.data.filter(c => c.status === 'PLANNED').length,
      active: cycles.data.filter(c => c.status === 'ACTIVE').length,
      completed: cycles.data.filter(c => c.status === 'COMPLETED').length,
      cancelled: cycles.data.filter(c => c.status === 'CANCELLED').length,
      totalAnimals: cycles.data.reduce((sum, c) => sum + (c.actualAnimals || 0), 0),
      totalCost: cycles.data.reduce((sum, c) => sum + (c.totalCost || 0), 0),
      totalRevenue: cycles.data.reduce((sum, c) => sum + (c.totalRevenue || 0), 0),
    };

    return summary;
  }
}
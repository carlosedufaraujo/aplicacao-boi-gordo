import { PenStatus, PenType } from '@prisma/client';
import { PenRepository } from '@/repositories/pen.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';

interface CreatePenData {
  penNumber: string;
  capacity: number;
  location?: string;
  type?: PenType;
}

interface UpdatePenData extends Partial<CreatePenData> {
  status?: PenStatus;
  isActive?: boolean;
}

interface PenFilters {
  status?: PenStatus;
  type?: PenType;
  isActive?: boolean;
  minCapacity?: number;
  search?: string;
}

interface HealthProtocolData {
  name: string;
  type: string;
  applicationDate: Date;
  veterinarian?: string;
  totalCost: number;
  notes?: string;
}

export class PenService {
  private penRepository: PenRepository;

  constructor() {
    this.penRepository = new PenRepository();
  }

  async findAll(filters: PenFilters, pagination?: PaginationParams) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.minCapacity) {
      where.capacity = { gte: filters.minCapacity };
    }

    if (filters.search) {
      where.OR = [
        { penNumber: { contains: filters.search } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const include = {
      lotAllocations: {
        where: { status: 'ACTIVE' },
        include: { cattlePurchase: true,
        },
      },
    };

    return this.penRepository.findAll(where, pagination);
  }

  async findById(id: string) {
    const pen = await this.penRepository.findWithOccupation(id);
    
    if (!pen) {
      throw new NotFoundError('Curral não encontrado');
    }

    return pen;
  }

  async findByStatus(status: PenStatus) {
    return this.penRepository.findByStatus(status);
  }

  async findByType(type: PenType) {
    return this.penRepository.findByType(type);
  }

  async findAvailable(minCapacity?: number) {
    return this.penRepository.findAvailable(minCapacity);
  }

  async create(data: CreatePenData) {
    // Verifica se o número do curral já existe
    const existing = await this.penRepository.findOne({ penNumber: data.penNumber });
    if (existing) {
      throw new ValidationError('Número de curral já existe');
    }

    return this.penRepository.create({
      ...data,
      type: data.type || 'FATTENING',
      status: 'AVAILABLE',
      isActive: true,
    });
  }

  async update(id: string, data: UpdatePenData) {
    // Verifica se o curral existe
    const pen = await this.findById(id);

    // Verifica se o novo número já existe
    if (data.penNumber && data.penNumber !== pen.penNumber) {
      const existing = await this.penRepository.findOne({ penNumber: data.penNumber });
      if (existing) {
        throw new ValidationError('Número de curral já existe');
      }
    }

    // Valida mudança de capacidade
    if (data.capacity) {
      const occupation = await this.penRepository.getPenOccupation(id);
      if (occupation && occupation.occupation.totalOccupied > data.capacity) {
        throw new ValidationError(
          `Nova capacidade (${data.capacity}) é menor que a ocupação atual (${occupation.occupation.totalOccupied})`
        );
      }
    }

    return this.penRepository.update(id, data);
  }

  async updateStatus(id: string, status: PenStatus) {
    const _pen = await this.findById(id);

    // Validações específicas por status
    if (status === 'MAINTENANCE' || status === 'QUARANTINE') {
      const occupation = await this.penRepository.getPenOccupation(id);
      if (occupation && occupation.occupation.totalOccupied > 0) {
        throw new ValidationError(
          'Curral com animais não pode ser colocado em manutenção ou quarentena'
        );
      }
    }

    return this.penRepository.updateStatus(id, status);
  }

  async delete(id: string) {
    const occupation = await this.penRepository.getPenOccupation(id);
    
    if (!occupation) {
      throw new NotFoundError('Curral não encontrado');
    }

    if (occupation.occupation.totalOccupied > 0) {
      // Inativa ao invés de deletar
      return this.penRepository.update(id, { isActive: false });
    }

    return this.penRepository.delete(id);
  }

  async getOccupation(id: string) {
    const occupation = await this.penRepository.getPenOccupation(id);
    
    if (!occupation) {
      throw new NotFoundError('Curral não encontrado');
    }

    return occupation;
  }

  async getStats() {
    return this.penRepository.getOccupationStats();
  }

  async applyHealthProtocol(id: string, data: HealthProtocolData, userId: string) {
    // Verifica se o curral existe e tem animais
    const occupation = await this.getOccupation(id);
    
    if (occupation.occupation.totalOccupied === 0) {
      throw new ValidationError('Curral vazio não pode receber protocolo sanitário');
    }

    return this.penRepository.applyHealthProtocol(id, {
      ...data,
      userId,
    });
  }

  async getHealthHistory(id: string, startDate?: Date, endDate?: Date) {
    const pen = await this.findById(id);

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const protocols = (pen as any).healthProtocols?.filter((protocol: any) => {
      if (!startDate && !endDate) return true;
      const date = protocol.applicationDate;
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    }) || [];

    return {
      pen: {
        id: pen.id,
        penNumber: pen.penNumber,
        capacity: pen.capacity,
      },
      protocols,
      totalCost: protocols.reduce((sum: number, p: any) => sum + p.totalCost, 0),
    };
  }
} 
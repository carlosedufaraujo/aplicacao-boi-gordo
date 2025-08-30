import { PartnerType } from '@prisma/client';
import { PartnerRepository } from '@/repositories/partner.repository';
import { NotFoundError, ConflictError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';

interface CreatePartnerData {
  name: string;
  type: PartnerType;
  cpfCnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface UpdatePartnerData extends Partial<CreatePartnerData> {
  isActive?: boolean;
}

interface PartnerFilters {
  type?: PartnerType;
  isActive?: boolean;
  search?: string;
}

export class PartnerService {
  private partnerRepository: PartnerRepository;

  constructor() {
    this.partnerRepository = new PartnerRepository();
  }

  async findAll(filters: PartnerFilters, pagination?: PaginationParams) {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { cpfCnpj: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.partnerRepository.findAll(where, pagination);
  }

  async findById(id: string) {
    const partner = await this.partnerRepository.findById(id);
    
    if (!partner) {
      throw new NotFoundError('Parceiro não encontrado');
    }

    return partner;
  }

  async findByType(type: PartnerType) {
    return this.partnerRepository.findByType(type);
  }

  async create(data: CreatePartnerData) {
    // Verifica se CPF/CNPJ já existe
    if (data.cpfCnpj) {
      const existing = await this.partnerRepository.findByCpfCnpj(data.cpfCnpj);
      if (existing) {
        throw new ConflictError('CPF/CNPJ já cadastrado');
      }
    }

    return this.partnerRepository.create(data);
  }

  async update(id: string, data: UpdatePartnerData) {
    // Verifica se o parceiro existe
    await this.findById(id);

    // Verifica se CPF/CNPJ já existe em outro parceiro
    if (data.cpfCnpj) {
      const existing = await this.partnerRepository.findByCpfCnpj(data.cpfCnpj);
      if (existing && existing.id !== id) {
        throw new ConflictError('CPF/CNPJ já cadastrado');
      }
    }

    return this.partnerRepository.update(id, data);
  }

  async delete(id: string) {
    // Verifica se o parceiro existe
    const partner = await this.partnerRepository.findWithRelations(id);
    
    if (!partner) {
      throw new NotFoundError('Parceiro não encontrado');
    }

    // Verifica se tem relacionamentos
    const hasRelations = 
      partner.cattlePurchasesAsVendor?.length > 0 ||
      partner.cattlePurchasesAsBroker?.length > 0 ||
      partner.saleRecords.length > 0 ||
      partner.contributions.length > 0;

    if (hasRelations) {
      // Inativa ao invés de deletar
      return this.partnerRepository.update(id, { isActive: false });
    }

    return this.partnerRepository.delete(id);
  }

  async getStats() {
    const partners = await this.partnerRepository.findAll({});
    const total = partners.data.length;
    
    const byType = {
      VENDOR: partners.data.filter(p => p.type === 'VENDOR').length,
      BUYER: partners.data.filter(p => p.type === 'BUYER').length,
      BROKER: partners.data.filter(p => p.type === 'BROKER').length,
      PARTNER: partners.data.filter(p => p.type === 'PARTNER').length,
      EMPLOYEE: partners.data.filter(p => p.type === 'EMPLOYEE').length,
      OTHER: partners.data.filter(p => p.type === 'OTHER').length,
    };

    return {
      total,
      active: partners.data.filter(p => p.isActive).length,
      inactive: partners.data.filter(p => !p.isActive).length,
      byType
    };
  }

  async getPartnerStats(id: string) {
    const stats = await this.partnerRepository.getPartnerStats(id);
    
    if (!stats) {
      throw new NotFoundError('Parceiro não encontrado');
    }

    return stats;
  }
} 
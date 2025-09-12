import { PartnerType } from '@prisma/client';
import { PartnerRepository } from '@/repositories/partner.repository';
import { NotFoundError, ConflictError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';
import { prisma } from '@/config/database';

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
    // Verifica se CPF/CNPJ já existe (ignora valores de teste com todos zeros)
    if (data.cpfCnpj && !/^0+$/.test(data.cpfCnpj)) {
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

    // Verifica se CPF/CNPJ já existe em outro parceiro (ignora valores de teste com todos zeros)
    if (data.cpfCnpj && !/^0+$/.test(data.cpfCnpj)) {
      const existing = await this.partnerRepository.findByCpfCnpj(data.cpfCnpj);
      if (existing && existing.id !== id) {
        throw new ConflictError('CPF/CNPJ já cadastrado');
      }
    }

    return this.partnerRepository.update(id, data);
  }

  async delete(id: string) {
    // Verifica se o parceiro existe
    const partner = await this.partnerRepository.findById(id);
    
    if (!partner) {
      throw new NotFoundError('Parceiro não encontrado');
    }

    // Conta relacionamentos diretamente no banco (sem include problemático)
    const [vendorCount, brokerCount, transportCount, salesCount] = await Promise.all([
      prisma.cattlePurchase.count({ where: { vendorId: id } }),
      prisma.cattlePurchase.count({ where: { brokerId: id } }),
      prisma.cattlePurchase.count({ where: { transportCompanyId: id } }),
      prisma.saleRecord.count({ where: { buyerId: id } })
    ]);

    const totalRelations = vendorCount + brokerCount + transportCount + salesCount;

    if (totalRelations > 0) {
      // Inativa ao invés de deletar quando há relacionamentos
      const inactivatedPartner = await this.partnerRepository.update(id, { isActive: false });
      
      // Retorna mensagem informativa
      return {
        ...inactivatedPartner,
        _message: `Parceiro inativado pois possui relacionamentos: ` +
          `${vendorCount} compras como vendedor, ` +
          `${brokerCount} como corretor, ` +
          `${transportCount} como transportador, ` +
          `${salesCount} vendas.`
      };
    }

    // Se não tem relacionamentos, deleta fisicamente
    return this.partnerRepository.delete(id);
  }

  async getDebugInfo(id: string) {
    // Busca o parceiro com todos os relacionamentos
    const partner = await this.partnerRepository.findWithRelations(id);
    
    if (!partner) {
      throw new NotFoundError('Parceiro não encontrado');
    }

    return {
      partner: {
        id: partner.id,
        name: partner.name,
        type: partner.type,
        isActive: partner.isActive,
        createdAt: partner.createdAt,
      },
      relationships: {
        purchasesAsVendor: {
          count: partner.purchasesAsVendor?.length || 0,
          items: partner.purchasesAsVendor?.map(p => ({
            id: p.id,
            lotCode: p.lotCode,
            status: p.status,
            purchaseValue: p.purchaseValue,
            purchaseDate: p.purchaseDate,
          })) || []
        },
        purchasesAsBroker: {
          count: partner.purchasesAsBroker?.length || 0,
          items: partner.purchasesAsBroker?.map(p => ({
            id: p.id,
            lotCode: p.lotCode,
            status: p.status,
            purchaseValue: p.purchaseValue,
            purchaseDate: p.purchaseDate,
          })) || []
        },
        purchasesAsTransport: {
          count: partner.purchasesAsTransport?.length || 0,
          items: partner.purchasesAsTransport?.map(p => ({
            id: p.id,
            lotCode: p.lotCode,
            status: p.status,
            purchaseValue: p.purchaseValue,
            purchaseDate: p.purchaseDate,
          })) || []
        },
        saleRecords: {
          count: partner.saleRecords?.length || 0,
          items: partner.saleRecords?.map(s => ({
            id: s.id,
            saleNumber: s.saleNumber,
            status: s.status,
            totalValue: s.totalValue,
            designationDate: s.designationDate,
          })) || []
        },
        contributions: {
          count: partner.contributions?.length || 0,
          items: partner.contributions?.map(c => ({
            id: c.id,
            type: c.type,
            amount: c.amount,
            contributionDate: c.contributionDate,
          })) || []
        }
      },
      summary: {
        totalRelationships: 
          (partner.purchasesAsVendor?.length || 0) +
          (partner.purchasesAsBroker?.length || 0) +
          (partner.purchasesAsTransport?.length || 0) +
          (partner.saleRecords?.length || 0) +
          (partner.contributions?.length || 0),
        canDelete: 
          (partner.purchasesAsVendor?.length || 0) === 0 &&
          (partner.purchasesAsBroker?.length || 0) === 0 &&
          (partner.purchasesAsTransport?.length || 0) === 0 &&
          (partner.saleRecords?.length || 0) === 0 &&
          (partner.contributions?.length || 0) === 0
      }
    };
  }

  async getStats() {
    const partners = await this.partnerRepository.findAll({});
    const total = partners.items.length;
    
    const byType = {
      VENDOR: partners.items.filter(p => p.type === 'VENDOR').length,
      BUYER: partners.items.filter(p => p.type === 'BUYER').length,
      BROKER: partners.items.filter(p => p.type === 'BROKER').length,
      PARTNER: partners.items.filter(p => (p.type as any) === 'PARTNER').length,
      EMPLOYEE: partners.items.filter(p => (p.type as any) === 'EMPLOYEE').length,
      OTHER: partners.items.filter(p => p.type === 'OTHER').length,
    };

    return {
      total,
      active: partners.items.filter(p => p.isActive).length,
      inactive: partners.items.filter(p => !p.isActive).length,
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
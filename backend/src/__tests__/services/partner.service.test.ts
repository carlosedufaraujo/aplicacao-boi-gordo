import { PartnerService } from '@/services/partner.service';
import { PartnerRepository } from '@/repositories/partner.repository';
import { NotFoundError, ConflictError } from '@/utils/AppError';
import { PartnerType } from '@prisma/client';

jest.mock('@/repositories/partner.repository');

describe('PartnerService', () => {
  let partnerService: PartnerService;
  let partnerRepository: jest.Mocked<PartnerRepository>;

  beforeEach(() => {
    partnerService = new PartnerService();
    partnerRepository = (partnerService as any).partnerRepository;
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all partners without filters', async () => {
      const mockPartners = {
        data: [
          { id: '1', name: 'Partner 1', type: 'SUPPLIER' },
          { id: '2', name: 'Partner 2', type: 'BUYER' }
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      partnerRepository.findAll.mockResolvedValue(mockPartners);

      const result = await partnerService.findAll({});

      expect(partnerRepository.findAll).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqual(mockPartners);
    });

    it('should filter partners by type', async () => {
      const mockPartners = {
        data: [{ id: '1', name: 'Partner 1', type: 'SUPPLIER' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      partnerRepository.findAll.mockResolvedValue(mockPartners);

      const result = await partnerService.findAll({ type: 'SUPPLIER' as PartnerType });

      expect(partnerRepository.findAll).toHaveBeenCalledWith(
        { type: 'SUPPLIER' },
        undefined
      );
      expect(result).toEqual(mockPartners);
    });

    it('should filter partners by search term', async () => {
      const mockPartners = {
        data: [{ id: '1', name: 'João Silva', cpfCnpj: '123.456.789-00' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      partnerRepository.findAll.mockResolvedValue(mockPartners);

      const result = await partnerService.findAll({ search: 'João' });

      expect(partnerRepository.findAll).toHaveBeenCalledWith(
        {
          OR: [
            { name: { contains: 'João', mode: 'insensitive' } },
            { cpfCnpj: { contains: 'João' } },
            { email: { contains: 'João', mode: 'insensitive' } }
          ]
        },
        undefined
      );
      expect(result).toEqual(mockPartners);
    });

    it('should handle pagination', async () => {
      const mockPartners = {
        data: [{ id: '1', name: 'Partner 1' }],
        total: 10,
        page: 2,
        limit: 5,
        totalPages: 2
      };

      partnerRepository.findAll.mockResolvedValue(mockPartners);

      const result = await partnerService.findAll({}, { page: 2, limit: 5 });

      expect(partnerRepository.findAll).toHaveBeenCalledWith({}, { page: 2, limit: 5 });
      expect(result).toEqual(mockPartners);
    });
  });

  describe('findById', () => {
    it('should return partner by id', async () => {
      const mockPartner = {
        id: '1',
        name: 'Partner 1',
        type: 'SUPPLIER',
        cpfCnpj: '123.456.789-00'
      };

      partnerRepository.findById.mockResolvedValue(mockPartner);

      const result = await partnerService.findById('1');

      expect(partnerRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPartner);
    });

    it('should throw NotFoundError when partner not found', async () => {
      partnerRepository.findById.mockResolvedValue(null);

      await expect(partnerService.findById('999')).rejects.toThrow(NotFoundError);
      await expect(partnerService.findById('999')).rejects.toThrow('Parceiro não encontrado');
    });
  });

  describe('create', () => {
    const validPartnerData = {
      name: 'Novo Parceiro',
      type: 'SUPPLIER' as PartnerType,
      cpfCnpj: '12.345.678/0001-90',
      phone: '(11) 98765-4321',
      email: 'novo@parceiro.com'
    };

    it('should create a new partner successfully', async () => {
      const mockCreatedPartner = { id: '1', ...validPartnerData };
      
      partnerRepository.findByCpfCnpj.mockResolvedValue(null);
      partnerRepository.create.mockResolvedValue(mockCreatedPartner);

      const result = await partnerService.create(validPartnerData);

      expect(partnerRepository.findByCpfCnpj).toHaveBeenCalledWith('12.345.678/0001-90');
      expect(partnerRepository.create).toHaveBeenCalledWith(validPartnerData);
      expect(result).toEqual(mockCreatedPartner);
    });

    it('should throw ConflictError when CPF/CNPJ already exists', async () => {
      partnerRepository.findByCpfCnpj.mockResolvedValue({ 
        id: 'existing', 
        cpfCnpj: '12.345.678/0001-90' 
      } as any);

      await expect(partnerService.create(validPartnerData)).rejects.toThrow(ConflictError);
      await expect(partnerService.create(validPartnerData)).rejects.toThrow('CPF/CNPJ já cadastrado');
      expect(partnerRepository.create).not.toHaveBeenCalled();
    });

    it('should create partner without CPF/CNPJ', async () => {
      const dataWithoutCpf = {
        name: 'Parceiro Sem CPF',
        type: 'BROKER' as PartnerType,
        phone: '(11) 98765-4321'
      };

      const mockCreatedPartner = { id: '2', ...dataWithoutCpf };
      partnerRepository.create.mockResolvedValue(mockCreatedPartner);

      const result = await partnerService.create(dataWithoutCpf);

      expect(partnerRepository.findByCpfCnpj).not.toHaveBeenCalled();
      expect(partnerRepository.create).toHaveBeenCalledWith(dataWithoutCpf);
      expect(result).toEqual(mockCreatedPartner);
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Parceiro Atualizado',
      phone: '(11) 98765-0000'
    };

    it('should update partner successfully', async () => {
      const existingPartner = { id: '1', name: 'Partner 1' };
      const updatedPartner = { id: '1', ...updateData };

      partnerRepository.findById.mockResolvedValue(existingPartner);
      partnerRepository.update.mockResolvedValue(updatedPartner);

      const result = await partnerService.update('1', updateData);

      expect(partnerRepository.findById).toHaveBeenCalledWith('1');
      expect(partnerRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(result).toEqual(updatedPartner);
    });

    it('should throw NotFoundError when partner not found', async () => {
      partnerRepository.findById.mockResolvedValue(null);

      await expect(partnerService.update('999', updateData)).rejects.toThrow(NotFoundError);
      expect(partnerRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when updating to existing CPF/CNPJ', async () => {
      const existingPartner = { id: '1', name: 'Partner 1', cpfCnpj: '111.111.111-11' };
      const anotherPartner = { id: '2', cpfCnpj: '222.222.222-22' };

      partnerRepository.findById.mockResolvedValue(existingPartner);
      partnerRepository.findByCpfCnpj.mockResolvedValue(anotherPartner as any);

      await expect(
        partnerService.update('1', { cpfCnpj: '222.222.222-22' })
      ).rejects.toThrow(ConflictError);
      await expect(
        partnerService.update('1', { cpfCnpj: '222.222.222-22' })
      ).rejects.toThrow('CPF/CNPJ já cadastrado');
    });

    it('should allow updating partner with same CPF/CNPJ', async () => {
      const existingPartner = { id: '1', cpfCnpj: '111.111.111-11' };
      
      partnerRepository.findById.mockResolvedValue(existingPartner);
      partnerRepository.findByCpfCnpj.mockResolvedValue(existingPartner as any);
      partnerRepository.update.mockResolvedValue(existingPartner as any);

      const result = await partnerService.update('1', { cpfCnpj: '111.111.111-11' });

      expect(partnerRepository.update).toHaveBeenCalled();
      expect(result).toEqual(existingPartner);
    });
  });

  describe('delete', () => {
    it('should delete partner without relations', async () => {
      const partner = {
        id: '1',
        name: 'Partner 1',
        purchaseOrdersAsVendor: [],
        purchaseOrdersAsBroker: [],
        saleRecords: [],
        contributions: []
      };

      partnerRepository.findWithRelations.mockResolvedValue(partner as any);
      partnerRepository.delete.mockResolvedValue(partner as any);

      const result = await partnerService.delete('1');

      expect(partnerRepository.findWithRelations).toHaveBeenCalledWith('1');
      expect(partnerRepository.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual(partner);
    });

    it('should inactivate partner with relations instead of deleting', async () => {
      const partner = {
        id: '1',
        name: 'Partner 1',
        purchaseOrdersAsVendor: [{ id: 'order1' }],
        purchaseOrdersAsBroker: [],
        saleRecords: [],
        contributions: []
      };

      const inactivatedPartner = { ...partner, isActive: false };

      partnerRepository.findWithRelations.mockResolvedValue(partner as any);
      partnerRepository.update.mockResolvedValue(inactivatedPartner as any);

      const result = await partnerService.delete('1');

      expect(partnerRepository.delete).not.toHaveBeenCalled();
      expect(partnerRepository.update).toHaveBeenCalledWith('1', { isActive: false });
      expect(result).toEqual(inactivatedPartner);
    });

    it('should throw NotFoundError when partner not found', async () => {
      partnerRepository.findWithRelations.mockResolvedValue(null);

      await expect(partnerService.delete('999')).rejects.toThrow(NotFoundError);
      await expect(partnerService.delete('999')).rejects.toThrow('Parceiro não encontrado');
      expect(partnerRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return partner statistics', async () => {
      const mockStats = {
        partner: { id: '1', name: 'Partner 1' },
        totalPurchases: 1000000,
        totalSales: 800000,
        totalContributions: 200000,
        purchaseCount: 10,
        saleCount: 8,
        contributionCount: 5
      };

      partnerRepository.getPartnerStats.mockResolvedValue(mockStats as any);

      const result = await partnerService.getStats('1');

      expect(partnerRepository.getPartnerStats).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockStats);
    });

    it('should throw NotFoundError when partner not found', async () => {
      partnerRepository.getPartnerStats.mockResolvedValue(null);

      await expect(partnerService.getStats('999')).rejects.toThrow(NotFoundError);
      await expect(partnerService.getStats('999')).rejects.toThrow('Parceiro não encontrado');
    });
  });

  describe('findByType', () => {
    it('should return partners by type', async () => {
      const mockSuppliers = [
        { id: '1', name: 'Supplier 1', type: 'SUPPLIER' },
        { id: '2', name: 'Supplier 2', type: 'SUPPLIER' }
      ];

      partnerRepository.findByType.mockResolvedValue(mockSuppliers as any);

      const result = await partnerService.findByType('SUPPLIER' as PartnerType);

      expect(partnerRepository.findByType).toHaveBeenCalledWith('SUPPLIER');
      expect(result).toEqual(mockSuppliers);
    });
  });
});
import { RevenueService } from '@/services/revenue.service';
import { RevenueRepository } from '@/repositories/revenue.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';

jest.mock('@/repositories/revenue.repository');

describe('RevenueService', () => {
  let revenueService: RevenueService;
  let revenueRepository: jest.Mocked<RevenueRepository>;

  beforeEach(() => {
    revenueService = new RevenueService();
    revenueRepository = (revenueService as any).revenueRepository;
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all revenues without filters', async () => {
      const mockRevenues = {
        data: [
          { id: '1', description: 'Cattle sale', category: 'cattle_sales', totalAmount: 50000 },
          { id: '2', description: 'Service revenue', category: 'service_revenue', totalAmount: 10000 }
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      revenueRepository.findAll.mockResolvedValue(mockRevenues);

      const result = await revenueService.findAll({});

      expect(revenueRepository.findAll).toHaveBeenCalledWith(
        {},
        undefined,
        expect.objectContaining({
          costCenter: true,
          payerAccount: true,
          allocations: true
        })
      );
      expect(result).toEqual(mockRevenues);
    });

    it('should filter by category', async () => {
      const mockRevenues = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      revenueRepository.findAll.mockResolvedValue(mockRevenues);

      await revenueService.findAll({ category: 'cattle_sales' });

      expect(revenueRepository.findAll).toHaveBeenCalledWith(
        { category: 'cattle_sales' },
        undefined,
        expect.any(Object)
      );
    });

    it('should filter by receipt status', async () => {
      const mockRevenues = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      revenueRepository.findAll.mockResolvedValue(mockRevenues);

      await revenueService.findAll({ isReceived: true });

      expect(revenueRepository.findAll).toHaveBeenCalledWith(
        { isReceived: true },
        undefined,
        expect.any(Object)
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockRevenues = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };

      revenueRepository.findAll.mockResolvedValue(mockRevenues);

      await revenueService.findAll({ startDate, endDate });

      expect(revenueRepository.findAll).toHaveBeenCalledWith(
        { dueDate: { gte: startDate, lte: endDate } },
        undefined,
        expect.any(Object)
      );
    });

    it('should handle search parameter', async () => {
      const mockRevenues = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      revenueRepository.findAll.mockResolvedValue(mockRevenues);

      await revenueService.findAll({ search: 'cattle' });

      expect(revenueRepository.findAll).toHaveBeenCalledWith(
        {
          OR: [
            { description: { contains: 'cattle', mode: 'insensitive' } },
            { notes: { contains: 'cattle', mode: 'insensitive' } }
          ]
        },
        undefined,
        expect.any(Object)
      );
    });
  });

  describe('findById', () => {
    it('should return revenue by id', async () => {
      const mockRevenue = {
        id: '1',
        description: 'Cattle sale',
        category: 'cattle_sales',
        totalAmount: 50000,
        isReceived: false
      };

      revenueRepository.findWithRelations.mockResolvedValue(mockRevenue as any);

      const result = await revenueService.findById('1');

      expect(revenueRepository.findWithRelations).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockRevenue);
    });

    it('should throw NotFoundError when revenue not found', async () => {
      revenueRepository.findWithRelations.mockResolvedValue(null);

      await expect(revenueService.findById('999')).rejects.toThrow(NotFoundError);
      await expect(revenueService.findById('999')).rejects.toThrow('Receita não encontrada');
    });
  });

  describe('create', () => {
    const validRevenueData = {
      category: 'cattle_sales',
      description: 'Sale of 50 cattle',
      totalAmount: 100000,
      dueDate: new Date('2024-02-15'),
      saleRecordId: 'sale-1',
      buyerId: 'buyer-1',
      payerAccountId: 'acc-1'
    };

    it('should create a new revenue', async () => {
      const mockCreatedRevenue = {
        id: '1',
        ...validRevenueData,
        isReceived: false
      };

      revenueRepository.createWithAllocations.mockResolvedValue(mockCreatedRevenue as any);

      const result = await revenueService.create(validRevenueData, 'user-123');

      expect(revenueRepository.createWithAllocations).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validRevenueData,
          isReceived: false,
          userId: 'user-123'
        }),
        undefined
      );
      expect(result).toEqual(mockCreatedRevenue);
    });

    it('should throw ValidationError for invalid category', async () => {
      const invalidData = {
        ...validRevenueData,
        category: 'invalid_category'
      };

      await expect(revenueService.create(invalidData, 'user-123')).rejects.toThrow(ValidationError);
      await expect(revenueService.create(invalidData, 'user-123')).rejects.toThrow('Categoria inválida');
      expect(revenueRepository.createWithAllocations).not.toHaveBeenCalled();
    });

    it('should accept all valid categories', async () => {
      const validCategories = [
        'cattle_sales', 'service_revenue', 'byproduct_sales', 'other_revenue',
        'partner_contribution', 'partner_loan', 'bank_financing', 'external_investor'
      ];

      revenueRepository.createWithAllocations.mockResolvedValue({} as any);

      for (const category of validCategories) {
        await revenueService.create({ ...validRevenueData, category }, 'user-123');
        expect(revenueRepository.createWithAllocations).toHaveBeenCalled();
      }
    });

    it('should handle allocations', async () => {
      const allocations = [
        { entityType: 'LOT' as const, entityId: 'lot-1', allocatedAmount: 50000, percentage: 50 },
        { entityType: 'PEN' as const, entityId: 'pen-1', allocatedAmount: 50000, percentage: 50 }
      ];

      revenueRepository.createWithAllocations.mockResolvedValue({} as any);

      await revenueService.create(validRevenueData, 'user-123', allocations);

      expect(revenueRepository.createWithAllocations).toHaveBeenCalledWith(
        expect.any(Object),
        allocations
      );
    });
  });

  describe('update', () => {
    const updateData = {
      description: 'Updated description',
      totalAmount: 120000
    };

    it('should update revenue', async () => {
      const existingRevenue = {
        id: '1',
        description: 'Original description',
        isReceived: false,
        allocations: [],
        reconciliations: []
      };

      revenueRepository.findWithRelations.mockResolvedValue(existingRevenue as any);
      revenueRepository.update.mockResolvedValue({ ...existingRevenue, ...updateData } as any);

      const result = await revenueService.update('1', updateData);

      expect(revenueRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(result.description).toBe('Updated description');
    });

    it('should throw ValidationError when trying to edit received revenue', async () => {
      const receivedRevenue = {
        id: '1',
        isReceived: true,
        allocations: [],
        reconciliations: []
      };

      revenueRepository.findWithRelations.mockResolvedValue(receivedRevenue as any);

      await expect(
        revenueService.update('1', updateData)
      ).rejects.toThrow(ValidationError);
      await expect(
        revenueService.update('1', updateData)
      ).rejects.toThrow('Não é possível alterar receitas já recebidas');
    });

    it('should allow marking revenue as not received', async () => {
      const receivedRevenue = {
        id: '1',
        isReceived: true,
        allocations: [],
        reconciliations: []
      };

      revenueRepository.findWithRelations.mockResolvedValue(receivedRevenue as any);
      revenueRepository.update.mockResolvedValue({ ...receivedRevenue, isReceived: false } as any);

      const result = await revenueService.update('1', { isReceived: false });

      expect(revenueRepository.update).toHaveBeenCalledWith('1', { isReceived: false });
      expect(result.isReceived).toBe(false);
    });
  });

  describe('receive', () => {
    const receiptData = {
      receiptDate: new Date('2024-01-20'),
      payerAccountId: 'acc-1'
    };

    it('should receive revenue successfully', async () => {
      const unreceiviedRevenue = {
        id: '1',
        isReceived: false,
        payerAccountId: 'acc-1',
        allocations: [],
        reconciliations: []
      };

      revenueRepository.findWithRelations.mockResolvedValue(unreceiviedRevenue as any);
      revenueRepository.receiveRevenue.mockResolvedValue({ 
        ...unreceiviedRevenue, 
        isReceived: true,
        receiptDate: receiptData.receiptDate 
      } as any);

      const result = await revenueService.receive('1', receiptData);

      expect(revenueRepository.receiveRevenue).toHaveBeenCalledWith('1', receiptData);
      expect(result.isReceived).toBe(true);
    });

    it('should throw ValidationError for already received revenue', async () => {
      const receivedRevenue = {
        id: '1',
        isReceived: true,
        allocations: [],
        reconciliations: []
      };

      revenueRepository.findWithRelations.mockResolvedValue(receivedRevenue as any);

      await expect(revenueService.receive('1', receiptData)).rejects.toThrow(ValidationError);
      await expect(revenueService.receive('1', receiptData)).rejects.toThrow('Receita já recebida');
    });

    it('should require payer account', async () => {
      const revenue = {
        id: '1',
        isReceived: false,
        payerAccountId: null,
        allocations: [],
        reconciliations: []
      };

      revenueRepository.findWithRelations.mockResolvedValue(revenue as any);

      await expect(revenueService.receive('1', {})).rejects.toThrow(ValidationError);
      await expect(revenueService.receive('1', {})).rejects.toThrow('Conta recebedora é obrigatória');
    });

    it('should use default receipt date if not provided', async () => {
      const revenue = {
        id: '1',
        isReceived: false,
        payerAccountId: 'acc-1',
        allocations: [],
        reconciliations: []
      };

      revenueRepository.findWithRelations.mockResolvedValue(revenue as any);
      revenueRepository.receiveRevenue.mockResolvedValue({ ...revenue, isReceived: true } as any);

      await revenueService.receive('1', { payerAccountId: 'acc-2' });

      expect(revenueRepository.receiveRevenue).toHaveBeenCalledWith('1', {
        receiptDate: expect.any(Date),
        payerAccountId: 'acc-2'
      });
    });
  });

  describe('delete', () => {
    it('should delete unreceived revenue without allocations', async () => {
      const revenue = {
        id: '1',
        isReceived: false,
        allocations: [],
        reconciliations: []
      };

      revenueRepository.findWithRelations.mockResolvedValue(revenue as any);
      revenueRepository.delete.mockResolvedValue(revenue as any);

      const result = await revenueService.delete('1');

      expect(revenueRepository.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual(revenue);
    });

    it('should throw ValidationError for received revenue', async () => {
      const receivedRevenue = {
        id: '1',
        isReceived: true,
        allocations: [],
        reconciliations: []
      };

      revenueRepository.findWithRelations.mockResolvedValue(receivedRevenue as any);

      await expect(revenueService.delete('1')).rejects.toThrow(ValidationError);
      await expect(revenueService.delete('1')).rejects.toThrow('Não é possível excluir receitas recebidas');
    });

    it('should throw ValidationError for revenue with allocations', async () => {
      const revenue = {
        id: '1',
        isReceived: false,
        allocations: [{ id: 'alloc-1' }],
        reconciliations: []
      };

      revenueRepository.findWithRelations.mockResolvedValue(revenue as any);

      await expect(revenueService.delete('1')).rejects.toThrow(ValidationError);
      await expect(revenueService.delete('1')).rejects.toThrow('Não é possível excluir receita com alocações ou reconciliações');
    });
  });

  describe('getSummary', () => {
    it('should return revenue summary', async () => {
      const mockRevenues = {
        data: [
          { id: '1', totalAmount: 50000, isReceived: true, dueDate: new Date('2024-01-01') },
          { id: '2', totalAmount: 30000, isReceived: false, dueDate: new Date('2024-02-01') },
          { id: '3', totalAmount: 20000, isReceived: false, dueDate: new Date('2023-12-01') }
        ],
        total: 3,
        page: 1,
        limit: 1000,
        totalPages: 1
      };

      revenueRepository.findAll.mockResolvedValue(mockRevenues as any);

      const result = await revenueService.getSummary();

      expect(result).toEqual({
        total: 100000,
        received: 50000,
        pending: 50000,
        overdue: 20000,
        count: 3,
        receivedCount: 1,
        pendingCount: 2,
        overdueCount: 1
      });
    });
  });

  describe('getProjection', () => {
    it('should return revenue projections', async () => {
      const mockRecurring = [
        { category: 'service_revenue', averageAmount: 10000 }
      ];

      const mockConfirmed = [
        { dueDate: new Date('2024-02-15'), totalAmount: 50000 },
        { dueDate: new Date('2024-03-15'), totalAmount: 60000 }
      ];

      revenueRepository.getMonthlyRecurring.mockResolvedValue(mockRecurring as any);
      revenueRepository.findByPeriod.mockResolvedValue(mockConfirmed as any);

      const result = await revenueService.getProjection(3);

      expect(result).toHaveProperty('recurring', mockRecurring);
      expect(result).toHaveProperty('projections');
      expect(result).toHaveProperty('totalProjected');
      expect(result.projections).toHaveLength(3);
    });
  });
});
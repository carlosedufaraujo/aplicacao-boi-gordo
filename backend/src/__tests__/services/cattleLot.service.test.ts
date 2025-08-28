import { CattleLotService } from '@/services/cattleLot.service';
import { CattleLotRepository } from '@/repositories/cattleLot.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { LotStatus } from '@prisma/client';

jest.mock('@/repositories/cattleLot.repository');

describe('CattleLotService', () => {
  let cattleLotService: CattleLotService;
  let cattleLotRepository: jest.Mocked<CattleLotRepository>;
  let prismaClient: any;

  beforeEach(() => {
    cattleLotService = new CattleLotService();
    cattleLotRepository = (cattleLotService as any).cattleLotRepository;
    
    // Mock Prisma client
    prismaClient = {
      nonCashExpense: { create: jest.fn() },
      lotMovement: { create: jest.fn() }
    };
    cattleLotRepository.prisma = prismaClient;
    
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all cattle lots without filters', async () => {
      const mockLots = {
        data: [
          { id: '1', lotNumber: 'LOT-001', status: 'ACTIVE', currentQuantity: 100 },
          { id: '2', lotNumber: 'LOT-002', status: 'SOLD', currentQuantity: 0 }
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      cattleLotRepository.findAll.mockResolvedValue(mockLots);

      const result = await cattleLotService.findAll({});

      expect(cattleLotRepository.findAll).toHaveBeenCalledWith(
        {},
        undefined,
        expect.objectContaining({
          purchaseOrder: { include: { vendor: true } },
          penAllocations: expect.objectContaining({ where: { status: 'ACTIVE' } })
        })
      );
      expect(result).toEqual(mockLots);
    });

    it('should filter by status', async () => {
      const mockLots = {
        data: [{ id: '1', lotNumber: 'LOT-001', status: 'ACTIVE' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      cattleLotRepository.findAll.mockResolvedValue(mockLots);

      const result = await cattleLotService.findAll({ status: 'ACTIVE' as LotStatus });

      expect(cattleLotRepository.findAll).toHaveBeenCalledWith(
        { status: 'ACTIVE' },
        undefined,
        expect.any(Object)
      );
      expect(result).toEqual(mockLots);
    });

    it('should filter by vendor', async () => {
      const mockLots = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      cattleLotRepository.findAll.mockResolvedValue(mockLots);

      await cattleLotService.findAll({ vendorId: 'vendor-1' });

      expect(cattleLotRepository.findAll).toHaveBeenCalledWith(
        { purchaseOrder: { vendorId: 'vendor-1' } },
        undefined,
        expect.any(Object)
      );
    });

    it('should filter by pen', async () => {
      const mockLots = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      cattleLotRepository.findAll.mockResolvedValue(mockLots);

      await cattleLotService.findAll({ penId: 'pen-1' });

      expect(cattleLotRepository.findAll).toHaveBeenCalledWith(
        { 
          penAllocations: { 
            some: { penId: 'pen-1', status: 'ACTIVE' } 
          } 
        },
        undefined,
        expect.any(Object)
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockLots = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };

      cattleLotRepository.findAll.mockResolvedValue(mockLots);

      await cattleLotService.findAll({ startDate, endDate });

      expect(cattleLotRepository.findAll).toHaveBeenCalledWith(
        { entryDate: { gte: startDate, lte: endDate } },
        undefined,
        expect.any(Object)
      );
    });
  });

  describe('findById', () => {
    it('should return cattle lot by id', async () => {
      const mockLot = {
        id: '1',
        lotNumber: 'LOT-001',
        status: 'ACTIVE',
        currentQuantity: 100,
        penAllocations: []
      };

      cattleLotRepository.findWithRelations.mockResolvedValue(mockLot as any);

      const result = await cattleLotService.findById('1');

      expect(cattleLotRepository.findWithRelations).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockLot);
    });

    it('should throw NotFoundError when lot not found', async () => {
      cattleLotRepository.findWithRelations.mockResolvedValue(null);

      await expect(cattleLotService.findById('999')).rejects.toThrow(NotFoundError);
      await expect(cattleLotService.findById('999')).rejects.toThrow('Lote não encontrado');
    });
  });

  describe('allocateToPens', () => {
    const allocations = [
      { penId: 'pen-1', quantity: 30 },
      { penId: 'pen-2', quantity: 20 }
    ];

    it('should allocate lot to pens successfully', async () => {
      const mockLot = {
        id: '1',
        status: 'ACTIVE',
        currentQuantity: 100,
        penAllocations: [{ quantity: 20 }] // Already allocated 20
      };

      cattleLotRepository.findWithRelations.mockResolvedValue(mockLot as any);
      cattleLotRepository.allocateToPens.mockResolvedValue(mockLot as any);

      const result = await cattleLotService.allocateToPens('1', allocations, 'user-123');

      expect(cattleLotRepository.allocateToPens).toHaveBeenCalledWith('1', allocations, 'user-123');
      expect(result).toEqual(mockLot);
    });

    it('should throw ValidationError for inactive lots', async () => {
      const mockLot = {
        id: '1',
        status: 'SOLD',
        currentQuantity: 0,
        penAllocations: []
      };

      cattleLotRepository.findWithRelations.mockResolvedValue(mockLot as any);

      await expect(
        cattleLotService.allocateToPens('1', allocations, 'user-123')
      ).rejects.toThrow(ValidationError);
      await expect(
        cattleLotService.allocateToPens('1', allocations, 'user-123')
      ).rejects.toThrow('Apenas lotes ativos podem ser alocados');
    });

    it('should throw ValidationError when exceeding available quantity', async () => {
      const mockLot = {
        id: '1',
        status: 'ACTIVE',
        currentQuantity: 100,
        penAllocations: [{ quantity: 60 }] // Already allocated 60
      };

      cattleLotRepository.findWithRelations.mockResolvedValue(mockLot as any);

      await expect(
        cattleLotService.allocateToPens('1', allocations, 'user-123')
      ).rejects.toThrow(ValidationError);
      await expect(
        cattleLotService.allocateToPens('1', allocations, 'user-123')
      ).rejects.toThrow('Quantidade a alocar (50) excede quantidade disponível (40)');
    });
  });

  describe('recordMortality', () => {
    const mortalityData = {
      quantity: 5,
      cause: 'Disease',
      notes: 'Respiratory infection'
    };

    it('should record mortality successfully', async () => {
      const mockLot = {
        id: '1',
        currentQuantity: 100,
        entryQuantity: 100,
        totalCost: 50000,
        penAllocations: []
      };

      const expectedCostPerAnimal = 500; // 50000 / 100
      const expectedTotalValue = 2500; // 500 * 5

      cattleLotRepository.findWithRelations.mockResolvedValue(mockLot as any);
      cattleLotRepository.recordMortality.mockResolvedValue(undefined);
      prismaClient.nonCashExpense.create.mockResolvedValue({});
      prismaClient.lotMovement.create.mockResolvedValue({});

      await cattleLotService.recordMortality('1', mortalityData, 'user-123');

      expect(cattleLotRepository.recordMortality).toHaveBeenCalledWith('1', 5);
      expect(prismaClient.nonCashExpense.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'MORTALITY',
          lotId: '1',
          description: 'Mortalidade - Disease',
          quantity: 5,
          totalValue: expectedTotalValue
        })
      });
      expect(prismaClient.lotMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lotId: '1',
          movementType: 'DEATH',
          quantity: 5,
          reason: 'Disease',
          userId: 'user-123'
        })
      });
    });

    it('should throw ValidationError when mortality exceeds current quantity', async () => {
      const mockLot = {
        id: '1',
        currentQuantity: 3,
        entryQuantity: 100,
        totalCost: 50000,
        penAllocations: []
      };

      cattleLotRepository.findWithRelations.mockResolvedValue(mockLot as any);

      await expect(
        cattleLotService.recordMortality('1', mortalityData, 'user-123')
      ).rejects.toThrow(ValidationError);
      await expect(
        cattleLotService.recordMortality('1', mortalityData, 'user-123')
      ).rejects.toThrow('Quantidade de mortes excede quantidade atual');
    });
  });

  describe('recordWeightLoss', () => {
    const weightLossData = {
      expectedWeight: 15000,
      actualWeight: 14500,
      notes: 'Transport stress'
    };

    it('should record weight loss successfully', async () => {
      const mockLot = {
        id: '1',
        totalCost: 50000,
        entryWeight: 10000,
        penAllocations: []
      };

      const pricePerKg = 5; // 50000 / 10000
      const weightLoss = 500; // 15000 - 14500
      const totalValue = 2500; // 500 * 5
      const lossPercentage = 3.33; // (500 / 15000) * 100

      cattleLotRepository.findWithRelations.mockResolvedValue(mockLot as any);
      prismaClient.nonCashExpense.create.mockResolvedValue({});

      await cattleLotService.recordWeightLoss('1', weightLossData, 'user-123');

      expect(prismaClient.nonCashExpense.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'WEIGHT_LOSS',
          lotId: '1',
          description: expect.stringContaining('Quebra de peso'),
          expectedValue: 75000, // 15000 * 5
          actualValue: 72500, // 14500 * 5
          totalValue: totalValue
        })
      });
    });
  });

  describe('updateCosts', () => {
    it('should update valid cost type', async () => {
      const mockLot = { id: '1', penAllocations: [] };
      
      cattleLotRepository.findWithRelations.mockResolvedValue(mockLot as any);
      cattleLotRepository.updateCosts.mockResolvedValue(mockLot as any);

      const result = await cattleLotService.updateCosts('1', 'feedCost', 5000);

      expect(cattleLotRepository.updateCosts).toHaveBeenCalledWith('1', 'feedCost', 5000);
      expect(result).toEqual(mockLot);
    });

    it('should throw ValidationError for invalid cost type', async () => {
      const mockLot = { id: '1', penAllocations: [] };
      cattleLotRepository.findWithRelations.mockResolvedValue(mockLot as any);

      await expect(
        cattleLotService.updateCosts('1', 'invalidCost', 5000)
      ).rejects.toThrow(ValidationError);
      await expect(
        cattleLotService.updateCosts('1', 'invalidCost', 5000)
      ).rejects.toThrow('Tipo de custo inválido');
    });

    it('should accept all valid cost types', async () => {
      const mockLot = { id: '1', penAllocations: [] };
      const validCostTypes = [
        'healthCost',
        'feedCost',
        'operationalCost',
        'freightCost',
        'otherCosts'
      ];

      cattleLotRepository.findWithRelations.mockResolvedValue(mockLot as any);
      cattleLotRepository.updateCosts.mockResolvedValue(mockLot as any);

      for (const costType of validCostTypes) {
        await cattleLotService.updateCosts('1', costType, 1000);
        expect(cattleLotRepository.updateCosts).toHaveBeenCalledWith('1', costType, 1000);
      }
    });
  });

  describe('getMetrics', () => {
    it('should return lot metrics', async () => {
      const mockMetrics = {
        lot: { id: '1', lotNumber: 'LOT-001' },
        totalInvestment: 50000,
        currentValue: 55000,
        profitability: 10,
        daysInConfinement: 60,
        averageDailyGain: 1.2,
        feedConversionRate: 6.5
      };

      cattleLotRepository.getLotMetrics.mockResolvedValue(mockMetrics as any);

      const result = await cattleLotService.getMetrics('1');

      expect(cattleLotRepository.getLotMetrics).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockMetrics);
    });

    it('should throw NotFoundError when lot not found', async () => {
      cattleLotRepository.getLotMetrics.mockResolvedValue(null);

      await expect(cattleLotService.getMetrics('999')).rejects.toThrow(NotFoundError);
      await expect(cattleLotService.getMetrics('999')).rejects.toThrow('Lote não encontrado');
    });
  });

  describe('getStats', () => {
    it('should return cattle lot statistics', async () => {
      const mockActiveLots = {
        data: [
          { id: '1', currentQuantity: 100, totalCost: 50000 },
          { id: '2', currentQuantity: 150, totalCost: 75000 }
        ],
        total: 2,
        page: 1,
        limit: 1000,
        totalPages: 1
      };

      cattleLotRepository.count.mockResolvedValueOnce(2);  // active
      cattleLotRepository.count.mockResolvedValueOnce(5);  // sold
      cattleLotRepository.count.mockResolvedValueOnce(10); // total
      cattleLotRepository.findAll.mockResolvedValue(mockActiveLots);

      const result = await cattleLotService.getStats();

      expect(result).toEqual({
        active: 2,
        sold: 5,
        total: 10,
        totalAnimals: 250, // 100 + 150
        totalInvestment: 125000 // 50000 + 75000
      });

      expect(cattleLotRepository.count).toHaveBeenCalledTimes(3);
      expect(cattleLotRepository.findAll).toHaveBeenCalledWith(
        { status: 'ACTIVE' },
        { page: 1, limit: 1000 }
      );
    });
  });
});
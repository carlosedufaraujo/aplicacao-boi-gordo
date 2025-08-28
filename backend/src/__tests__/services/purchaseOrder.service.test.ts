import { PurchaseOrderService } from '@/services/purchaseOrder.service';
import { PurchaseOrderRepository } from '@/repositories/purchaseOrder.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PurchaseOrderStatus, PaymentType, AnimalType } from '@prisma/client';

jest.mock('@/repositories/purchaseOrder.repository');

describe('PurchaseOrderService', () => {
  let purchaseOrderService: PurchaseOrderService;
  let purchaseOrderRepository: jest.Mocked<PurchaseOrderRepository>;

  beforeEach(() => {
    purchaseOrderService = new PurchaseOrderService();
    purchaseOrderRepository = (purchaseOrderService as any).purchaseOrderRepository;
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all purchase orders without filters', async () => {
      const mockOrders = {
        data: [
          { id: '1', orderNumber: 'PO-001', status: 'PENDING' },
          { id: '2', orderNumber: 'PO-002', status: 'CONFINED' }
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      purchaseOrderRepository.findAll.mockResolvedValue(mockOrders);

      const result = await purchaseOrderService.findAll({});

      expect(purchaseOrderRepository.findAll).toHaveBeenCalledWith(
        {},
        undefined,
        { vendor: true, broker: true, lot: true }
      );
      expect(result).toEqual(mockOrders);
    });

    it('should filter by status', async () => {
      const mockOrders = {
        data: [{ id: '1', orderNumber: 'PO-001', status: 'PENDING' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      purchaseOrderRepository.findAll.mockResolvedValue(mockOrders);

      const result = await purchaseOrderService.findAll({ 
        status: 'PENDING' as PurchaseOrderStatus 
      });

      expect(purchaseOrderRepository.findAll).toHaveBeenCalledWith(
        { status: 'PENDING' },
        undefined,
        expect.any(Object)
      );
      expect(result).toEqual(mockOrders);
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockOrders = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };

      purchaseOrderRepository.findAll.mockResolvedValue(mockOrders);

      await purchaseOrderService.findAll({ startDate, endDate });

      expect(purchaseOrderRepository.findAll).toHaveBeenCalledWith(
        { purchaseDate: { gte: startDate, lte: endDate } },
        undefined,
        expect.any(Object)
      );
    });

    it('should handle search parameter', async () => {
      const mockOrders = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      purchaseOrderRepository.findAll.mockResolvedValue(mockOrders);

      await purchaseOrderService.findAll({ search: 'PO-001' });

      expect(purchaseOrderRepository.findAll).toHaveBeenCalledWith(
        {
          OR: [
            { orderNumber: { contains: 'PO-001' } },
            { location: { contains: 'PO-001', mode: 'insensitive' } }
          ]
        },
        undefined,
        expect.any(Object)
      );
    });
  });

  describe('findById', () => {
    it('should return purchase order by id', async () => {
      const mockOrder = {
        id: '1',
        orderNumber: 'PO-001',
        status: 'PENDING',
        vendor: { id: 'v1', name: 'Vendor 1' },
        lot: null
      };

      purchaseOrderRepository.findWithRelations.mockResolvedValue(mockOrder as any);

      const result = await purchaseOrderService.findById('1');

      expect(purchaseOrderRepository.findWithRelations).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundError when order not found', async () => {
      purchaseOrderRepository.findWithRelations.mockResolvedValue(null);

      await expect(purchaseOrderService.findById('999')).rejects.toThrow(NotFoundError);
      await expect(purchaseOrderService.findById('999')).rejects.toThrow('Ordem de compra não encontrada');
    });
  });

  describe('create', () => {
    const validOrderData = {
      vendorId: 'v1',
      location: 'Fazenda ABC',
      purchaseDate: new Date('2024-01-15'),
      animalCount: 100,
      animalType: 'CALF' as AnimalType,
      totalWeight: 15000,
      carcassYield: 52,
      pricePerArroba: 280,
      commission: 5000,
      paymentType: 'IN_ADVANCE' as PaymentType,
      payerAccountId: 'acc1',
      principalDueDate: new Date('2024-02-15'),
      notes: 'Test order'
    };

    it('should create a new purchase order', async () => {
      const mockOrderNumber = 'PO-2024-001';
      const expectedAverageWeight = 150; // 15000 / 100
      const expectedTotalValue = 145600; // (15000 * 52 / 100) / 15 * 280

      const mockCreatedOrder = {
        id: '1',
        orderNumber: mockOrderNumber,
        ...validOrderData,
        averageWeight: expectedAverageWeight,
        totalValue: expectedTotalValue,
        status: 'PENDING',
        currentStage: 'order'
      };

      purchaseOrderRepository.getNextOrderNumber.mockResolvedValue(mockOrderNumber);
      purchaseOrderRepository.createWithFinancialAccounts.mockResolvedValue(mockCreatedOrder as any);

      const result = await purchaseOrderService.create(validOrderData, 'user-123');

      expect(purchaseOrderRepository.getNextOrderNumber).toHaveBeenCalled();
      expect(purchaseOrderRepository.createWithFinancialAccounts).toHaveBeenCalledWith({
        orderNumber: mockOrderNumber,
        ...validOrderData,
        averageWeight: expectedAverageWeight,
        totalValue: expectedTotalValue,
        freightCost: 0,
        otherCosts: 0,
        status: 'PENDING',
        currentStage: 'order',
        user: { connect: { id: 'user-123' } },
        vendor: { connect: { id: 'v1' } },
        broker: undefined,
        payerAccount: { connect: { id: 'acc1' } }
      });
      expect(result).toEqual(mockCreatedOrder);
    });

    it('should handle optional broker and costs', async () => {
      const orderWithBroker = {
        ...validOrderData,
        brokerId: 'broker1',
        freightCost: 2000,
        otherCosts: 500
      };

      purchaseOrderRepository.getNextOrderNumber.mockResolvedValue('PO-2024-002');
      purchaseOrderRepository.createWithFinancialAccounts.mockResolvedValue({} as any);

      await purchaseOrderService.create(orderWithBroker, 'user-123');

      expect(purchaseOrderRepository.createWithFinancialAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          broker: { connect: { id: 'broker1' } },
          freightCost: 2000,
          otherCosts: 500
        })
      );
    });
  });

  describe('update', () => {
    const existingOrder = {
      id: '1',
      orderNumber: 'PO-001',
      status: 'PENDING',
      totalWeight: 15000,
      animalCount: 100,
      carcassYield: 52,
      pricePerArroba: 280,
      lot: null,
      financialAccounts: []
    };

    it('should update purchase order', async () => {
      const updateData = { location: 'Fazenda XYZ' };
      const updatedOrder = { ...existingOrder, ...updateData };

      purchaseOrderRepository.findWithRelations.mockResolvedValue(existingOrder as any);
      purchaseOrderRepository.update.mockResolvedValue(updatedOrder as any);

      const result = await purchaseOrderService.update('1', updateData);

      expect(purchaseOrderRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(result).toEqual(updatedOrder);
    });

    it('should recalculate values when weight or price changes', async () => {
      const updateData = { totalWeight: 16000 };
      const expectedAverageWeight = 160; // 16000 / 100
      const expectedTotalValue = 155733.33; // (16000 * 52 / 100) / 15 * 280

      purchaseOrderRepository.findWithRelations.mockResolvedValue(existingOrder as any);
      purchaseOrderRepository.update.mockResolvedValue({} as any);

      await purchaseOrderService.update('1', updateData);

      expect(purchaseOrderRepository.update).toHaveBeenCalledWith('1', {
        ...updateData,
        averageWeight: expectedAverageWeight,
        totalValue: expect.closeTo(expectedTotalValue, 2)
      });
    });

    it('should throw ValidationError for confined orders', async () => {
      const confinedOrder = { ...existingOrder, status: 'CONFINED' };
      purchaseOrderRepository.findWithRelations.mockResolvedValue(confinedOrder as any);

      await expect(
        purchaseOrderService.update('1', { location: 'New Location' })
      ).rejects.toThrow(ValidationError);
      await expect(
        purchaseOrderService.update('1', { location: 'New Location' })
      ).rejects.toThrow('Não é possível alterar ordens já confinadas');
    });
  });

  describe('registerReception', () => {
    const receptionData = {
      receptionDate: new Date('2024-01-20'),
      actualWeight: 14500,
      actualCount: 98,
      transportMortality: 2,
      notes: 'Reception notes'
    };

    it('should register reception successfully', async () => {
      const order = {
        id: '1',
        status: 'RECEPTION',
        totalWeight: 15000,
        lot: null,
        financialAccounts: []
      };

      const expectedWeightBreak = ((15000 - 14500) / 15000) * 100; // 3.33%

      purchaseOrderRepository.findWithRelations.mockResolvedValue(order as any);
      purchaseOrderRepository.update.mockResolvedValue({ ...order, ...receptionData } as any);
      purchaseOrderRepository.createLotFromOrder.mockResolvedValue({} as any);

      const result = await purchaseOrderService.registerReception('1', receptionData);

      expect(purchaseOrderRepository.update).toHaveBeenCalledWith('1', {
        ...receptionData,
        weightBreakPercentage: expect.closeTo(expectedWeightBreak, 2)
      });
      expect(purchaseOrderRepository.createLotFromOrder).toHaveBeenCalledWith('1', {});
      expect(result).toMatchObject(receptionData);
    });

    it('should throw ValidationError if not in reception stage', async () => {
      const order = {
        id: '1',
        status: 'PENDING',
        totalWeight: 15000,
        lot: null,
        financialAccounts: []
      };

      purchaseOrderRepository.findWithRelations.mockResolvedValue(order as any);

      await expect(
        purchaseOrderService.registerReception('1', receptionData)
      ).rejects.toThrow(ValidationError);
      await expect(
        purchaseOrderService.registerReception('1', receptionData)
      ).rejects.toThrow('Ordem não está na etapa de recepção');
    });
  });

  describe('updateStage', () => {
    it('should update stage to payment validation', async () => {
      const order = { id: '1', status: 'PENDING', lot: null, financialAccounts: [] };
      
      purchaseOrderRepository.findWithRelations.mockResolvedValue(order as any);
      purchaseOrderRepository.updateStatus.mockResolvedValue({ 
        ...order, 
        status: 'PAYMENT_VALIDATING' 
      } as any);

      const result = await purchaseOrderService.updateStage('1', 'payment-validation');

      expect(purchaseOrderRepository.updateStatus).toHaveBeenCalledWith('1', 'PAYMENT_VALIDATING');
      expect(result.status).toBe('PAYMENT_VALIDATING');
    });

    it('should update stage to reception', async () => {
      const order = { id: '1', status: 'PAYMENT_VALIDATING', lot: null, financialAccounts: [] };
      
      purchaseOrderRepository.findWithRelations.mockResolvedValue(order as any);
      purchaseOrderRepository.updateStatus.mockResolvedValue({ 
        ...order, 
        status: 'RECEPTION' 
      } as any);

      const result = await purchaseOrderService.updateStage('1', 'reception');

      expect(purchaseOrderRepository.updateStatus).toHaveBeenCalledWith('1', 'RECEPTION');
      expect(result.status).toBe('RECEPTION');
    });

    it('should update stage to confined', async () => {
      const order = { id: '1', status: 'RECEPTION', lot: null, financialAccounts: [] };
      
      purchaseOrderRepository.findWithRelations.mockResolvedValue(order as any);
      purchaseOrderRepository.updateStatus.mockResolvedValue({ 
        ...order, 
        status: 'CONFINED' 
      } as any);

      const result = await purchaseOrderService.updateStage('1', 'confined');

      expect(purchaseOrderRepository.updateStatus).toHaveBeenCalledWith('1', 'CONFINED');
      expect(result.status).toBe('CONFINED');
    });
  });

  describe('delete', () => {
    it('should delete order without lot or financial accounts', async () => {
      const order = {
        id: '1',
        status: 'PENDING',
        lot: null,
        financialAccounts: []
      };

      purchaseOrderRepository.findWithRelations.mockResolvedValue(order as any);
      purchaseOrderRepository.delete.mockResolvedValue(order as any);

      const result = await purchaseOrderService.delete('1');

      expect(purchaseOrderRepository.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual(order);
    });

    it('should cancel order with financial accounts instead of deleting', async () => {
      const order = {
        id: '1',
        status: 'PENDING',
        lot: null,
        financialAccounts: [{ id: 'acc1' }]
      };

      purchaseOrderRepository.findWithRelations.mockResolvedValue(order as any);
      purchaseOrderRepository.updateStatus.mockResolvedValue({ 
        ...order, 
        status: 'CANCELLED' 
      } as any);

      const result = await purchaseOrderService.delete('1');

      expect(purchaseOrderRepository.delete).not.toHaveBeenCalled();
      expect(purchaseOrderRepository.updateStatus).toHaveBeenCalledWith('1', 'CANCELLED');
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw ValidationError when order has lot', async () => {
      const order = {
        id: '1',
        status: 'CONFINED',
        lot: { id: 'lot1' },
        financialAccounts: []
      };

      purchaseOrderRepository.findWithRelations.mockResolvedValue(order as any);

      await expect(purchaseOrderService.delete('1')).rejects.toThrow(ValidationError);
      await expect(purchaseOrderService.delete('1')).rejects.toThrow('Não é possível excluir ordens com lote criado');
    });
  });

  describe('getStats', () => {
    it('should return purchase order statistics', async () => {
      purchaseOrderRepository.count.mockResolvedValueOnce(5);  // pending
      purchaseOrderRepository.count.mockResolvedValueOnce(3);  // validating
      purchaseOrderRepository.count.mockResolvedValueOnce(2);  // reception
      purchaseOrderRepository.count.mockResolvedValueOnce(10); // confined

      const result = await purchaseOrderService.getStats();

      expect(result).toEqual({
        pending: 5,
        validating: 3,
        reception: 2,
        confined: 10,
        total: 20
      });

      expect(purchaseOrderRepository.count).toHaveBeenCalledTimes(4);
      expect(purchaseOrderRepository.count).toHaveBeenNthCalledWith(1, { status: 'PENDING' });
      expect(purchaseOrderRepository.count).toHaveBeenNthCalledWith(2, { status: 'PAYMENT_VALIDATING' });
      expect(purchaseOrderRepository.count).toHaveBeenNthCalledWith(3, { status: 'RECEPTION' });
      expect(purchaseOrderRepository.count).toHaveBeenNthCalledWith(4, { status: 'CONFINED' });
    });
  });
});
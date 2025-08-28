import { ExpenseService } from '@/services/expense.service';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';

jest.mock('@/repositories/expense.repository');

describe('ExpenseService', () => {
  let expenseService: ExpenseService;
  let expenseRepository: jest.Mocked<ExpenseRepository>;

  beforeEach(() => {
    expenseService = new ExpenseService();
    expenseRepository = (expenseService as any).expenseRepository;
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all expenses without filters', async () => {
      const mockExpenses = {
        data: [
          { id: '1', description: 'Feed purchase', category: 'feed', totalAmount: 5000 },
          { id: '2', description: 'Freight', category: 'freight', totalAmount: 2000 }
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      expenseRepository.findAll.mockResolvedValue(mockExpenses);

      const result = await expenseService.findAll({});

      expect(expenseRepository.findAll).toHaveBeenCalledWith(
        {},
        undefined,
        expect.objectContaining({
          costCenter: true,
          lot: true,
          payerAccount: true,
          allocations: true
        })
      );
      expect(result).toEqual(mockExpenses);
    });

    it('should filter by category', async () => {
      const mockExpenses = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      expenseRepository.findAll.mockResolvedValue(mockExpenses);

      await expenseService.findAll({ category: 'feed' });

      expect(expenseRepository.findAll).toHaveBeenCalledWith(
        { category: 'feed' },
        undefined,
        expect.any(Object)
      );
    });

    it('should filter by payment status', async () => {
      const mockExpenses = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      expenseRepository.findAll.mockResolvedValue(mockExpenses);

      await expenseService.findAll({ isPaid: true });

      expect(expenseRepository.findAll).toHaveBeenCalledWith(
        { isPaid: true },
        undefined,
        expect.any(Object)
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockExpenses = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };

      expenseRepository.findAll.mockResolvedValue(mockExpenses);

      await expenseService.findAll({ startDate, endDate });

      expect(expenseRepository.findAll).toHaveBeenCalledWith(
        { dueDate: { gte: startDate, lte: endDate } },
        undefined,
        expect.any(Object)
      );
    });

    it('should handle search parameter', async () => {
      const mockExpenses = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      expenseRepository.findAll.mockResolvedValue(mockExpenses);

      await expenseService.findAll({ search: 'feed' });

      expect(expenseRepository.findAll).toHaveBeenCalledWith(
        {
          OR: [
            { description: { contains: 'feed', mode: 'insensitive' } },
            { notes: { contains: 'feed', mode: 'insensitive' } }
          ]
        },
        undefined,
        expect.any(Object)
      );
    });
  });

  describe('findById', () => {
    it('should return expense by id', async () => {
      const mockExpense = {
        id: '1',
        description: 'Feed purchase',
        category: 'feed',
        totalAmount: 5000,
        isPaid: false
      };

      expenseRepository.findWithRelations.mockResolvedValue(mockExpense as any);

      const result = await expenseService.findById('1');

      expect(expenseRepository.findWithRelations).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundError when expense not found', async () => {
      expenseRepository.findWithRelations.mockResolvedValue(null);

      await expect(expenseService.findById('999')).rejects.toThrow(NotFoundError);
      await expect(expenseService.findById('999')).rejects.toThrow('Despesa não encontrada');
    });
  });

  describe('create', () => {
    const validExpenseData = {
      category: 'feed',
      description: 'Monthly feed purchase',
      totalAmount: 10000,
      dueDate: new Date('2024-02-15'),
      lotId: 'lot-1',
      payerAccountId: 'acc-1'
    };

    it('should create a new expense', async () => {
      const mockCreatedExpense = {
        id: '1',
        ...validExpenseData,
        impactsCashFlow: true,
        isPaid: false
      };

      expenseRepository.createWithAllocations.mockResolvedValue(mockCreatedExpense as any);

      const result = await expenseService.create(validExpenseData, 'user-123');

      expect(expenseRepository.createWithAllocations).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validExpenseData,
          impactsCashFlow: true,
          isPaid: false,
          userId: 'user-123'
        }),
        undefined
      );
      expect(result).toEqual(mockCreatedExpense);
    });

    it('should throw ValidationError for invalid category', async () => {
      const invalidData = {
        ...validExpenseData,
        category: 'invalid_category'
      };

      await expect(expenseService.create(invalidData, 'user-123')).rejects.toThrow(ValidationError);
      await expect(expenseService.create(invalidData, 'user-123')).rejects.toThrow('Categoria inválida');
      expect(expenseRepository.createWithAllocations).not.toHaveBeenCalled();
    });

    it('should set impactsCashFlow to false for non-cash expenses', async () => {
      const nonCashExpense = {
        ...validExpenseData,
        category: 'deaths'
      };

      expenseRepository.createWithAllocations.mockResolvedValue({} as any);

      await expenseService.create(nonCashExpense, 'user-123');

      expect(expenseRepository.createWithAllocations).toHaveBeenCalledWith(
        expect.objectContaining({
          impactsCashFlow: false
        }),
        undefined
      );
    });

    it('should handle allocations', async () => {
      const allocations = [
        { entityType: 'LOT' as const, entityId: 'lot-1', allocatedAmount: 5000, percentage: 50 },
        { entityType: 'PEN' as const, entityId: 'pen-1', allocatedAmount: 5000, percentage: 50 }
      ];

      expenseRepository.createWithAllocations.mockResolvedValue({} as any);

      await expenseService.create(validExpenseData, 'user-123', allocations);

      expect(expenseRepository.createWithAllocations).toHaveBeenCalledWith(
        expect.any(Object),
        allocations
      );
    });
  });

  describe('update', () => {
    const updateData = {
      description: 'Updated description',
      totalAmount: 12000
    };

    it('should update expense', async () => {
      const existingExpense = {
        id: '1',
        description: 'Original description',
        isPaid: false,
        allocations: [],
        reconciliations: []
      };

      expenseRepository.findWithRelations.mockResolvedValue(existingExpense as any);
      expenseRepository.update.mockResolvedValue({ ...existingExpense, ...updateData } as any);

      const result = await expenseService.update('1', updateData);

      expect(expenseRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(result.description).toBe('Updated description');
    });

    it('should throw ValidationError when trying to edit paid expense', async () => {
      const paidExpense = {
        id: '1',
        isPaid: true,
        allocations: [],
        reconciliations: []
      };

      expenseRepository.findWithRelations.mockResolvedValue(paidExpense as any);

      await expect(
        expenseService.update('1', updateData)
      ).rejects.toThrow(ValidationError);
      await expect(
        expenseService.update('1', updateData)
      ).rejects.toThrow('Não é possível alterar despesas já pagas');
    });

    it('should allow unpaying expense', async () => {
      const paidExpense = {
        id: '1',
        isPaid: true,
        allocations: [],
        reconciliations: []
      };

      expenseRepository.findWithRelations.mockResolvedValue(paidExpense as any);
      expenseRepository.update.mockResolvedValue({ ...paidExpense, isPaid: false } as any);

      const result = await expenseService.update('1', { isPaid: false });

      expect(expenseRepository.update).toHaveBeenCalledWith('1', { isPaid: false });
      expect(result.isPaid).toBe(false);
    });
  });

  describe('pay', () => {
    const paymentData = {
      paymentDate: new Date('2024-01-20'),
      payerAccountId: 'acc-1'
    };

    it('should pay expense successfully', async () => {
      const unpaidExpense = {
        id: '1',
        isPaid: false,
        payerAccountId: 'acc-1',
        allocations: [],
        reconciliations: []
      };

      expenseRepository.findWithRelations.mockResolvedValue(unpaidExpense as any);
      expenseRepository.payExpense.mockResolvedValue({ 
        ...unpaidExpense, 
        isPaid: true,
        paymentDate: paymentData.paymentDate 
      } as any);

      const result = await expenseService.pay('1', paymentData);

      expect(expenseRepository.payExpense).toHaveBeenCalledWith('1', paymentData);
      expect(result.isPaid).toBe(true);
    });

    it('should throw ValidationError for already paid expense', async () => {
      const paidExpense = {
        id: '1',
        isPaid: true,
        allocations: [],
        reconciliations: []
      };

      expenseRepository.findWithRelations.mockResolvedValue(paidExpense as any);

      await expect(expenseService.pay('1', paymentData)).rejects.toThrow(ValidationError);
      await expect(expenseService.pay('1', paymentData)).rejects.toThrow('Despesa já paga');
    });

    it('should require payer account', async () => {
      const expense = {
        id: '1',
        isPaid: false,
        payerAccountId: null,
        allocations: [],
        reconciliations: []
      };

      expenseRepository.findWithRelations.mockResolvedValue(expense as any);

      await expect(expenseService.pay('1', {})).rejects.toThrow(ValidationError);
      await expect(expenseService.pay('1', {})).rejects.toThrow('Conta pagadora é obrigatória');
    });
  });

  describe('delete', () => {
    it('should delete unpaid expense without allocations', async () => {
      const expense = {
        id: '1',
        isPaid: false,
        allocations: [],
        reconciliations: []
      };

      expenseRepository.findWithRelations.mockResolvedValue(expense as any);
      expenseRepository.delete.mockResolvedValue(expense as any);

      const result = await expenseService.delete('1');

      expect(expenseRepository.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual(expense);
    });

    it('should throw ValidationError for paid expense', async () => {
      const paidExpense = {
        id: '1',
        isPaid: true,
        allocations: [],
        reconciliations: []
      };

      expenseRepository.findWithRelations.mockResolvedValue(paidExpense as any);

      await expect(expenseService.delete('1')).rejects.toThrow(ValidationError);
      await expect(expenseService.delete('1')).rejects.toThrow('Não é possível excluir despesas pagas');
    });

    it('should throw ValidationError for expense with allocations', async () => {
      const expense = {
        id: '1',
        isPaid: false,
        allocations: [{ id: 'alloc-1' }],
        reconciliations: []
      };

      expenseRepository.findWithRelations.mockResolvedValue(expense as any);

      await expect(expenseService.delete('1')).rejects.toThrow(ValidationError);
      await expect(expenseService.delete('1')).rejects.toThrow('Não é possível excluir despesa com alocações ou reconciliações');
    });
  });

  describe('getSummary', () => {
    it('should return expense summary', async () => {
      const mockExpenses = {
        data: [
          { id: '1', totalAmount: 5000, isPaid: true, dueDate: new Date('2024-01-01'), impactsCashFlow: true },
          { id: '2', totalAmount: 3000, isPaid: false, dueDate: new Date('2024-02-01'), impactsCashFlow: true },
          { id: '3', totalAmount: 2000, isPaid: false, dueDate: new Date('2023-12-01'), impactsCashFlow: true }
        ],
        total: 3,
        page: 1,
        limit: 1000,
        totalPages: 1
      };

      expenseRepository.findAll.mockResolvedValue(mockExpenses as any);

      const result = await expenseService.getSummary();

      expect(result).toEqual({
        total: 10000,
        paid: 5000,
        pending: 5000,
        overdue: 2000,
        count: 3,
        paidCount: 1,
        pendingCount: 2,
        overdueCount: 1
      });
    });
  });
});
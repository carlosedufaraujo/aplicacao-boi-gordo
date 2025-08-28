import { BaseRepository } from '@/repositories/base.repository';
import { prisma } from '@/config/database';

// Mock do Prisma
jest.mock('@/config/database', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

describe('BaseRepository', () => {
  let repository: BaseRepository<any>;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    };

    class TestRepository extends BaseRepository<any> {
      constructor() {
        super(mockModel);
      }
    }

    repository = new TestRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      mockModel.findMany.mockResolvedValue(mockData);
      mockModel.count.mockResolvedValue(10);

      const result = await repository.findAll(
        {},
        { page: 1, limit: 5 }
      );

      expect(result).toEqual({
        data: mockData,
        total: 10,
        page: 1,
        limit: 5,
        totalPages: 2,
      });
      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: undefined,
      });
    });

    it('should apply sorting when specified', async () => {
      mockModel.findMany.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(0);

      await repository.findAll(
        {},
        { page: 1, limit: 10, sortBy: 'name', sortOrder: 'asc' }
      );

      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
        include: undefined,
      });
    });
  });

  describe('findById', () => {
    it('should find entity by id', async () => {
      const mockEntity = { id: '1', name: 'Test' };
      mockModel.findUnique.mockResolvedValue(mockEntity);

      const result = await repository.findById('1');

      expect(result).toEqual(mockEntity);
      expect(mockModel.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: undefined,
      });
    });

    it('should return null if entity not found', async () => {
      mockModel.findUnique.mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new entity', async () => {
      const newEntity = { name: 'New Entity' };
      const createdEntity = { id: '1', ...newEntity };
      mockModel.create.mockResolvedValue(createdEntity);

      const result = await repository.create(newEntity);

      expect(result).toEqual(createdEntity);
      expect(mockModel.create).toHaveBeenCalledWith({
        data: newEntity,
        include: undefined,
      });
    });
  });

  describe('update', () => {
    it('should update existing entity', async () => {
      const updateData = { name: 'Updated' };
      const updatedEntity = { id: '1', ...updateData };
      mockModel.update.mockResolvedValue(updatedEntity);

      const result = await repository.update('1', updateData);

      expect(result).toEqual(updatedEntity);
      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
        include: undefined,
      });
    });
  });

  describe('delete', () => {
    it('should delete entity by id', async () => {
      const deletedEntity = { id: '1', name: 'Deleted' };
      mockModel.delete.mockResolvedValue(deletedEntity);

      const result = await repository.delete('1');

      expect(result).toEqual(deletedEntity);
      expect(mockModel.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('exists', () => {
    it('should return true if entity exists', async () => {
      mockModel.count.mockResolvedValue(1);

      const result = await repository.exists({ email: 'test@example.com' });

      expect(result).toBe(true);
      expect(mockModel.count).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return false if entity does not exist', async () => {
      mockModel.count.mockResolvedValue(0);

      const result = await repository.exists({ email: 'notfound@example.com' });

      expect(result).toBe(false);
    });
  });

  describe('transaction', () => {
    it('should execute transaction', async () => {
      const mockResult = { success: true };
      const mockTransaction = jest.fn().mockResolvedValue(mockResult);
      (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);

      const transactionFn = jest.fn().mockResolvedValue(mockResult);
      const result = await repository.transaction(transactionFn);

      expect(result).toEqual(mockResult);
      expect(prisma.$transaction).toHaveBeenCalledWith(transactionFn);
    });
  });
});
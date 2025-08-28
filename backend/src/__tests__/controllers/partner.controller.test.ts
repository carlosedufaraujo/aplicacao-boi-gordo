import request from 'supertest';
import express from 'express';
import { PartnerController } from '@/controllers/partner.controller';
import { PartnerService } from '@/services/partner.service';
import { authMiddleware } from '@/middleware/auth';
import { NotFoundError, ConflictError } from '@/utils/AppError';
import { PartnerType } from '@prisma/client';

jest.mock('@/services/partner.service');
jest.mock('@/middleware/auth', () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.userId = 'test-user-id';
    next();
  })
}));

describe('PartnerController', () => {
  let app: express.Express;
  let partnerService: jest.Mocked<PartnerService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    const partnerController = new PartnerController();
    partnerService = (partnerController as any).partnerService;

    app.use('/api/partners', partnerController.getRouter());
    jest.clearAllMocks();
  });

  describe('GET /api/partners', () => {
    it('should return all partners with pagination', async () => {
      const mockPartners = {
        data: [
          { id: '1', name: 'Partner 1', type: 'SUPPLIER' },
          { id: '2', name: 'Partner 2', type: 'BUYER' }
        ],
        total: 2,
        page: 1,
        limit: 10
      };

      partnerService.findAll.mockResolvedValue(mockPartners);

      const response = await request(app)
        .get('/api/partners')
        .expect(200);

      expect(response.body).toEqual(mockPartners);
      expect(partnerService.findAll).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
    });

    it('should filter partners by type', async () => {
      const mockPartners = {
        data: [{ id: '1', name: 'Partner 1', type: 'SUPPLIER' }],
        total: 1,
        page: 1,
        limit: 10
      };

      partnerService.findAll.mockResolvedValue(mockPartners);

      const response = await request(app)
        .get('/api/partners?type=SUPPLIER')
        .expect(200);

      expect(response.body).toEqual(mockPartners);
      expect(partnerService.findAll).toHaveBeenCalledWith(
        { type: 'SUPPLIER' },
        { page: 1, limit: 10 }
      );
    });

    it('should handle search parameter', async () => {
      const mockPartners = {
        data: [{ id: '1', name: 'João Silva' }],
        total: 1,
        page: 1,
        limit: 10
      };

      partnerService.findAll.mockResolvedValue(mockPartners);

      const response = await request(app)
        .get('/api/partners?search=João')
        .expect(200);

      expect(partnerService.findAll).toHaveBeenCalledWith(
        { search: 'João' },
        { page: 1, limit: 10 }
      );
    });
  });

  describe('GET /api/partners/:id', () => {
    it('should return partner by id', async () => {
      const mockPartner = {
        id: '1',
        name: 'Partner 1',
        type: 'SUPPLIER',
        cpfCnpj: '123.456.789-00'
      };

      partnerService.findById.mockResolvedValue(mockPartner);

      const response = await request(app)
        .get('/api/partners/1')
        .expect(200);

      expect(response.body).toEqual(mockPartner);
      expect(partnerService.findById).toHaveBeenCalledWith('1');
    });

    it('should return 404 when partner not found', async () => {
      partnerService.findById.mockRejectedValue(new NotFoundError('Parceiro não encontrado'));

      const response = await request(app)
        .get('/api/partners/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Parceiro não encontrado');
    });
  });

  describe('POST /api/partners', () => {
    const validPartnerData = {
      name: 'Novo Parceiro',
      type: 'SUPPLIER',
      cpfCnpj: '12.345.678/0001-90',
      phone: '(11) 98765-4321',
      email: 'novo@parceiro.com'
    };

    it('should create a new partner', async () => {
      const mockCreatedPartner = { id: '1', ...validPartnerData };
      partnerService.create.mockResolvedValue(mockCreatedPartner);

      const response = await request(app)
        .post('/api/partners')
        .send(validPartnerData)
        .expect(201);

      expect(response.body).toEqual(mockCreatedPartner);
      expect(partnerService.create).toHaveBeenCalledWith(validPartnerData);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/partners')
        .send({ name: 'Incomplete Partner' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(partnerService.create).not.toHaveBeenCalled();
    });

    it('should return 409 for duplicate CPF/CNPJ', async () => {
      partnerService.create.mockRejectedValue(new ConflictError('CPF/CNPJ já cadastrado'));

      const response = await request(app)
        .post('/api/partners')
        .send(validPartnerData)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'CPF/CNPJ já cadastrado');
    });
  });

  describe('PUT /api/partners/:id', () => {
    const updateData = {
      name: 'Parceiro Atualizado',
      phone: '(11) 98765-0000'
    };

    it('should update partner', async () => {
      const mockUpdatedPartner = { id: '1', ...updateData };
      partnerService.update.mockResolvedValue(mockUpdatedPartner);

      const response = await request(app)
        .put('/api/partners/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedPartner);
      expect(partnerService.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should return 404 when partner not found', async () => {
      partnerService.update.mockRejectedValue(new NotFoundError('Parceiro não encontrado'));

      const response = await request(app)
        .put('/api/partners/999')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Parceiro não encontrado');
    });

    it('should return 409 for duplicate CPF/CNPJ', async () => {
      partnerService.update.mockRejectedValue(new ConflictError('CPF/CNPJ já cadastrado'));

      const response = await request(app)
        .put('/api/partners/1')
        .send({ cpfCnpj: '222.222.222-22' })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'CPF/CNPJ já cadastrado');
    });
  });

  describe('DELETE /api/partners/:id', () => {
    it('should delete partner', async () => {
      partnerService.delete.mockResolvedValue({ id: '1', isActive: false } as any);

      const response = await request(app)
        .delete('/api/partners/1')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Parceiro removido com sucesso');
      expect(partnerService.delete).toHaveBeenCalledWith('1');
    });

    it('should return 404 when partner not found', async () => {
      partnerService.delete.mockRejectedValue(new NotFoundError('Parceiro não encontrado'));

      const response = await request(app)
        .delete('/api/partners/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Parceiro não encontrado');
    });
  });

  describe('GET /api/partners/:id/stats', () => {
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

      partnerService.getStats.mockResolvedValue(mockStats as any);

      const response = await request(app)
        .get('/api/partners/1/stats')
        .expect(200);

      expect(response.body).toEqual(mockStats);
      expect(partnerService.getStats).toHaveBeenCalledWith('1');
    });

    it('should return 404 when partner not found', async () => {
      partnerService.getStats.mockRejectedValue(new NotFoundError('Parceiro não encontrado'));

      const response = await request(app)
        .get('/api/partners/999/stats')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Parceiro não encontrado');
    });
  });
});
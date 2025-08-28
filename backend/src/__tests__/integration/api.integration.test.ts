import request from 'supertest';
import express from 'express';
import { prisma } from '@/config/database';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

// Mock the app for testing
const app = express();
app.use(express.json());

// Add a simple health endpoint for testing
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

describe('API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user and generate token
    testUserId = 'test-user-' + Date.now();
    authToken = jwt.sign({ userId: testUserId }, env.jwtSecret, { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.$disconnect();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication Flow', () => {
    it('should reject requests without token', async () => {
      await request(app)
        .get('/api/partners')
        .expect(401);
    });

    it('should accept requests with valid token', async () => {
      await request(app)
        .get('/api/partners')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject requests with invalid token', async () => {
      await request(app)
        .get('/api/partners')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Partner CRUD Operations', () => {
    let partnerId: string;

    it('should create a new partner', async () => {
      const response = await request(app)
        .post('/api/partners')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Partner',
          type: 'SUPPLIER',
          cpfCnpj: '12.345.678/0001-90',
          phone: '(11) 98765-4321',
          email: 'test@partner.com'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Partner');
      partnerId = response.body.id;
    });

    it('should retrieve the created partner', async () => {
      const response = await request(app)
        .get(`/api/partners/${partnerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', partnerId);
      expect(response.body).toHaveProperty('name', 'Test Partner');
    });

    it('should update the partner', async () => {
      const response = await request(app)
        .put(`/api/partners/${partnerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Partner Name'
        })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Partner Name');
    });

    it('should list partners with pagination', async () => {
      const response = await request(app)
        .get('/api/partners?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should delete the partner', async () => {
      await request(app)
        .delete(`/api/partners/${partnerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/partners/${partnerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Purchase Order Workflow', () => {
    let vendorId: string;
    let orderId: string;

    beforeAll(async () => {
      // Create a vendor for the purchase order
      const vendor = await prisma.partner.create({
        data: {
          name: 'Test Vendor',
          type: 'SUPPLIER',
          isActive: true
        }
      });
      vendorId = vendor.id;
    });

    it('should create a purchase order', async () => {
      const response = await request(app)
        .post('/api/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendorId,
          location: 'Test Farm',
          purchaseDate: new Date(),
          animalCount: 100,
          animalType: 'CALF',
          totalWeight: 15000,
          carcassYield: 52,
          pricePerArroba: 280,
          commission: 5000,
          paymentType: 'IN_ADVANCE',
          payerAccountId: 'acc-1',
          principalDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body).toHaveProperty('status', 'PENDING');
      orderId = response.body.id;
    });

    it('should update purchase order stage', async () => {
      const response = await request(app)
        .patch(`/api/purchase-orders/${orderId}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          stage: 'payment-validation'
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'PAYMENT_VALIDATING');
    });

    it('should get purchase order stats', async () => {
      const response = await request(app)
        .get('/api/purchase-orders/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('pending');
      expect(response.body).toHaveProperty('validating');
      expect(response.body).toHaveProperty('reception');
      expect(response.body).toHaveProperty('confined');
      expect(response.body).toHaveProperty('total');
    });

    afterAll(async () => {
      // Cleanup
      if (orderId) {
        await prisma.purchaseOrder.delete({ where: { id: orderId } }).catch(() => {});
      }
      if (vendorId) {
        await prisma.partner.delete({ where: { id: vendorId } }).catch(() => {});
      }
    });
  });

  describe('Financial Operations', () => {
    let expenseId: string;
    let revenueId: string;

    it('should create an expense', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'feed',
          description: 'Monthly feed purchase',
          totalAmount: 10000,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('isPaid', false);
      expenseId = response.body.id;
    });

    it('should create a revenue', async () => {
      const response = await request(app)
        .post('/api/revenues')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'cattle_sales',
          description: 'Sale of cattle lot',
          totalAmount: 50000,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('isReceived', false);
      revenueId = response.body.id;
    });

    it('should get financial summary', async () => {
      const response = await request(app)
        .get('/api/expenses/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('paid');
      expect(response.body).toHaveProperty('pending');
      expect(response.body).toHaveProperty('overdue');
    });

    afterAll(async () => {
      // Cleanup
      if (expenseId) {
        await prisma.expense.delete({ where: { id: expenseId } }).catch(() => {});
      }
      if (revenueId) {
        await prisma.revenue.delete({ where: { id: revenueId } }).catch(() => {});
      }
    });
  });

  describe('Dashboard Endpoints', () => {
    it('should get dashboard metrics', async () => {
      const response = await request(app)
        .get('/api/dashboard/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('overview');
      expect(response.body.overview).toHaveProperty('totalAnimals');
      expect(response.body.overview).toHaveProperty('activeLots');
      expect(response.body.overview).toHaveProperty('occupancyRate');
      expect(response.body.overview).toHaveProperty('monthlyRevenue');
      expect(response.body.overview).toHaveProperty('monthlyExpense');
    });

    it('should get dashboard charts', async () => {
      const response = await request(app)
        .get('/api/dashboard/charts?period=month')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('revenue');
      expect(response.body).toHaveProperty('costs');
      expect(response.body).toHaveProperty('occupancy');
      expect(response.body).toHaveProperty('sales');
    });

    it('should get dashboard alerts', async () => {
      const response = await request(app)
        .get('/api/dashboard/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for invalid request data', async () => {
      const response = await request(app)
        .post('/api/partners')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required field 'name'
          type: 'SUPPLIER'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/partners/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 for duplicate resource', async () => {
      // Create first partner
      await request(app)
        .post('/api/partners')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Duplicate Test',
          type: 'SUPPLIER',
          cpfCnpj: '99.999.999/0001-99'
        })
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/partners')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Duplicate Test 2',
          type: 'BUYER',
          cpfCnpj: '99.999.999/0001-99' // Same CPF/CNPJ
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });
  });
});
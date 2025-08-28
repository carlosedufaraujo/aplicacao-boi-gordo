import request from 'supertest';
import { createApp } from '@/app';
import { prisma } from '@/config/database';
import { Application } from 'express';

describe('API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('Authentication', () => {
    describe('POST /api/v1/auth/login', () => {
      it('should login with valid credentials', async () => {
        // Create test user first
        const testUser = await prisma.user.create({
          data: {
            email: 'test@integration.com',
            password: '$2a$10$YourHashedPasswordHere',
            name: 'Test User',
            role: 'USER',
          },
        });

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@integration.com',
            password: 'testpassword',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');

        // Cleanup
        await prisma.user.delete({ where: { id: testUser.id } });
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'invalid@test.com',
            password: 'wrongpassword',
          })
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/v1/auth/register', () => {
      it('should register new user', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'newuser@test.com',
            password: 'securePassword123',
            name: 'New User',
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');

        // Cleanup
        await prisma.user.delete({ 
          where: { email: 'newuser@test.com' } 
        });
      });

      it('should reject duplicate email', async () => {
        // Create user first
        await prisma.user.create({
          data: {
            email: 'existing@test.com',
            password: 'hashedPassword',
            name: 'Existing User',
          },
        });

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'existing@test.com',
            password: 'password123',
            name: 'Duplicate User',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');

        // Cleanup
        await prisma.user.delete({ 
          where: { email: 'existing@test.com' } 
        });
      });
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
      // Create test user and get token
      const user = await prisma.user.create({
        data: {
          email: 'protected@test.com',
          password: '$2a$10$hashedPassword',
          name: 'Protected User',
          role: 'ADMIN',
        },
      });
      userId = user.id;

      // Mock login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'protected@test.com',
          password: 'testpassword',
        });

      authToken = loginResponse.body.token;
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: userId } });
    });

    describe('Partners API', () => {
      it('should list partners with auth', async () => {
        const response = await request(app)
          .get('/api/v1/partners')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should create partner with auth', async () => {
        const response = await request(app)
          .post('/api/v1/partners')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Partner',
            type: 'VENDOR',
            cpfCnpj: '12345678901',
            phone: '11999999999',
            email: 'partner@test.com',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Test Partner');

        // Cleanup
        await prisma.partner.delete({ 
          where: { id: response.body.id } 
        });
      });

      it('should reject request without auth', async () => {
        await request(app)
          .get('/api/v1/partners')
          .expect(401);
      });
    });

    describe('Purchase Orders API', () => {
      let partnerId: string;
      let payerAccountId: string;

      beforeAll(async () => {
        // Create required data
        const partner = await prisma.partner.create({
          data: {
            name: 'Test Vendor',
            type: 'VENDOR',
          },
        });
        partnerId = partner.id;

        const payerAccount = await prisma.payerAccount.create({
          data: {
            bankName: 'Test Bank',
            accountName: 'Test Account',
            accountType: 'CHECKING',
          },
        });
        payerAccountId = payerAccount.id;
      });

      afterAll(async () => {
        await prisma.partner.delete({ where: { id: partnerId } });
        await prisma.payerAccount.delete({ where: { id: payerAccountId } });
      });

      it('should create purchase order', async () => {
        const response = await request(app)
          .post('/api/v1/purchase-orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            orderNumber: 'PO-TEST-001',
            vendorId: partnerId,
            payerAccountId: payerAccountId,
            location: 'Test Location',
            purchaseDate: new Date(),
            animalCount: 100,
            animalType: 'MALE',
            totalWeight: 45000,
            averageWeight: 450,
            carcassYield: 52.5,
            pricePerArroba: 280,
            totalValue: 150000,
            commission: 1500,
            paymentType: 'CASH',
            principalDueDate: new Date(),
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.orderNumber).toBe('PO-TEST-001');

        // Cleanup
        await prisma.purchaseOrder.delete({ 
          where: { id: response.body.id } 
        });
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array(101).fill(null).map(() => 
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);
      
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });
});
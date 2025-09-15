/**
 * Testes de Integração da API de Compra de Gado
 * Valida todos os endpoints e respostas da API
 */

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../../backend/src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let app: Application;
let authToken: string;
let testUserId: string;
let testVendorId: string;
let testAccountId: string;

describe('API de Compra de Gado', () => {

  beforeAll(async () => {
    app = createApp();

    // Criar usuário de teste e fazer login
    const userData = {
      email: `api-test-${Date.now()}@test.com`,
      password: 'Test123@',
      name: 'API Test User',
      role: 'ADMIN'
    };

    // Registrar usuário
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    testUserId = registerRes.body.data.user.id;
    authToken = registerRes.body.data.token;

    // Criar vendor de teste
    const vendorRes = await request(app)
      .post('/api/v1/partners')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'API Test Vendor',
        type: 'VENDOR',
        documentType: 'CPF',
        documentNumber: `${Date.now()}`,
        isActive: true
      });

    testVendorId = vendorRes.body.data.id;

    // Criar conta de teste
    const accountRes = await request(app)
      .post('/api/v1/payer-accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        bankName: 'API Test Bank',
        accountNumber: `${Date.now()}`,
        accountHolder: 'Test Holder',
        documentNumber: `${Date.now()}`,
        balance: 1000000,
        isActive: true
      });

    testAccountId = accountRes.body.data.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.$disconnect();
  });

  describe('POST /api/v1/cattle-purchases', () => {
    let createdPurchaseId: string;

    it('deve criar uma nova compra com dados válidos', async () => {
      const purchaseData = {
        vendorId: testVendorId,
        payerAccountId: testAccountId,
        purchaseDate: new Date().toISOString(),
        animalType: 'MALE',
        initialQuantity: 50,
        purchaseWeight: 15000, // 300kg por animal
        pricePerArroba: 280,
        carcassYield: 50
      };

      const response = await request(app)
        .post('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchaseData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.lotCode).toMatch(/^LOT-/);
      expect(response.body.data.purchaseValue).toBeGreaterThan(0);

      createdPurchaseId = response.body.data.id;
    });

    it('deve validar campos obrigatórios', async () => {
      const invalidData = {
        animalType: 'MALE'
        // Faltando campos obrigatórios
      };

      const response = await request(app)
        .post('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBeDefined();
    });

    it('deve rejeitar requisições sem autenticação', async () => {
      const purchaseData = {
        vendorId: testVendorId,
        payerAccountId: testAccountId,
        purchaseDate: new Date().toISOString(),
        animalType: 'MALE',
        initialQuantity: 50,
        purchaseWeight: 15000,
        pricePerArroba: 280,
        carcassYield: 50
      };

      await request(app)
        .post('/api/v1/cattle-purchases')
        .send(purchaseData)
        .expect(401);
    });

    it('deve validar tipos de dados', async () => {
      const invalidData = {
        vendorId: testVendorId,
        payerAccountId: testAccountId,
        purchaseDate: 'invalid-date',
        animalType: 'INVALID_TYPE',
        initialQuantity: 'not-a-number',
        purchaseWeight: -100, // Valor negativo
        pricePerArroba: 280,
        carcassYield: 150 // Acima de 100%
      };

      const response = await request(app)
        .post('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    afterAll(async () => {
      if (createdPurchaseId) {
        await prisma.cattlePurchase.delete({ where: { id: createdPurchaseId } }).catch(() => {});
      }
    });
  });

  describe('GET /api/v1/cattle-purchases', () => {
    beforeAll(async () => {
      // Criar algumas compras para teste
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/cattle-purchases')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            vendorId: testVendorId,
            payerAccountId: testAccountId,
            purchaseDate: new Date().toISOString(),
            animalType: 'MALE',
            initialQuantity: 50 + i * 10,
            purchaseWeight: 15000 + i * 1000,
            pricePerArroba: 280,
            carcassYield: 50
          });
      }
    });

    it('deve listar compras com paginação', async () => {
      const response = await request(app)
        .get('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('deve filtrar por status', async () => {
      const response = await request(app)
        .get('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'CONFIRMED' })
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.forEach((purchase: any) => {
        expect(purchase.status).toBe('CONFIRMED');
      });
    });

    it('deve filtrar por período', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app)
        .get('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.forEach((purchase: any) => {
        const purchaseDate = new Date(purchase.purchaseDate);
        expect(purchaseDate >= startDate).toBe(true);
        expect(purchaseDate <= endDate).toBe(true);
      });
    });

    it('deve ordenar resultados', async () => {
      const response = await request(app)
        .get('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ sortBy: 'purchaseDate', order: 'desc' })
        .expect(200);

      expect(response.body.status).toBe('success');

      // Verificar ordenação
      for (let i = 1; i < response.body.data.length; i++) {
        const date1 = new Date(response.body.data[i - 1].purchaseDate);
        const date2 = new Date(response.body.data[i].purchaseDate);
        expect(date1 >= date2).toBe(true);
      }
    });
  });

  describe('GET /api/v1/cattle-purchases/:id', () => {
    let purchaseId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendorId: testVendorId,
          payerAccountId: testAccountId,
          purchaseDate: new Date().toISOString(),
          animalType: 'MALE',
          initialQuantity: 75,
          purchaseWeight: 22500,
          pricePerArroba: 285,
          carcassYield: 52
        });

      purchaseId = response.body.data.id;
    });

    it('deve retornar detalhes de uma compra específica', async () => {
      const response = await request(app)
        .get(`/api/v1/cattle-purchases/${purchaseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(purchaseId);
      expect(response.body.data.vendor).toBeDefined();
      expect(response.body.data.payerAccount).toBeDefined();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const fakeId = 'non-existent-id';

      const response = await request(app)
        .get(`/api/v1/cattle-purchases/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not found');
    });

    afterAll(async () => {
      if (purchaseId) {
        await prisma.cattlePurchase.delete({ where: { id: purchaseId } }).catch(() => {});
      }
    });
  });

  describe('PUT /api/v1/cattle-purchases/:id', () => {
    let purchaseId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendorId: testVendorId,
          payerAccountId: testAccountId,
          purchaseDate: new Date().toISOString(),
          animalType: 'MALE',
          initialQuantity: 60,
          purchaseWeight: 18000,
          pricePerArroba: 275,
          carcassYield: 51
        });

      purchaseId = response.body.data.id;
    });

    it('deve atualizar dados da compra', async () => {
      const updateData = {
        currentQuantity: 58, // 2 mortes
        notes: 'Atualização de teste'
      };

      const response = await request(app)
        .put(`/api/v1/cattle-purchases/${purchaseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.currentQuantity).toBe(58);
      expect(response.body.data.notes).toBe('Atualização de teste');
    });

    it('não deve permitir valores inválidos na atualização', async () => {
      const invalidUpdate = {
        currentQuantity: -10 // Quantidade negativa
      };

      const response = await request(app)
        .put(`/api/v1/cattle-purchases/${purchaseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    afterAll(async () => {
      if (purchaseId) {
        await prisma.cattlePurchase.delete({ where: { id: purchaseId } }).catch(() => {});
      }
    });
  });

  describe('DELETE /api/v1/cattle-purchases/:id', () => {
    let purchaseId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendorId: testVendorId,
          payerAccountId: testAccountId,
          purchaseDate: new Date().toISOString(),
          animalType: 'FEMALE',
          initialQuantity: 40,
          purchaseWeight: 11000,
          pricePerArroba: 270,
          carcassYield: 48
        });

      purchaseId = response.body.data.id;
    });

    it('deve deletar uma compra', async () => {
      await request(app)
        .delete(`/api/v1/cattle-purchases/${purchaseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verificar que foi deletado
      await request(app)
        .get(`/api/v1/cattle-purchases/${purchaseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('deve retornar 404 ao tentar deletar ID inexistente', async () => {
      const fakeId = 'non-existent-id';

      await request(app)
        .delete(`/api/v1/cattle-purchases/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Validação de Permissões', () => {
    let userToken: string;

    beforeAll(async () => {
      // Criar usuário comum (não admin)
      const userData = {
        email: `user-test-${Date.now()}@test.com`,
        password: 'Test123@',
        name: 'Regular User',
        role: 'USER'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      userToken = response.body.data.token;
    });

    it('deve permitir leitura para usuários comuns', async () => {
      await request(app)
        .get('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('pode restringir criação para admins', async () => {
      // Dependendo das regras de negócio, pode retornar 403
      const purchaseData = {
        vendorId: testVendorId,
        payerAccountId: testAccountId,
        purchaseDate: new Date().toISOString(),
        animalType: 'MALE',
        initialQuantity: 30,
        purchaseWeight: 9000,
        pricePerArroba: 280,
        carcassYield: 50
      };

      // Se houver restrição, esperar 403
      // Se não houver, esperar 201
      const response = await request(app)
        .post('/api/v1/cattle-purchases')
        .set('Authorization', `Bearer ${userToken}`)
        .send(purchaseData);

      expect([201, 403]).toContain(response.status);
    });
  });
});
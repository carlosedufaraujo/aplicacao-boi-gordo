import request from 'supertest';
import { createApp } from '@/app';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

describe('Report Routes', () => {
  let app: any;
  let authToken: string;
  let userToken: string;

  beforeAll(() => {
    app = createApp();
    
    // Criar tokens de teste
    authToken = jwt.sign(
      { userId: 'admin-id', email: 'admin@test.com', role: 'ADMIN' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { userId: 'user-id', email: 'user@test.com', role: 'USER' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('Autenticação', () => {
    it('deve retornar 401 sem token', async () => {
      const response = await request(app)
        .get('/api/v1/reports/pen-occupancy')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Token');
    });

    it('deve retornar 401 com token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/reports/pen-occupancy')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/v1/reports/pen-occupancy', () => {
    it('deve retornar dados de ocupação com sucesso', async () => {
      const response = await request(app)
        .get('/api/v1/reports/pen-occupancy')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.headers).toHaveProperty('x-cache');
    });

    it('deve usar cache na segunda requisição', async () => {
      // Primeira requisição - MISS
      const response1 = await request(app)
        .get('/api/v1/reports/pen-occupancy')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response1.headers['x-cache']).toBe('MISS');

      // Segunda requisição - HIT
      const response2 = await request(app)
        .get('/api/v1/reports/pen-occupancy')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response2.headers['x-cache']).toBe('HIT');
      expect(response2.body).toEqual(response1.body);
    });
  });

  describe('GET /api/v1/reports/lot-performance', () => {
    it('deve aceitar parâmetro lotId opcional', async () => {
      const response = await request(app)
        .get('/api/v1/reports/lot-performance')
        .query({ lotId: 'test-lot-id' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('deve retornar todos os lotes sem lotId', async () => {
      const response = await request(app)
        .get('/api/v1/reports/lot-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('lots');
      expect(response.body.data).toHaveProperty('summary');
    });
  });

  describe('GET /api/v1/reports/dre', () => {
    it('deve validar parâmetros obrigatórios', async () => {
      const response = await request(app)
        .get('/api/v1/reports/dre')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('validation');
    });

    it('deve aceitar período válido', async () => {
      const response = await request(app)
        .get('/api/v1/reports/dre')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  describe('POST /api/v1/reports/dre-comparison', () => {
    it('deve requerer role MANAGER ou ADMIN', async () => {
      const response = await request(app)
        .post('/api/v1/reports/dre-comparison')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          entities: [{ type: 'LOT', id: '1' }],
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .expect(403);

      expect(response.body.message).toContain('autorização');
    });

    it('deve aceitar requisição de ADMIN', async () => {
      const response = await request(app)
        .post('/api/v1/reports/dre-comparison')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entities: [
            { type: 'LOT', id: '1' },
            { type: 'LOT', id: '2' }
          ],
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  describe('Cache Headers', () => {
    it('deve incluir TTL no header quando cacheado', async () => {
      // Primeira requisição para popular cache
      await request(app)
        .get('/api/v1/reports/pen-occupancy')
        .set('Authorization', `Bearer ${authToken}`);

      // Segunda requisição deve ter TTL
      const response = await request(app)
        .get('/api/v1/reports/pen-occupancy')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers).toHaveProperty('x-cache-ttl');
      expect(parseInt(response.headers['x-cache-ttl'])).toBeGreaterThan(0);
    });
  });
});
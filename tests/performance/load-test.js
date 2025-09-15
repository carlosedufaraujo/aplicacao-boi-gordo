/**
 * Teste de Performance e Carga
 * Utiliza K6 para simular carga no sistema
 *
 * Para executar: k6 run tests/performance/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');

// Configuração do teste
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp-up para 10 usuários
    { duration: '1m', target: 10 },    // Mantém 10 usuários por 1 min
    { duration: '30s', target: 50 },   // Aumenta para 50 usuários
    { duration: '2m', target: 50 },    // Mantém 50 usuários por 2 min
    { duration: '30s', target: 100 },  // Aumenta para 100 usuários
    { duration: '3m', target: 100 },   // Mantém 100 usuários por 3 min
    { duration: '1m', target: 0 },     // Ramp-down para 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    'errors': ['rate<0.1'],                            // Taxa de erro < 10%
    'http_req_failed': ['rate<0.1'],                   // Falhas < 10%
  },
};

const BASE_URL = 'http://localhost:3001/api/v1';
let authToken = null;

// Setup - executado uma vez antes do teste
export function setup() {
  // Login para obter token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'admin@boigordo.com',
    password: 'Admin123@'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (loginRes.status === 200) {
    const data = JSON.parse(loginRes.body);
    return { token: data.token || data.data.token };
  }

  console.error('Falha no login:', loginRes.status);
  return { token: null };
}

// Cenário principal
export default function(data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': data.token ? `Bearer ${data.token}` : ''
    }
  };

  // Cenário 1: Listar compras de gado
  const listPurchases = http.get(`${BASE_URL}/cattle-purchases?page=1&limit=10`, params);
  check(listPurchases, {
    'Lista compras - status 200': (r) => r.status === 200,
    'Lista compras - resposta rápida': (r) => r.timings.duration < 300,
    'Lista compras - tem dados': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data);
      } catch {
        return false;
      }
    }
  });
  errorRate.add(listPurchases.status !== 200);

  sleep(1); // Simula tempo entre ações do usuário

  // Cenário 2: Buscar estatísticas
  const getStats = http.get(`${BASE_URL}/cattle-purchases/statistics`, params);
  check(getStats, {
    'Estatísticas - status 200': (r) => r.status === 200,
    'Estatísticas - resposta rápida': (r) => r.timings.duration < 500,
  });
  errorRate.add(getStats.status !== 200);

  sleep(0.5);

  // Cenário 3: Criar nova compra (10% dos usuários)
  if (Math.random() < 0.1) {
    const newPurchase = {
      vendorId: 'test-vendor-id',
      payerAccountId: 'test-account-id',
      purchaseDate: new Date().toISOString(),
      animalType: 'MALE',
      initialQuantity: Math.floor(Math.random() * 100) + 50,
      purchaseWeight: Math.floor(Math.random() * 10000) + 10000,
      pricePerArroba: 280 + Math.random() * 20,
      carcassYield: 48 + Math.random() * 6
    };

    const createRes = http.post(
      `${BASE_URL}/cattle-purchases`,
      JSON.stringify(newPurchase),
      params
    );

    check(createRes, {
      'Criar compra - sucesso': (r) => [200, 201].includes(r.status),
      'Criar compra - resposta rápida': (r) => r.timings.duration < 1000,
    });
    errorRate.add(![200, 201].includes(createRes.status));
  }

  sleep(2);

  // Cenário 4: Buscar detalhes de compra específica
  const detailsRes = http.get(`${BASE_URL}/cattle-purchases/random-id`, params);
  check(detailsRes, {
    'Detalhes - resposta válida': (r) => [200, 404].includes(r.status),
    'Detalhes - resposta rápida': (r) => r.timings.duration < 200,
  });

  sleep(1);

  // Cenário 5: Listar parceiros
  const partnersRes = http.get(`${BASE_URL}/partners?type=VENDOR`, params);
  check(partnersRes, {
    'Parceiros - status 200': (r) => r.status === 200,
    'Parceiros - resposta rápida': (r) => r.timings.duration < 250,
  });
  errorRate.add(partnersRes.status !== 200);

  sleep(0.5);

  // Cenário 6: Dashboard (requisição pesada)
  const dashboardRes = http.get(`${BASE_URL}/dashboard/overview`, params);
  check(dashboardRes, {
    'Dashboard - status 200': (r) => r.status === 200,
    'Dashboard - resposta aceitável': (r) => r.timings.duration < 2000,
  });
  errorRate.add(dashboardRes.status !== 200);

  sleep(3);
}

// Teardown - executado uma vez após o teste
export function teardown(data) {
  console.log('Teste de carga finalizado');
}

// Função auxiliar para gerar dados aleatórios
function generateRandomLot() {
  const types = ['MALE', 'FEMALE', 'MIXED'];
  return {
    animalType: types[Math.floor(Math.random() * types.length)],
    initialQuantity: Math.floor(Math.random() * 200) + 50,
    purchaseWeight: Math.floor(Math.random() * 30000) + 10000,
    pricePerArroba: 250 + Math.random() * 100,
    carcassYield: 45 + Math.random() * 10,
  };
}

// Cenário de stress test (descomente para usar)
// export const stressOptions = {
//   stages: [
//     { duration: '2m', target: 100 },  // Ramp-up normal
//     { duration: '5m', target: 100 },  // Mantém carga
//     { duration: '2m', target: 200 },  // Dobra a carga
//     { duration: '5m', target: 200 },  // Mantém carga alta
//     { duration: '2m', target: 300 },  // Aumenta mais
//     { duration: '5m', target: 300 },  // Mantém carga muito alta
//     { duration: '10m', target: 0 },   // Ramp-down
//   ],
//   thresholds: {
//     'http_req_duration': ['p(95)<1000', 'p(99)<3000'],
//     'errors': ['rate<0.2'],
//   },
// };
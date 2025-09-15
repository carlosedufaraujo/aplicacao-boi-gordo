/**
 * Testes de API - Aplicação Boi Gordo
 * Testes automatizados para endpoints da API
 */

const API_BASE_URL = 'http://localhost:3001/api/v1';
let authToken = '';

// Função auxiliar para fazer requisições
async function apiRequest(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      data: result
    };
  } catch (error) {
    return {
      status: 500,
      ok: false,
      error: error.message
    };
  }
}

// Suite de Testes
const apiTests = {
  // 1. Teste de Autenticação
  async testAuthentication() {
    console.log('\n🔐 Testando Autenticação...');

    const loginData = {
      email: 'admin@boigordo.com',
      password: 'Admin123@'
    };

    const response = await apiRequest('POST', '/auth/login', loginData);

    if (response.ok && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login realizado com sucesso');
      return true;
    } else {
      console.log('❌ Falha no login:', response.data.message);
      return false;
    }
  },

  // 2. Teste de Listagem de Lotes
  async testGetLots() {
    console.log('\n📦 Testando listagem de lotes...');

    const response = await apiRequest('GET', '/lots', null, authToken);

    if (response.ok && Array.isArray(response.data)) {
      console.log(`✅ Listagem OK - ${response.data.length} lotes encontrados`);
      return true;
    } else {
      console.log('❌ Falha na listagem:', response.error);
      return false;
    }
  },

  // 3. Teste de Criação de Lote
  async testCreateLot() {
    console.log('\n➕ Testando criação de lote...');

    const newLot = {
      lotCode: `LOT-TEST-${Date.now()}`,
      vendorId: 1,
      initialQuantity: 50,
      purchaseWeight: 15000,
      pricePerArroba: 280.00,
      freightCost: 2500.00,
      commission: 1500.00,
      purchaseDate: new Date().toISOString(),
      paymentType: 'INSTALLMENT'
    };

    const response = await apiRequest('POST', '/lots', newLot, authToken);

    if (response.ok && response.data.id) {
      console.log(`✅ Lote criado: ${response.data.lotCode}`);
      return response.data.id;
    } else {
      console.log('❌ Falha na criação:', response.data.message);
      return false;
    }
  },

  // 4. Teste de Dashboard
  async testDashboard() {
    console.log('\n📊 Testando endpoint do dashboard...');

    const response = await apiRequest('GET', '/dashboard/summary', null, authToken);

    if (response.ok) {
      console.log('✅ Dashboard OK');
      console.log(`   • Total de lotes: ${response.data.totalLots || 0}`);
      console.log(`   • Total de animais: ${response.data.totalAnimals || 0}`);
      console.log(`   • Valor investido: R$ ${response.data.totalInvested || 0}`);
      return true;
    } else {
      console.log('❌ Falha no dashboard:', response.error);
      return false;
    }
  },

  // 5. Teste de Centro Financeiro
  async testFinancialCenter() {
    console.log('\n💰 Testando centro financeiro...');

    const response = await apiRequest('GET', '/financial/summary', null, authToken);

    if (response.ok) {
      console.log('✅ Centro Financeiro OK');
      console.log(`   • Receitas: R$ ${response.data.totalRevenue || 0}`);
      console.log(`   • Despesas: R$ ${response.data.totalExpenses || 0}`);
      console.log(`   • Saldo: R$ ${response.data.balance || 0}`);
      return true;
    } else {
      console.log('❌ Falha no centro financeiro:', response.error);
      return false;
    }
  },

  // 6. Teste de Health Check
  async testHealthCheck() {
    console.log('\n🏥 Testando health check...');

    const response = await apiRequest('GET', '/health', null, null);

    if (response.ok && response.data.status === 'ok') {
      console.log('✅ API está saudável');
      console.log(`   • Uptime: ${response.data.uptime || 'N/A'}`);
      console.log(`   • Database: ${response.data.database || 'N/A'}`);
      return true;
    } else {
      console.log('❌ API com problemas:', response.error);
      return false;
    }
  },

  // 7. Teste de Performance
  async testPerformance() {
    console.log('\n⚡ Testando performance...');

    const startTime = Date.now();
    const promises = [];

    // Fazer 10 requisições paralelas
    for (let i = 0; i < 10; i++) {
      promises.push(apiRequest('GET', '/lots', null, authToken));
    }

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`✅ 10 requisições em ${duration}ms`);
    console.log(`   • Média: ${(duration / 10).toFixed(2)}ms por requisição`);

    return duration < 5000; // Deve completar em menos de 5 segundos
  }
};

// Executar todos os testes
async function runApiTests() {
  console.log('🚀 INICIANDO TESTES DE API - BOI GORDO');
  console.log('=' .repeat(50));

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Lista de testes a executar
  const testList = [
    'testHealthCheck',
    'testAuthentication',
    'testGetLots',
    'testCreateLot',
    'testDashboard',
    'testFinancialCenter',
    'testPerformance'
  ];

  for (const testName of testList) {
    try {
      const result = await apiTests[testName]();

      if (result) {
        results.passed++;
        results.tests.push({ name: testName, status: 'PASSED' });
      } else {
        results.failed++;
        results.tests.push({ name: testName, status: 'FAILED' });
      }
    } catch (error) {
      console.log(`❌ Erro no teste ${testName}:`, error.message);
      results.failed++;
      results.tests.push({ name: testName, status: 'ERROR', error: error.message });
    }
  }

  // Relatório final
  console.log('\n' + '=' .repeat(50));
  console.log('📊 RELATÓRIO FINAL');
  console.log('=' .repeat(50));
  console.log(`✅ Passou: ${results.passed}`);
  console.log(`❌ Falhou: ${results.failed}`);
  console.log(`📈 Taxa de sucesso: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  // Salvar resultados
  const fs = require('fs');
  const reportPath = `./tests/reports/api-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Relatório salvo em: ${reportPath}`);

  process.exit(results.failed > 0 ? 1 : 0);
}

// Executar se chamado diretamente
if (require.main === module) {
  runApiTests().catch(console.error);
}

module.exports = { apiTests, runApiTests };
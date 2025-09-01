const axios = require('axios');

const API_URL = 'http://localhost:3333/api/v1';

async function testBasicEndpoints() {
  console.log('🧪 Testando endpoints básicos do sistema\n');
  console.log('='.repeat(60));
  
  const endpoints = [
    { method: 'GET', path: '/health', name: 'Health Check' },
    { method: 'GET', path: '/frontend-data', name: 'Frontend Data' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📍 Testando ${endpoint.name} (${endpoint.method} ${endpoint.path})...`);
      
      const response = await axios({
        method: endpoint.method,
        url: `${API_URL}${endpoint.path}`,
        validateStatus: () => true // Aceita qualquer status
      });
      
      if (response.status < 400) {
        console.log(`✅ Status: ${response.status} - OK`);
        if (response.data) {
          console.log(`   Dados recebidos: ${JSON.stringify(Object.keys(response.data)).slice(0, 100)}...`);
        }
      } else {
        console.log(`⚠️ Status: ${response.status} - ${response.data?.message || 'Erro'}`);
      }
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Teste básico concluído!');
}

testBasicEndpoints().catch(console.error);
const axios = require('axios');

async function testCyclesEndpoint() {
  try {
    console.log('🔍 Testando endpoint /api/v1/cycles...\n');
    
    // Primeiro fazer login para pegar o token
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@boicontrol.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso!\n');
    
    // Testar GET /cycles
    console.log('2️⃣ Testando GET /api/v1/cycles...');
    try {
      const cyclesResponse = await axios.get('http://localhost:3001/api/v1/cycles', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✅ Endpoint /cycles funcionando!');
      console.log('📊 Resposta:', JSON.stringify(cyclesResponse.data, null, 2));
      
      if (cyclesResponse.data.data) {
        const items = Array.isArray(cyclesResponse.data.data) 
          ? cyclesResponse.data.data 
          : cyclesResponse.data.data.items || [];
        
        console.log(`\n📋 Total de ciclos: ${items.length}`);
        items.forEach(cycle => {
          console.log(`  - ${cycle.name} (${cycle.status})`);
        });
      }
    } catch (error) {
      console.error('❌ Erro no endpoint /cycles:', error.response?.status, error.response?.data || error.message);
    }
    
    // Testar GET /cycles/stats
    console.log('\n3️⃣ Testando GET /api/v1/cycles/stats...');
    try {
      const statsResponse = await axios.get('http://localhost:3001/api/v1/cycles/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✅ Endpoint /cycles/stats funcionando!');
      console.log('📊 Stats:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Erro no endpoint /cycles/stats:', error.response?.status, error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Backend não está rodando na porta 3001');
      console.log('💡 Execute: PORT=3001 npm run dev');
    }
  }
}

// Aguardar um pouco para o servidor iniciar
console.log('⏳ Aguardando servidor iniciar...');
setTimeout(testCyclesEndpoint, 3000);
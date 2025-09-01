import axios from 'axios';

const API_URL = 'http://localhost:3001/api/v1';

async function testAPI() {
  try {
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@boicontrol.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login OK, token:', token ? 'recebido' : 'não recebido');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Testar diretamente o endpoint
    console.log('\n📋 Fazendo requisição GET para /cattle-purchases...');
    try {
      const response = await axios.get(`${API_URL}/cattle-purchases`, { headers });
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Erro na requisição:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testAPI();
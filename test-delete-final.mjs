import axios from 'axios';

const API_URL = 'http://localhost:3001/api/v1';

async function testDeleteFinal() {
  try {
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@boicontrol.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login OK');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // ID da compra recém criada
    const purchaseId = 'cmf1fwrd50003130y2guipgya';
    
    console.log(`\n🗑️ Excluindo compra ID: ${purchaseId}`);
    
    try {
      const deleteResponse = await axios.delete(`${API_URL}/cattle-purchases/${purchaseId}`, { headers });
      
      console.log('✅ Resposta do servidor:');
      console.log('   Status HTTP:', deleteResponse.status);
      console.log('   Dados:', JSON.stringify(deleteResponse.data, null, 2));
      
      // Verificar se foi realmente excluído
      console.log('\n🔍 Verificando se foi excluído...');
      try {
        await axios.get(`${API_URL}/cattle-purchases/${purchaseId}`, { headers });
        console.log('❌ ERRO: Compra ainda existe!');
      } catch (err) {
        if (err.response?.status === 404) {
          console.log('✅ Confirmado: Compra foi excluída (404)');
        } else {
          console.log('❓ Erro ao verificar:', err.response?.status);
        }
      }
      
    } catch (deleteError) {
      console.error('❌ Erro ao excluir:');
      console.error('   Status:', deleteError.response?.status);
      console.error('   Mensagem:', deleteError.response?.data?.message || deleteError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testDeleteFinal();
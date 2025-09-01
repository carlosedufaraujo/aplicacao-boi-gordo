import axios from 'axios';

const API_URL = 'http://localhost:3001/api/v1';

// ID específico que estava tentando excluir no erro
const PURCHASE_ID = 'cmf0zjs910009clx9dtfbhhsz';

async function testSpecificDelete() {
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
    
    // Verificar se a compra existe
    console.log(`\n📋 Buscando compra específica: ${PURCHASE_ID}`);
    try {
      const getResponse = await axios.get(`${API_URL}/cattle-purchases/${PURCHASE_ID}`, { headers });
      console.log('✅ Compra encontrada:');
      console.log(`   - Código: ${getResponse.data.lotCode}`);
      console.log(`   - Status: ${getResponse.data.status}`);
      console.log(`   - Stage: ${getResponse.data.stage}`);
      console.log(`   - Quantidade: ${getResponse.data.currentQuantity}`);
      
      // Verificar se pode ser excluída
      const canDelete = getResponse.data.status !== 'ACTIVE' && 
                       getResponse.data.stage !== 'active' && 
                       getResponse.data.stage !== 'confined';
      
      console.log(`\n🔍 Pode excluir? ${canDelete ? 'SIM' : 'NÃO'}`);
      
      if (!canDelete) {
        console.log('⚠️ Esta compra não pode ser excluída pois está ACTIVE ou confinada');
        return;
      }
      
      // Tentar excluir
      console.log('\n🗑️ Tentando excluir...');
      const deleteResponse = await axios.delete(`${API_URL}/cattle-purchases/${PURCHASE_ID}`, { headers });
      console.log('✅ Excluído com sucesso!');
      console.log('Response:', deleteResponse.data);
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Compra não encontrada (404)');
        console.log('   Esta compra pode já ter sido excluída ou o ID está incorreto');
      } else {
        console.error('❌ Erro:', error.response?.status, error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
  }
}

testSpecificDelete();
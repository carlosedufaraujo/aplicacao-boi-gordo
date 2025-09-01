import axios from 'axios';

const API_URL = 'http://localhost:3001/api/v1';

async function testDelete() {
  try {
    // Usar as credenciais corretas
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@boicontrol.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Buscar compras
    console.log('\n📋 Buscando compras...');
    const purchasesResponse = await axios.get(`${API_URL}/cattle-purchases`, { headers });
    const purchases = purchasesResponse.data.items || [];
    
    console.log(`📊 ${purchases.length} compras encontradas`);
    
    // Listar compras com seus status
    purchases.forEach(p => {
      console.log(`\n📦 Lote ${p.lotCode}:`);
      console.log(`   - ID: ${p.id}`);
      console.log(`   - Status: ${p.status}`);
      console.log(`   - Stage: ${p.stage || 'N/A'}`);
      console.log(`   - Pode excluir: ${p.status !== 'ACTIVE' && p.stage !== 'active' && p.stage !== 'confined' ? 'SIM' : 'NÃO'}`);
    });
    
    // Encontrar uma compra que pode ser excluída
    const deletable = purchases.find(p => 
      p.status !== 'ACTIVE' && 
      p.stage !== 'active' && 
      p.stage !== 'confined'
    );
    
    if (!deletable) {
      console.log('\n⚠️ Nenhuma compra pode ser excluída no momento.');
      console.log('   Compras ACTIVE, active ou confined não podem ser excluídas.');
      return;
    }
    
    console.log(`\n🗑️ Excluindo: ${deletable.lotCode} (ID: ${deletable.id})`);
    
    try {
      const deleteResponse = await axios.delete(`${API_URL}/cattle-purchases/${deletable.id}`, { headers });
      console.log('✅ Excluído com sucesso!');
      console.log('   Resposta:', deleteResponse.data);
    } catch (deleteError) {
      console.error('❌ Erro ao excluir:');
      console.error('   Mensagem:', deleteError.response?.data?.message || deleteError.message);
      if (deleteError.response?.data?.stack) {
        console.error('   Stack:', deleteError.response.data.stack);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testDelete();
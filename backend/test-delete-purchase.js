const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

async function testDeletePurchase() {
  try {
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@boicontrol.com',
      password: 'Admin@123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // Configurar headers com token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Buscar compras existentes
    console.log('\n📋 Buscando compras existentes...');
    const purchasesResponse = await axios.get(`${API_URL}/cattle-purchases`, { headers });
    const purchases = purchasesResponse.data.data || purchasesResponse.data;
    
    if (!purchases || purchases.length === 0) {
      console.log('❌ Nenhuma compra encontrada');
      return;
    }
    
    console.log(`📊 ${purchases.length} compras encontradas`);
    
    // Mostrar detalhes das compras
    purchases.forEach(p => {
      console.log(`\n📦 Lote ${p.lotCode}:`);
      console.log(`   - ID: ${p.id}`);
      console.log(`   - Status: ${p.status}`);
      console.log(`   - Stage: ${p.stage || 'N/A'}`);
      console.log(`   - Quantidade: ${p.quantity} cabeças`);
      console.log(`   - Fornecedor: ${p.supplier}`);
    });
    
    // Tentar deletar uma compra que não esteja ativa
    const purchaseToDelete = purchases.find(p => p.status !== 'ACTIVE' && p.stage !== 'active' && p.stage !== 'confined');
    
    if (!purchaseToDelete) {
      console.log('\n⚠️ Todas as compras estão ativas ou confinadas. Não é possível excluir.');
      
      // Mostrar compras que poderiam ser excluídas se o status fosse alterado
      const activePurchases = purchases.filter(p => p.status === 'ACTIVE' || p.stage === 'active' || p.stage === 'confined');
      if (activePurchases.length > 0) {
        console.log('\n📝 Compras que não podem ser excluídas por estarem ativas/confinadas:');
        activePurchases.forEach(p => {
          console.log(`   - ${p.lotCode} (Status: ${p.status}, Stage: ${p.stage || 'N/A'})`);
        });
      }
      return;
    }
    
    console.log(`\n🗑️ Tentando excluir compra: ${purchaseToDelete.lotCode} (ID: ${purchaseToDelete.id})`);
    
    try {
      const deleteResponse = await axios.delete(`${API_URL}/cattle-purchases/${purchaseToDelete.id}`, { headers });
      console.log('✅ Compra excluída com sucesso!');
      console.log('Response:', deleteResponse.status);
    } catch (deleteError) {
      console.error('❌ Erro ao excluir compra:');
      console.error('   Status:', deleteError.response?.status);
      console.error('   Mensagem:', deleteError.response?.data?.message || deleteError.message);
      console.error('   Detalhes:', deleteError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Executar teste
testDeletePurchase();
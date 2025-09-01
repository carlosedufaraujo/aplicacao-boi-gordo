import axios from 'axios';

const API_URL = 'http://localhost:3001/api/v1';

async function testCascadeDelete() {
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
    
    // Buscar compras
    console.log('\n📋 Buscando compras...');
    const purchasesResponse = await axios.get(`${API_URL}/cattle-purchases`, { headers });
    const purchases = purchasesResponse.data.items || [];
    
    console.log(`📊 ${purchases.length} compras encontradas`);
    
    // Encontrar um lote confinado (com dados relacionados)
    const confinedPurchase = purchases.find(p => 
      p.stage === 'confined' || 
      p.status === 'ACTIVE' ||
      (p.penAllocations && p.penAllocations.length > 0)
    );
    
    if (!confinedPurchase) {
      console.log('❌ Nenhum lote confinado/ativo encontrado para teste');
      
      // Listar todos os lotes
      console.log('\n📦 Lotes disponíveis:');
      purchases.forEach(p => {
        console.log(`   - ${p.lotCode}: Status=${p.status}, Stage=${p.stage}, Alocações=${p.penAllocations?.length || 0}`);
      });
      return;
    }
    
    console.log(`\n🎯 Lote selecionado para teste: ${confinedPurchase.lotCode}`);
    console.log(`   - ID: ${confinedPurchase.id}`);
    console.log(`   - Status: ${confinedPurchase.status}`);
    console.log(`   - Stage: ${confinedPurchase.stage}`);
    console.log(`   - Alocações em currais: ${confinedPurchase.penAllocations?.length || 0}`);
    console.log(`   - Quantidade: ${confinedPurchase.currentQuantity} animais`);
    
    console.log('\n⚠️  ATENÇÃO: Este lote tem dados relacionados que serão excluídos!');
    console.log('   - Alocações em currais');
    console.log('   - Registros de saúde');
    console.log('   - Registros de mortalidade');
    console.log('   - Despesas e receitas');
    console.log('   - Análises diversas');
    
    console.log('\n🗑️ Tentando excluir lote com dados relacionados...');
    
    try {
      const deleteResponse = await axios.delete(`${API_URL}/cattle-purchases/${confinedPurchase.id}`, { headers });
      console.log('✅ SUCESSO! Lote e todos os dados relacionados foram excluídos!');
      console.log('   Response:', deleteResponse.data);
      
      // Verificar se realmente foi excluído
      console.log('\n🔍 Verificando exclusão...');
      try {
        await axios.get(`${API_URL}/cattle-purchases/${confinedPurchase.id}`, { headers });
        console.log('❌ ERRO: Lote ainda existe!');
      } catch (err) {
        if (err.response?.status === 404) {
          console.log('✅ Confirmado: Lote não existe mais (404)');
        }
      }
      
    } catch (deleteError) {
      console.error('❌ Erro ao excluir:');
      console.error('   Status:', deleteError.response?.status);
      console.error('   Mensagem:', deleteError.response?.data?.message || deleteError.message);
      if (deleteError.response?.data?.error) {
        console.error('   Detalhes:', deleteError.response.data.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testCascadeDelete();
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testReception() {
  try {
    console.log('🔍 Testando recepção de LOT-2509002\n');
    
    // ID da compra LOT-2509002
    const purchaseId = 'cmf0y4hcu000gnxf1k9rkcizx';
    
    // Buscar detalhes da compra
    const purchaseRes = await axios.get(`${API_BASE}/cattle-purchases/${purchaseId}`);
    const purchase = purchaseRes.data.data;
    
    console.log('📦 Compra selecionada:');
    console.log(`  Código: ${purchase.lotCode}`);
    console.log(`  Stage: ${purchase.stage}`);
    console.log(`  Status: ${purchase.status}`);
    console.log(`  Quantidade: ${purchase.initialQuantity} animais`);
    console.log(`  Peso: ${purchase.purchaseWeight} kg`);
    
    // Buscar primeiro curral disponível
    const pensRes = await axios.get(`${API_BASE}/pens`);
    const pens = pensRes.data.data?.items || [];
    const availablePen = pens.find(pen => 
      (pen.status === 'AVAILABLE' || pen.status === 'ACTIVE') && 
      pen.currentOccupancy < pen.capacity
    );
    
    if (!availablePen) {
      console.log('❌ Nenhum curral disponível');
      return;
    }
    
    console.log(`\n🏠 Curral selecionado: ${availablePen.penNumber}`);
    console.log(`  Capacidade: ${availablePen.capacity}`);
    console.log(`  Ocupação: ${availablePen.currentOccupancy}`);
    
    // Preparar dados de recepção
    const receptionData = {
      receivedDate: new Date().toISOString(),
      receivedWeight: purchase.purchaseWeight * 0.98, // 2% de quebra
      actualQuantity: purchase.initialQuantity,
      receivedQuantity: purchase.initialQuantity,
      unloadingDate: new Date().toISOString(),
      observations: 'Teste de recepção LOT-2509002',
      penAllocations: [
        {
          penId: availablePen.id,
          quantity: Math.min(purchase.initialQuantity, availablePen.capacity - availablePen.currentOccupancy)
        }
      ]
    };
    
    console.log('\n📝 Registrando recepção...');
    
    try {
      const response = await axios.post(
        `${API_BASE}/cattle-purchases/${purchaseId}/reception`,
        receptionData
      );
      
      console.log('✅ Recepção registrada com sucesso!');
      console.log(`  Novo stage: ${response.data.data?.stage || 'N/A'}`);
      console.log(`  Mensagem: ${response.data.message}`);
      
    } catch (error) {
      console.error('❌ Erro ao registrar recepção:');
      if (error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Mensagem:', error.response.data?.message);
      } else {
        console.error('  Erro:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
testReception();
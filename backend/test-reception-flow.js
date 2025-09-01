const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testReceptionFlow() {
  try {
    console.log('🔍 Buscando compras...');
    
    // Buscar compras
    const purchasesRes = await axios.get(`${API_BASE}/cattle-purchases`);
    console.log(`📦 Total de compras: ${purchasesRes.data.total || purchasesRes.data.results || 0}`);
    
    const purchases = purchasesRes.data.items || purchasesRes.data.data || [];
    if (purchases.length === 0) {
      console.log('❌ Nenhuma compra encontrada');
      return;
    }
    
    // Pegar a primeira compra
    const purchase = purchases[0];
    console.log(`\n📋 Compra selecionada:`);
    console.log(`  ID: ${purchase.id}`);
    console.log(`  Código: ${purchase.lotCode}`);
    console.log(`  Stage: ${purchase.stage}`);
    console.log(`  Status: ${purchase.status}`);
    console.log(`  Quantidade inicial: ${purchase.initialQuantity}`);
    console.log(`  Peso compra: ${purchase.purchaseWeight} kg`);
    
    // Buscar currais disponíveis
    console.log('\n🏠 Buscando currais disponíveis...');
    const pensRes = await axios.get(`${API_BASE}/pens`);
    const pens = pensRes.data.data?.items || pensRes.data.items || [];
    const availablePens = pens.filter(pen => 
      (pen.status === 'AVAILABLE' || pen.status === 'ACTIVE') && 
      pen.currentOccupancy < pen.capacity
    );
    
    console.log(`  Currais disponíveis: ${availablePens.length}`);
    
    if (availablePens.length === 0) {
      console.log('❌ Nenhum curral disponível');
      return;
    }
    
    const selectedPen = availablePens[0];
    console.log(`  Curral selecionado: ${selectedPen.penNumber}`);
    console.log(`  Capacidade: ${selectedPen.capacity}`);
    console.log(`  Ocupação atual: ${selectedPen.currentOccupancy}`);
    
    // Verificar o stage da compra e decidir qual endpoint usar
    if (purchase.stage === 'received') {
      // Se já está recepcionado, alocar em currais
      console.log('\n📝 Alocando em currais (compra já recepcionada)...');
      
      const confinedData = {
        penAllocations: [
          {
            penId: selectedPen.id,
            quantity: Math.min(purchase.currentQuantity || purchase.initialQuantity, 
                              selectedPen.capacity - selectedPen.currentOccupancy)
          }
        ],
        notes: 'Alocação via script de teste'
      };
      
      console.log('  Payload:', JSON.stringify(confinedData, null, 2));
      
      try {
        const confinedRes = await axios.post(
          `${API_BASE}/cattle-purchases/${purchase.id}/confined`,
          confinedData
        );
        
        console.log('\n✅ Alocação realizada com sucesso!');
        console.log('  Resposta:', confinedRes.data.message);
        console.log('  Stage atualizado:', confinedRes.data.data.stage);
        
      } catch (error) {
        console.error('\n❌ Erro ao alocar em currais:');
        if (error.response) {
          console.error('  Status:', error.response.status);
          console.error('  Erro:', error.response.data);
        } else {
          console.error('  Erro:', error.message);
        }
      }
    } else {
      // Se não está recepcionado, registrar recepção
      console.log('\n📝 Registrando recepção...');
      
      const receptionData = {
        receivedDate: new Date().toISOString(),
        receivedWeight: purchase.purchaseWeight * 0.98, // 2% de quebra
        actualQuantity: purchase.initialQuantity,
        receivedQuantity: purchase.initialQuantity,
        unloadingDate: new Date().toISOString(),
        observations: 'Teste de recepção via script',
        penAllocations: [
          {
            penId: selectedPen.id,
            quantity: Math.min(purchase.initialQuantity, selectedPen.capacity - selectedPen.currentOccupancy)
          }
        ]
      };
      
      console.log('  Payload:', JSON.stringify(receptionData, null, 2));
      
      try {
        const receptionRes = await axios.post(
          `${API_BASE}/cattle-purchases/${purchase.id}/reception`,
          receptionData
        );
        
        console.log('\n✅ Recepção registrada com sucesso!');
        console.log('  Resposta:', receptionRes.data.message);
        console.log('  Stage atualizado:', receptionRes.data.data.stage);
        
      } catch (error) {
        console.error('\n❌ Erro ao registrar recepção:');
        if (error.response) {
          console.error('  Status:', error.response.status);
          console.error('  Erro:', error.response.data);
        } else {
          console.error('  Erro:', error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:');
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Erro:', error.response.data);
    } else {
      console.error('  Erro:', error.message);
    }
  }
}

testReceptionFlow();
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testFullFlow() {
  try {
    console.log('🔍 Testando fluxo completo de recepção/alocação\n');
    
    // 1. Buscar compras
    console.log('📦 Buscando compras...');
    const purchasesRes = await axios.get(`${API_BASE}/cattle-purchases`);
    const purchases = purchasesRes.data.items || [];
    
    if (purchases.length === 0) {
      console.log('❌ Nenhuma compra encontrada');
      return;
    }
    
    const purchase = purchases[0];
    console.log(`  Compra encontrada: ${purchase.lotCode}`);
    console.log(`  Stage atual: ${purchase.stage}`);
    console.log(`  Status atual: ${purchase.status}`);
    
    // 2. Buscar currais disponíveis
    console.log('\n🏠 Buscando currais...');
    const pensRes = await axios.get(`${API_BASE}/pens`);
    const pens = pensRes.data.data?.items || [];
    const availablePens = pens.filter(pen => 
      (pen.status === 'AVAILABLE' || pen.status === 'ACTIVE') && 
      pen.currentOccupancy < pen.capacity
    );
    
    if (availablePens.length === 0) {
      console.log('❌ Nenhum curral disponível');
      return;
    }
    
    console.log(`  ${availablePens.length} currais disponíveis`);
    const selectedPen = availablePens[0];
    console.log(`  Curral selecionado: ${selectedPen.penNumber}`);
    
    // 3. Decidir qual ação tomar baseado no stage
    console.log('\n🎯 Verificando ação necessária...');
    
    if (purchase.stage === 'confirmed' || purchase.stage === 'in_transit' || purchase.stage === 'CONFIRMED' || purchase.stage === 'IN_TRANSIT') {
      // Registrar recepção
      console.log('  Ação: Registrar recepção (compra ainda não recepcionada)');
      
      const receptionData = {
        receivedDate: new Date().toISOString(),
        receivedWeight: purchase.purchaseWeight * 0.98,
        actualQuantity: purchase.currentQuantity || purchase.initialQuantity,
        receivedQuantity: purchase.currentQuantity || purchase.initialQuantity,
        unloadingDate: new Date().toISOString(),
        observations: 'Teste de recepção via script',
        penAllocations: [
          {
            penId: selectedPen.id,
            quantity: Math.min(
              purchase.currentQuantity || purchase.initialQuantity,
              selectedPen.capacity - selectedPen.currentOccupancy
            )
          }
        ]
      };
      
      console.log('\n📝 Registrando recepção com alocação...');
      
      try {
        const response = await axios.post(
          `${API_BASE}/cattle-purchases/${purchase.id}/reception`,
          receptionData
        );
        console.log('✅ Recepção registrada com sucesso!');
        console.log(`  Novo stage: ${response.data.data?.stage || 'N/A'}`);
      } catch (error) {
        console.error('❌ Erro ao registrar recepção:', error.response?.data?.message || error.message);
      }
      
    } else if (purchase.stage === 'received' || purchase.stage === 'RECEIVED') {
      // Alocar em currais
      console.log('  Ação: Alocar em currais (compra já recepcionada)');
      
      const confinedData = {
        penAllocations: [
          {
            penId: selectedPen.id,
            quantity: Math.min(
              purchase.currentQuantity || purchase.initialQuantity,
              selectedPen.capacity - selectedPen.currentOccupancy
            )
          }
        ],
        notes: 'Alocação via script de teste'
      };
      
      console.log('\n📝 Alocando em currais...');
      
      try {
        const response = await axios.post(
          `${API_BASE}/cattle-purchases/${purchase.id}/confined`,
          confinedData
        );
        console.log('✅ Alocação realizada com sucesso!');
        console.log(`  Novo stage: ${response.data.data?.stage || 'N/A'}`);
      } catch (error) {
        console.error('❌ Erro ao alocar:', error.response?.data?.message || error.message);
      }
      
    } else if (purchase.stage === 'active' || purchase.stage === 'ACTIVE' || purchase.stage === 'confined') {
      console.log('  ℹ️ Compra já está confinada/ativa');
      console.log('  Nenhuma ação necessária');
    } else {
      console.log(`  ⚠️ Stage desconhecido: ${purchase.stage}`);
    }
    
    // 4. Verificar estado final
    console.log('\n🔄 Verificando estado final...');
    const finalRes = await axios.get(`${API_BASE}/cattle-purchases/${purchase.id}`);
    const finalPurchase = finalRes.data.data;
    
    console.log(`  Stage final: ${finalPurchase.stage}`);
    console.log(`  Status final: ${finalPurchase.status}`);
    console.log(`  Quantidade atual: ${finalPurchase.currentQuantity}`);
    
    if (finalPurchase.penAllocations && finalPurchase.penAllocations.length > 0) {
      console.log(`  Alocações de currais: ${finalPurchase.penAllocations.length}`);
      finalPurchase.penAllocations.forEach(alloc => {
        console.log(`    - Curral ${alloc.pen?.penNumber || alloc.penId}: ${alloc.quantity} animais`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('  Detalhes:', error.response.data);
    }
  }
}

// Executar teste
testFullFlow();
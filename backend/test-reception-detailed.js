const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testReceptionDetailed() {
  try {
    console.log('🔍 Teste detalhado de recepção e alocação\n');
    
    // 1. Buscar compras com stage confirmed ou in_transit
    console.log('📦 Buscando compras disponíveis para recepção...');
    const purchasesRes = await axios.get(`${API_BASE}/cattle-purchases`);
    const purchases = purchasesRes.data.items || [];
    
    const availableForReception = purchases.filter(p => 
      p.stage === 'confirmed' || 
      p.stage === 'in_transit' ||
      p.stage === 'CONFIRMED' || 
      p.stage === 'IN_TRANSIT'
    );
    
    console.log(`  Total de compras: ${purchases.length}`);
    console.log(`  Disponíveis para recepção: ${availableForReception.length}\n`);
    
    if (availableForReception.length === 0) {
      console.log('❌ Nenhuma compra disponível para recepção');
      return;
    }
    
    // Mostrar detalhes das compras disponíveis
    console.log('📋 Compras disponíveis:');
    availableForReception.forEach(p => {
      console.log(`  - ${p.lotCode}: stage=${p.stage}, status=${p.status}, ${p.initialQuantity} animais`);
    });
    
    // 2. Selecionar a primeira compra
    const purchase = availableForReception[0];
    console.log(`\n✅ Selecionada: ${purchase.lotCode}`);
    console.log(`  ID: ${purchase.id}`);
    console.log(`  Stage: ${purchase.stage}`);
    console.log(`  Status: ${purchase.status}`);
    console.log(`  Quantidade: ${purchase.initialQuantity || purchase.currentQuantity}`);
    console.log(`  Peso: ${purchase.purchaseWeight} kg`);
    
    // 3. Buscar currais disponíveis
    console.log('\n🏠 Buscando currais...');
    const pensRes = await axios.get(`${API_BASE}/pens`);
    const pens = pensRes.data.data?.items || [];
    const availablePens = pens.filter(pen => 
      (pen.status === 'AVAILABLE' || pen.status === 'ACTIVE') && 
      pen.currentOccupancy < pen.capacity
    );
    
    console.log(`  Total de currais: ${pens.length}`);
    console.log(`  Currais disponíveis: ${availablePens.length}`);
    
    if (availablePens.length === 0) {
      console.log('❌ Nenhum curral disponível');
      return;
    }
    
    const selectedPen = availablePens[0];
    console.log(`  Curral selecionado: ${selectedPen.penNumber}`);
    console.log(`  Capacidade: ${selectedPen.capacity}`);
    console.log(`  Ocupação atual: ${selectedPen.currentOccupancy}`);
    console.log(`  Espaço disponível: ${selectedPen.capacity - selectedPen.currentOccupancy}`);
    
    // 4. Preparar dados de recepção
    const quantity = purchase.currentQuantity || purchase.initialQuantity;
    const allocQuantity = Math.min(quantity, selectedPen.capacity - selectedPen.currentOccupancy);
    
    const receptionData = {
      receivedDate: new Date().toISOString(),
      receivedWeight: purchase.purchaseWeight * 0.98, // 2% de quebra
      actualQuantity: quantity,
      receivedQuantity: quantity,
      unloadingDate: new Date().toISOString(),
      observations: 'Teste detalhado de recepção',
      penAllocations: [
        {
          penId: selectedPen.id,
          quantity: allocQuantity
        }
      ]
    };
    
    console.log('\n📝 Dados de recepção:');
    console.log(JSON.stringify(receptionData, null, 2));
    
    // 5. Tentar registrar recepção
    console.log('\n🚀 Registrando recepção...');
    
    try {
      const response = await axios.post(
        `${API_BASE}/cattle-purchases/${purchase.id}/reception`,
        receptionData
      );
      
      console.log('✅ Recepção registrada com sucesso!');
      console.log(`  Novo stage: ${response.data.data?.stage || 'N/A'}`);
      console.log(`  Mensagem: ${response.data.message}`);
      
    } catch (error) {
      console.error('\n❌ Erro ao registrar recepção:');
      
      if (error.response) {
        console.error('  Status HTTP:', error.response.status);
        console.error('  Mensagem:', error.response.data?.message);
        console.error('  Stack:', error.response.data?.stack);
        
        // Se for erro de validação, mostrar detalhes
        if (error.response.data?.details) {
          console.error('  Detalhes da validação:');
          console.error(JSON.stringify(error.response.data.details, null, 2));
        }
      } else {
        console.error('  Erro:', error.message);
      }
      
      // Tentar buscar a compra novamente para ver o estado atual
      console.log('\n🔄 Verificando estado atual da compra...');
      try {
        const checkRes = await axios.get(`${API_BASE}/cattle-purchases/${purchase.id}`);
        const currentPurchase = checkRes.data.data;
        console.log(`  Stage atual: ${currentPurchase.stage}`);
        console.log(`  Status atual: ${currentPurchase.status}`);
        console.log(`  Tem recepção?: ${currentPurchase.receivedDate ? 'Sim' : 'Não'}`);
        console.log(`  Tem alocações?: ${currentPurchase.penAllocations?.length > 0 ? 'Sim' : 'Não'}`);
      } catch (e) {
        console.error('  Erro ao verificar estado:', e.message);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
    if (error.response) {
      console.error('  Detalhes:', error.response.data);
    }
  }
}

// Executar
testReceptionDetailed();
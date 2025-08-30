const axios = require('axios');

const API_URL = 'http://localhost:3333/api/v1';

async function testGMDPersistence() {
  console.log('🔍 Testando persistência de GMD...\n');
  
  try {
    // 1. Buscar um lote existente
    console.log('1. Buscando lotes existentes...');
    const lotsResponse = await axios.get(`${API_URL}/cattle-lots`);
    
    if (!lotsResponse.data.data || lotsResponse.data.data.data.length === 0) {
      console.log('❌ Nenhum lote encontrado. Crie um lote primeiro.');
      return;
    }
    
    const lot = lotsResponse.data.data.data[0];
    console.log(`✅ Lote encontrado: ${lot.lotNumber} (ID: ${lot.id})`);
    console.log(`   - Peso inicial: ${lot.entryWeight} kg`);
    console.log(`   - Quantidade: ${lot.entryQuantity} animais`);
    console.log(`   - GMD atual: ${lot.expectedGMD || 'Não definido'}`);
    console.log(`   - Peso alvo: ${lot.targetWeight || 'Não definido'}`);
    
    // 2. Atualizar GMD e peso alvo
    console.log('\n2. Atualizando GMD e peso alvo...');
    const gmdData = {
      expectedGMD: 1.5,
      targetWeight: 600
    };
    
    const updateResponse = await axios.patch(
      `${API_URL}/cattle-lots/${lot.id}/gmd`,
      gmdData
    );
    
    if (updateResponse.data.status === 'success') {
      console.log('✅ GMD atualizado com sucesso!');
      const updatedLot = updateResponse.data.data;
      console.log(`   - Novo GMD: ${updatedLot.expectedGMD} kg/dia`);
      console.log(`   - Novo peso alvo: ${updatedLot.targetWeight} kg`);
      
      if (updatedLot.estimatedSlaughterDate) {
        const slaughterDate = new Date(updatedLot.estimatedSlaughterDate);
        const today = new Date();
        const daysToSlaughter = Math.ceil((slaughterDate - today) / (1000 * 60 * 60 * 24));
        console.log(`   - Data estimada de abate: ${slaughterDate.toLocaleDateString('pt-BR')}`);
        console.log(`   - Dias até o abate: ${daysToSlaughter} dias`);
      }
    }
    
    // 3. Verificar persistência
    console.log('\n3. Verificando persistência dos dados...');
    const verifyResponse = await axios.get(`${API_URL}/cattle-lots/${lot.id}`);
    const verifiedLot = verifyResponse.data.data;
    
    if (verifiedLot.expectedGMD === gmdData.expectedGMD && 
        verifiedLot.targetWeight === gmdData.targetWeight) {
      console.log('✅ Dados persistidos corretamente!');
      console.log(`   - GMD persistido: ${verifiedLot.expectedGMD} kg/dia`);
      console.log(`   - Peso alvo persistido: ${verifiedLot.targetWeight} kg`);
      console.log(`   - Data de abate calculada: ${verifiedLot.estimatedSlaughterDate ? new Date(verifiedLot.estimatedSlaughterDate).toLocaleDateString('pt-BR') : 'N/A'}`);
    } else {
      console.log('❌ Erro na persistência dos dados');
    }
    
    // 4. Testar cálculos
    console.log('\n4. Verificando cálculos...');
    const currentAverageWeight = lot.entryWeight / lot.entryQuantity;
    const weightToGain = gmdData.targetWeight - currentAverageWeight;
    const calculatedDays = Math.ceil(weightToGain / gmdData.expectedGMD);
    
    console.log(`   - Peso médio atual: ${currentAverageWeight.toFixed(2)} kg`);
    console.log(`   - Peso a ganhar: ${weightToGain.toFixed(2)} kg`);
    console.log(`   - Dias calculados: ${calculatedDays} dias`);
    console.log(`   - Com GMD de ${gmdData.expectedGMD} kg/dia`);
    
    console.log('\n✅ Teste de persistência de GMD concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Executar o teste
testGMDPersistence();
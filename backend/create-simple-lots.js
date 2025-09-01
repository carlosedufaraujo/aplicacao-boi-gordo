const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function createSimpleLots() {
  console.log('🚀 Criando lotes simplificados para teste...\n');
  
  try {
    // Buscar vendors
    const vendorsRes = await axios.get(`${API_BASE}/partners`);
    const vendors = vendorsRes.data.data?.items || [];
    console.log(`✅ ${vendors.length} fornecedores encontrados\n`);
    
    // Buscar conta pagadora
    const payerRes = await axios.get(`${API_BASE}/payer-accounts`);
    const payers = payerRes.data.data?.items || [];
    const payerAccountId = payers[0]?.id;
    
    if (!payerAccountId) {
      console.log('❌ Nenhuma conta pagadora encontrada');
      return;
    }
    
    // Criar lotes simples para cada fornecedor recente
    const recentVendors = vendors.slice(-6);
    let created = 0;
    
    for (let i = 0; i < recentVendors.length; i++) {
      const vendor = recentVendors[i];
      
      // Dados simplificados variados para teste
      const quantities = [25, 40, 55, 70, 95, 110];
      const quantity = quantities[i];
      
      const lotData = {
        vendorId: vendor.id,
        payerAccountId: payerAccountId,
        purchaseDate: new Date().toISOString(),
        animalType: i % 2 === 0 ? 'MALE' : 'FEMALE',
        initialQuantity: quantity,
        purchaseWeight: quantity * 150, // 150kg por animal
        carcassYield: 52,
        pricePerArroba: 280,
        paymentType: 'CASH'
      };
      
      try {
        console.log(`📦 Criando lote para ${vendor.name}...`);
        console.log(`   Quantidade: ${quantity} animais`);
        
        const response = await axios.post(`${API_BASE}/cattle-purchases`, lotData);
        const purchase = response.data.data;
        
        console.log(`   ✅ Lote ${purchase.lotCode} criado!`);
        console.log(`   Status: ${purchase.stage || purchase.status}`);
        console.log('');
        
        created++;
      } catch (error) {
        console.log(`   ❌ Erro:`, error.response?.data?.message || error.message);
        if (error.response?.data?.details) {
          console.log(`   Detalhes:`, JSON.stringify(error.response.data.details, null, 2));
        }
        console.log('');
      }
    }
    
    console.log('═'.repeat(60));
    console.log(`✅ ${created} lotes criados com sucesso!\n`);
    
    if (created > 0) {
      console.log('📋 Sugestão de alocação nos currais disponíveis:\n');
      console.log('   Curral 01 (100 vagas) - Lote com 95 animais');
      console.log('   Curral 02 (100 vagas) - Lote com 70 animais');
      console.log('   Curral 03 (50 vagas)  - Lote com 40 animais');
      console.log('   Curral 04 (30 vagas)  - Lote com 25 animais');
      console.log('   Curral 05 (80 vagas)  - Lote com 55 animais');
      console.log('   Curral 07 (120 vagas) - Lote com 110 animais');
      console.log('');
      console.log('💡 Acesse a página de Compras para fazer a recepção e alocação!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createSimpleLots().catch(console.error);
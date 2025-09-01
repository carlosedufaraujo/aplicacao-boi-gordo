const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function validatePurchases() {
  try {
    console.log('🔍 Validando compras criadas...\n');
    
    // Buscar todas as compras
    const response = await axios.get(`${API_BASE}/cattle-purchases`);
    const purchases = response.data.items || [];
    
    console.log(`📊 Total de compras no sistema: ${purchases.length}\n`);
    
    // Mostrar detalhes de cada compra
    purchases.forEach(purchase => {
      console.log(`📦 Compra: ${purchase.lotCode}`);
      console.log(`  ID: ${purchase.id}`);
      console.log(`  Local: ${purchase.farm || purchase.location} - ${purchase.city}/${purchase.state}`);
      console.log(`  Fornecedor: ${purchase.vendor?.name || 'N/A'}`);
      console.log(`  Quantidade: ${purchase.initialQuantity} animais`);
      console.log(`  Peso total: ${purchase.purchaseWeight} kg`);
      console.log(`  Tipo: ${purchase.animalType}`);
      console.log(`  Stage: ${purchase.stage}`);
      console.log(`  Status: ${purchase.status}`);
      console.log(`  Data compra: ${new Date(purchase.purchaseDate).toLocaleDateString('pt-BR')}`);
      console.log(`  Valor: R$ ${(purchase.purchaseValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log('');
    });
    
    // Estatísticas gerais
    const totalAnimals = purchases.reduce((sum, p) => sum + p.initialQuantity, 0);
    const totalWeight = purchases.reduce((sum, p) => sum + p.purchaseWeight, 0);
    const totalValue = purchases.reduce((sum, p) => sum + (p.purchaseValue || 0), 0);
    
    const byStage = purchases.reduce((acc, p) => {
      acc[p.stage] = (acc[p.stage] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📈 Estatísticas Gerais:');
    console.log(`  Total de compras: ${purchases.length}`);
    console.log(`  Total de animais: ${totalAnimals}`);
    console.log(`  Peso total: ${totalWeight.toLocaleString('pt-BR')} kg`);
    console.log(`  Valor total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log('\n  Compras por estágio:');
    Object.entries(byStage).forEach(([stage, count]) => {
      console.log(`    ${stage}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao validar compras:', error.message);
    if (error.response) {
      console.error('  Detalhes:', error.response.data);
    }
  }
}

// Executar
validatePurchases();
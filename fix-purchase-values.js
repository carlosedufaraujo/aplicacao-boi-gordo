// Script para corrigir os valores de compra com o rendimento correto de 50%
import fetch from 'node-fetch';

async function fixPurchaseValues() {
  console.log('🔧 CORREÇÃO DOS VALORES DE COMPRA');
  console.log('==================================\n');
  
  try {
    // Buscar todas as compras
    const response = await fetch('http://localhost:3001/api/v1/cattle-purchases?limit=100');
    const data = await response.json();
    
    console.log(`📊 ${data.items.length} lotes encontrados\n`);
    
    let totalDiferenca = 0;
    const corrections = [];
    
    // Analisar cada lote
    for (const lote of data.items) {
      const rendimento = lote.carcassYield || 50;
      
      // Calcular valor correto com o rendimento atual
      const pesoCarcaca = (lote.purchaseWeight * rendimento) / 100;
      const arrobas = pesoCarcaca / 15;
      const valorCorreto = arrobas * lote.pricePerArroba;
      
      const diferenca = lote.purchaseValue - valorCorreto;
      const percentDiff = (diferenca / valorCorreto) * 100;
      
      if (Math.abs(diferenca) > 1) {
        corrections.push({
          id: lote.id,
          lotCode: lote.lotCode,
          valorAtual: lote.purchaseValue,
          valorCorreto: valorCorreto,
          diferenca: diferenca,
          percentual: percentDiff.toFixed(2)
        });
        
        totalDiferenca += diferenca;
        
        console.log(`❌ ${lote.lotCode}:`);
        console.log(`   Valor atual: R$ ${lote.purchaseValue.toFixed(2)}`);
        console.log(`   Valor correto: R$ ${valorCorreto.toFixed(2)}`);
        console.log(`   Diferença: R$ ${diferenca.toFixed(2)} (${percentDiff.toFixed(2)}%)`);
        console.log('');
      }
    }
    
    if (corrections.length > 0) {
      console.log('=====================================');
      console.log(`📈 RESUMO:`);
      console.log(`   Lotes com problema: ${corrections.length}`);
      console.log(`   Diferença total: R$ ${totalDiferenca.toFixed(2)}`);
      console.log('=====================================\n');
      
      console.log('Para corrigir, execute o seguinte SQL no banco de dados:\n');
      console.log('-- BACKUP PRIMEIRO!');
      console.log('-- CREATE TABLE cattle_purchases_backup AS SELECT * FROM cattle_purchases;\n');
      
      for (const corr of corrections) {
        console.log(`UPDATE cattle_purchases`);
        console.log(`SET purchase_value = ${corr.valorCorreto.toFixed(2)},`);
        console.log(`    total_cost = ${corr.valorCorreto.toFixed(2)} + freight_cost + commission`);
        console.log(`WHERE id = '${corr.id}';`);
        console.log('');
      }
      
      console.log('-- Verificar após a correção:');
      console.log('SELECT lot_code, purchase_value FROM cattle_purchases ORDER BY created_at DESC;');
    } else {
      console.log('✅ Todos os valores estão corretos!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

fixPurchaseValues();
// Script para corrigir os valores via API
import fetch from 'node-fetch';

async function fixPurchaseValues() {
  console.log('🔧 EXECUTANDO CORREÇÃO DOS VALORES');
  console.log('====================================\n');
  
  try {
    // 1. Buscar todos os lotes
    const response = await fetch('http://localhost:3001/api/v1/cattle-purchases?limit=100');
    const data = await response.json();
    
    console.log(`📊 ${data.items.length} lotes encontrados\n`);
    
    let corrigidos = 0;
    let erros = 0;
    
    // 2. Corrigir cada lote com valor incorreto
    for (const lote of data.items) {
      const rendimento = lote.carcassYield || 50;
      
      // Calcular valor correto
      const pesoCarcaca = (lote.purchaseWeight * rendimento) / 100;
      const arrobas = pesoCarcaca / 15;
      const valorCorreto = arrobas * lote.pricePerArroba;
      
      const diferenca = Math.abs(lote.purchaseValue - valorCorreto);
      
      // Se a diferença for maior que R$ 1, precisa corrigir
      if (diferenca > 1) {
        console.log(`📝 Corrigindo ${lote.lotCode}...`);
        console.log(`   Valor atual: R$ ${lote.purchaseValue.toFixed(2)}`);
        console.log(`   Valor correto: R$ ${valorCorreto.toFixed(2)}`);
        
        // Atualizar via API
        const updateData = {
          purchaseValue: valorCorreto,
          totalCost: valorCorreto + (lote.freightCost || 0) + (lote.commission || 0)
        };
        
        try {
          const updateResponse = await fetch(
            `http://localhost:3001/api/v1/cattle-purchases/${lote.id}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updateData)
            }
          );
          
          if (updateResponse.ok) {
            console.log(`   ✅ Corrigido!\n`);
            corrigidos++;
          } else {
            console.log(`   ❌ Erro na atualização\n`);
            erros++;
          }
        } catch (err) {
          console.log(`   ❌ Erro: ${err.message}\n`);
          erros++;
        }
      }
    }
    
    console.log('====================================');
    console.log('📊 RESUMO DA CORREÇÃO:');
    console.log(`   ✅ Lotes corrigidos: ${corrigidos}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log('====================================\n');
    
    if (corrigidos > 0) {
      console.log('✅ Correção concluída com sucesso!');
      console.log('Os valores agora estão calculados corretamente com o rendimento de 50%');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixPurchaseValues();
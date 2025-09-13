const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script para garantir que o cálculo do valor da compra
 * sempre use o rendimento de carcaça correto (50% padrão)
 * e evite a divergência de 4%
 */

async function fixCarcassYieldCalculation() {
  try {
    console.log('🔍 Verificando e corrigindo cálculos de rendimento de carcaça...\n');
    
    const purchases = await prisma.cattlePurchase.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Total de compras: ${purchases.length}\n`);
    
    let divergencias = 0;
    let corrigidas = 0;
    
    for (const purchase of purchases) {
      // Usar rendimento de 50% se não estiver definido
      const rendimento = purchase.carcassYield || 50;
      
      // Calcular o valor correto
      const pesoCarcaca = (purchase.purchaseWeight * rendimento) / 100;
      const arrobas = pesoCarcaca / 15;
      const valorCorreto = arrobas * purchase.pricePerArroba;
      
      // Verificar divergência
      const diferenca = Math.abs(purchase.purchaseValue - valorCorreto);
      const percentualDiferenca = (diferenca / valorCorreto) * 100;
      
      if (percentualDiferenca > 0.1) { // Tolerância de 0.1%
        divergencias++;
        console.log(`⚠️ Divergência encontrada no lote ${purchase.lotCode}:`);
        console.log(`   Valor atual: R$ ${purchase.purchaseValue.toFixed(2)}`);
        console.log(`   Valor correto: R$ ${valorCorreto.toFixed(2)}`);
        console.log(`   Diferença: R$ ${diferenca.toFixed(2)} (${percentualDiferenca.toFixed(2)}%)`);
        console.log(`   Rendimento: ${rendimento}%`);
        
        // Verificar se a divergência é próxima de 4% (indicativo de uso de 52% ao invés de 50%)
        if (Math.abs(percentualDiferenca - 4) < 0.5) {
          console.log(`   🔴 Possível uso incorreto de 52% de rendimento!`);
          
          // Recalcular com 50% para confirmar
          const valorCom50 = ((purchase.purchaseWeight * 50) / 100 / 15) * purchase.pricePerArroba;
          console.log(`   Se usar 50%: R$ ${valorCom50.toFixed(2)}`);
        }
        
        // Corrigir o valor no banco
        if (purchase.carcassYield === null || purchase.carcassYield === undefined) {
          await prisma.cattlePurchase.update({
            where: { id: purchase.id },
            data: {
              carcassYield: 50,
              purchaseValue: valorCorreto,
              totalCost: valorCorreto + (purchase.freightCost || 0) + (purchase.commission || 0)
            }
          });
          corrigidas++;
          console.log(`   ✅ Corrigido!\n`);
        }
      }
    }
    
    console.log('\n=== RESUMO ===');
    console.log(`Total de compras analisadas: ${purchases.length}`);
    console.log(`Divergências encontradas: ${divergencias}`);
    console.log(`Compras corrigidas: ${corrigidas}`);
    
    if (divergencias === 0) {
      console.log('\n✅ Todos os cálculos estão corretos!');
    } else if (corrigidas > 0) {
      console.log(`\n✅ ${corrigidas} compras foram corrigidas com sucesso!`);
    }
    
    // Validação final
    console.log('\n📊 VALIDAÇÃO FINAL:');
    const totais = await prisma.cattlePurchase.aggregate({
      _sum: {
        purchaseValue: true,
        commission: true
      }
    });
    
    console.log(`Valor total das compras: R$ ${totais._sum.purchaseValue?.toFixed(2) || '0.00'}`);
    console.log(`Total de comissões: R$ ${totais._sum.commission?.toFixed(2) || '0.00'}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Adicionar validação no service para prevenir o problema
console.log('💡 RECOMENDAÇÃO PARA PREVENIR O PROBLEMA:\n');
console.log('No arquivo backend/src/services/cattlePurchase.service.ts, certifique-se de que:');
console.log('1. O rendimento padrão seja sempre 50% quando não informado');
console.log('2. O cálculo use exatamente: (peso * rendimento / 100) / 15 * precoArroba');
console.log('3. Não haja arredondamentos intermediários que causem divergências\n');

fixCarcassYieldCalculation();
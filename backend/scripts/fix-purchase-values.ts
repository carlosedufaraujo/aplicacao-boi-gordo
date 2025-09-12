import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPurchaseValues() {
  console.log('🔧 CORRIGINDO VALORES DE COMPRA NO BANCO');
  console.log('=========================================\n');

  try {
    // 1. Buscar todas as compras
    const purchases = await prisma.cattlePurchase.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 ${purchases.length} lotes encontrados\n`);

    let corrigidos = 0;
    let totalDiferencaCorrigida = 0;

    // 2. Processar cada compra
    for (const purchase of purchases) {
      const rendimento = purchase.carcassYield || 50;
      
      // Calcular o valor correto baseado no rendimento
      const pesoCarcaca = (purchase.purchaseWeight * rendimento) / 100;
      const arrobas = pesoCarcaca / 15;
      const valorCorreto = arrobas * purchase.pricePerArroba;
      
      const diferenca = purchase.purchaseValue - valorCorreto;
      
      // Se a diferença for significativa (maior que R$ 1), corrigir
      if (Math.abs(diferenca) > 1) {
        console.log(`📝 Corrigindo ${purchase.lotCode}:`);
        console.log(`   Valor atual: R$ ${purchase.purchaseValue.toFixed(2)}`);
        console.log(`   Valor correto: R$ ${valorCorreto.toFixed(2)}`);
        console.log(`   Diferença: R$ ${diferenca.toFixed(2)}`);
        
        // Atualizar no banco
        await prisma.cattlePurchase.update({
          where: { id: purchase.id },
          data: {
            purchaseValue: valorCorreto,
            totalCost: valorCorreto + (purchase.freightCost || 0) + (purchase.commission || 0),
            updatedAt: new Date()
          }
        });
        
        console.log(`   ✅ Corrigido!\n`);
        corrigidos++;
        totalDiferencaCorrigida += diferenca;
      }
    }

    // 3. Relatório final
    console.log('=========================================');
    console.log('📊 RESUMO DA CORREÇÃO:');
    console.log(`   Total de lotes: ${purchases.length}`);
    console.log(`   Lotes corrigidos: ${corrigidos}`);
    console.log(`   Diferença total corrigida: R$ ${totalDiferencaCorrigida.toFixed(2)}`);
    console.log('=========================================\n');

    if (corrigidos > 0) {
      console.log('✅ Correção concluída com sucesso!');
      console.log('Os valores agora estão calculados corretamente com o rendimento de carcaça de cada lote.');
    } else {
      console.log('✅ Todos os valores já estavam corretos!');
    }

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a correção
fixPurchaseValues()
  .then(() => {
    console.log('\n🎉 Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
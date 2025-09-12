const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function corrigirValoresCashFlow() {
  try {
    console.log('🔄 Iniciando correção dos valores do Cash Flow...\n');

    // 1. Buscar todos os lotes e seus valores corretos
    const lots = await prisma.cattlePurchase.findMany({
      select: {
        lotCode: true,
        totalCost: true,
        purchaseValue: true
      }
    });

    console.log(`📊 Encontrados ${lots.length} lotes`);

    // 2. Buscar movimentações atuais do cash flow
    const cashFlowPurchases = await prisma.cashFlow.findMany({
      where: { categoryId: 'cat-exp-01' },
      select: {
        id: true,
        amount: true,
        description: true
      }
    });

    const cashFlowCommissions = await prisma.cashFlow.findMany({
      where: { categoryId: 'cat-exp-03' },
      select: {
        id: true,
        amount: true,
        description: true
      }
    });

    console.log(`💰 Cash Flow - Compras: ${cashFlowPurchases.length} registros`);
    console.log(`💰 Cash Flow - Comissões: ${cashFlowCommissions.length} registros`);

    // 3. Calcular valores corretos
    const totalRealPurchaseValue = lots.reduce((sum, lot) => sum + lot.purchaseValue, 0);
    const totalRealCommission = lots.reduce((sum, lot) => sum + (lot.totalCost - lot.purchaseValue), 0);
    
    const totalCashFlowPurchases = cashFlowPurchases.reduce((sum, cf) => sum + cf.amount, 0);
    const totalCashFlowCommissions = cashFlowCommissions.reduce((sum, cf) => sum + cf.amount, 0);

    console.log('\n=== COMPARAÇÃO DE VALORES ===');
    console.log(`Valor real das compras: R$ ${totalRealPurchaseValue.toFixed(2)}`);
    console.log(`Valor no Cash Flow: R$ ${totalCashFlowPurchases.toFixed(2)}`);
    console.log(`Diferença: R$ ${(totalCashFlowPurchases - totalRealPurchaseValue).toFixed(2)}`);

    console.log(`\nComissão real: R$ ${totalRealCommission.toFixed(2)}`);
    console.log(`Comissão no Cash Flow: R$ ${totalCashFlowCommissions.toFixed(2)}`);
    console.log(`Diferença comissões: R$ ${(totalCashFlowCommissions - totalRealCommission).toFixed(2)}`);

    // 4. Corrigir os valores proporcionalmente
    console.log('\n🔧 Iniciando correção dos valores...');

    const correctionFactor = totalRealPurchaseValue / totalCashFlowPurchases;
    console.log(`Fator de correção: ${correctionFactor.toFixed(6)}`);

    let updatedCount = 0;
    for (const cashFlow of cashFlowPurchases) {
      const correctedAmount = cashFlow.amount * correctionFactor;
      
      await prisma.cashFlow.update({
        where: { id: cashFlow.id },
        data: { amount: correctedAmount }
      });

      console.log(`✅ ${cashFlow.description}: R$ ${cashFlow.amount.toFixed(2)} → R$ ${correctedAmount.toFixed(2)}`);
      updatedCount++;
    }

    console.log(`\n✅ Correção concluída! ${updatedCount} registros atualizados.`);

    // 5. Verificar resultado final
    const finalCashFlows = await prisma.cashFlow.findMany({
      where: { categoryId: 'cat-exp-01' },
      select: { amount: true }
    });

    const finalTotal = finalCashFlows.reduce((sum, cf) => sum + cf.amount, 0);
    console.log(`\n📊 Valor final no Cash Flow: R$ ${finalTotal.toFixed(2)}`);
    console.log(`📊 Valor esperado: R$ ${totalRealPurchaseValue.toFixed(2)}`);
    console.log(`📊 Nova diferença: R$ ${(finalTotal - totalRealPurchaseValue).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  corrigirValoresCashFlow();
}

module.exports = { corrigirValoresCashFlow };
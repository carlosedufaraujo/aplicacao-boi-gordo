import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncPurchasesToExpenses() {
  console.log('🔄 Iniciando sincronização de compras para despesas...\n');
  
  try {
    // Buscar todas as compras de gado
    const purchases = await prisma.cattlePurchase.findMany({
      include: {
        vendor: true,
        payerAccount: true
      }
    });
    
    console.log(`📊 Total de compras encontradas: ${purchases.length}`);
    
    let createdExpenses = 0;
    let skippedExpenses = 0;
    
    for (const purchase of purchases) {
      console.log(`\n🐂 Processando Lote: ${purchase.lotCode}`);
      console.log(`   Valor da compra: R$ ${purchase.purchaseValue.toFixed(2)}`);
      console.log(`   Frete: R$ ${purchase.freightCost?.toFixed(2) || '0.00'}`);
      console.log(`   Comissão: R$ ${purchase.commission?.toFixed(2) || '0.00'}`);
      
      // Verificar se já existem despesas para esta compra
      const existingExpenses = await prisma.expense.findMany({
        where: { purchaseId: purchase.id }
      });
      
      if (existingExpenses.length > 0) {
        console.log(`   ✓ Já existem ${existingExpenses.length} despesas para este lote`);
        skippedExpenses += 3;
        continue;
      }
      
      // Criar as 3 despesas para a compra
      const expensesToCreate = [];
      
      // 1. Despesa principal da compra
      expensesToCreate.push({
        category: 'animal_purchase',
        description: `Compra de gado - Lote ${purchase.lotCode}`,
        totalAmount: purchase.purchaseValue,
        dueDate: purchase.purchaseDate,
        impactsCashFlow: true,
        purchaseId: purchase.id,
        vendorId: purchase.vendorId,
        payerAccountId: purchase.payerAccountId,
        notes: `Compra de ${purchase.initialQuantity} animais - ${purchase.purchaseWeight}kg total`,
        userId: purchase.userId,
        isPaid: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // 2. Despesa de frete (se houver)
      if (purchase.freightCost && purchase.freightCost > 0) {
        expensesToCreate.push({
          category: 'freight',
          description: `Frete - Lote ${purchase.lotCode}`,
          totalAmount: purchase.freightCost,
          dueDate: purchase.purchaseDate,
          impactsCashFlow: true,
          purchaseId: purchase.id,
          vendorId: null,
          payerAccountId: purchase.payerAccountId,
          notes: `Frete para transporte de ${purchase.initialQuantity} animais`,
          userId: purchase.userId,
          isPaid: false,
            createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // 3. Despesa de comissão (se houver)
      if (purchase.commission && purchase.commission > 0) {
        expensesToCreate.push({
          category: 'commission',
          description: `Comissão - Lote ${purchase.lotCode}`,
          totalAmount: purchase.commission,
          dueDate: purchase.purchaseDate,
          impactsCashFlow: true,
          purchaseId: purchase.id,
          vendorId: null,
          payerAccountId: purchase.payerAccountId,
          notes: `Comissão sobre compra de ${purchase.initialQuantity} animais`,
          userId: purchase.userId,
          isPaid: false,
            createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Criar as despesas
      const result = await prisma.expense.createMany({
        data: expensesToCreate
      });
      
      console.log(`   ✅ Criadas ${result.count} despesas para o lote ${purchase.lotCode}`);
      createdExpenses += result.count;
    }
    
    // Relatório final
    console.log('\n📊 Resumo da sincronização:');
    console.log(`   ✅ Despesas criadas: ${createdExpenses}`);
    console.log(`   ⏭️  Despesas já existentes: ${skippedExpenses}`);
    
    // Verificar totais após sincronização
    const totalExpenses = await prisma.expense.aggregate({
      _sum: { totalAmount: true },
      where: { category: { in: ['animal_purchase', 'freight', 'commission'] } }
    });
    
    const totalPurchases = await prisma.cattlePurchase.aggregate({
      _sum: { 
        purchaseValue: true,
        freightCost: true,
        commission: true
      }
    });
    
    console.log('\n💰 Verificação de integridade:');
    console.log(`   Total em compras (cattle-purchases):`);
    console.log(`      - Valor das compras: R$ ${totalPurchases._sum.purchaseValue?.toFixed(2) || '0.00'}`);
    console.log(`      - Fretes: R$ ${totalPurchases._sum.freightCost?.toFixed(2) || '0.00'}`);
    console.log(`      - Comissões: R$ ${totalPurchases._sum.commission?.toFixed(2) || '0.00'}`);
    const grandTotalPurchases = (totalPurchases._sum.purchaseValue || 0) + 
                                (totalPurchases._sum.freightCost || 0) + 
                                (totalPurchases._sum.commission || 0);
    console.log(`      - TOTAL: R$ ${grandTotalPurchases.toFixed(2)}`);
    
    console.log(`\n   Total em despesas (expenses):`);
    console.log(`      - TOTAL: R$ ${totalExpenses._sum.totalAmount?.toFixed(2) || '0.00'}`);
    
    if (Math.abs(grandTotalPurchases - (totalExpenses._sum.totalAmount || 0)) < 0.01) {
      console.log('\n✅ Sincronização completa! Os valores estão totalmente integrados.');
    } else {
      console.log('\n⚠️  Ainda há diferença entre os valores. Verifique manualmente.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncPurchasesToExpenses();
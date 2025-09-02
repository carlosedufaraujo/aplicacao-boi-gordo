const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function integrateExistingPurchase() {
  try {
    console.log('🔄 Processando compras existentes...\n');
    
    // Buscar compras sem despesas associadas
    const purchases = await prisma.cattlePurchase.findMany({
      include: {
        expenses: true,
        vendor: true,
        broker: true,
        transportCompany: true
      }
    });
    
    console.log(`Encontradas ${purchases.length} compras\n`);
    
    for (const purchase of purchases) {
      console.log(`\n📋 Processando Lote: ${purchase.lotCode || 'SEM CÓDIGO'}`);
      console.log(`   Valor da Compra: R$ ${purchase.purchaseValue.toFixed(2)}`);
      console.log(`   Comissão: R$ ${purchase.commission.toFixed(2)}`);
      console.log(`   Frete: R$ ${purchase.freightCost.toFixed(2)}`);
      console.log(`   Despesas existentes: ${purchase.expenses.length}`);
      
      if (purchase.expenses.length > 0) {
        console.log('   ⚠️ Já possui despesas cadastradas. Pulando...');
        continue;
      }
      
      // Criar Centro de Custo para o Lote
      let lotCostCenter = await prisma.costCenter.findFirst({
        where: { code: `LOT-${purchase.lotCode || purchase.id.substring(0, 8)}` }
      });
      
      if (!lotCostCenter) {
        lotCostCenter = await prisma.costCenter.create({
          data: {
            code: `LOT-${purchase.lotCode || purchase.id.substring(0, 8)}`,
            name: `Lote ${purchase.lotCode || purchase.id.substring(0, 8)}`,
            type: 'ACQUISITION',
            isActive: true
          }
        });
        console.log(`   ✅ Centro de custo criado: ${lotCostCenter.code}`);
      }
      
      const createdExpenses = [];
      
      // 1. Despesa principal - Compra do Gado
      const cattleExpense = await prisma.expense.create({
        data: {
          description: `Compra de Gado - Lote ${purchase.lotCode || purchase.id.substring(0, 8)}`,
          category: 'COMPRA_GADO',
          totalAmount: purchase.purchaseValue,
          dueDate: purchase.principalDueDate || purchase.purchaseDate,
          isPaid: false,
          impactsCashFlow: true,
          purchaseId: purchase.id,
          vendorId: purchase.vendorId,
          costCenterId: lotCostCenter.id,
          userId: purchase.userId || 'system',
          notes: `${purchase.initialQuantity} cabeças - Peso: ${purchase.purchaseWeight}kg`
        }
      });
      createdExpenses.push(cattleExpense);
      console.log(`   ✅ Despesa de compra criada: R$ ${purchase.purchaseValue.toFixed(2)}`);
      
      // 2. Despesa de Comissão
      if (purchase.commission > 0) {
        const commissionExpense = await prisma.expense.create({
          data: {
            description: `Comissão - Lote ${purchase.lotCode || purchase.id.substring(0, 8)}`,
            category: 'COMISSAO',
            totalAmount: purchase.commission,
            dueDate: purchase.commissionDueDate || purchase.purchaseDate,
            isPaid: false,
            impactsCashFlow: true,
            purchaseId: purchase.id,
            vendorId: purchase.brokerId || purchase.vendorId,
            costCenterId: lotCostCenter.id,
            userId: purchase.userId || 'system',
            notes: purchase.broker ? `Corretor: ${purchase.broker.name}` : 'Comissão sobre compra'
          }
        });
        createdExpenses.push(commissionExpense);
        console.log(`   ✅ Despesa de comissão criada: R$ ${purchase.commission.toFixed(2)}`);
      }
      
      // 3. Despesa de Frete
      if (purchase.freightCost > 0) {
        const freightExpense = await prisma.expense.create({
          data: {
            description: `Frete - Lote ${purchase.lotCode || purchase.id.substring(0, 8)}`,
            category: 'TRANSPORTE',
            totalAmount: purchase.freightCost,
            dueDate: purchase.freightDueDate || purchase.purchaseDate,
            isPaid: false,
            impactsCashFlow: true,
            purchaseId: purchase.id,
            vendorId: purchase.transportCompanyId || purchase.vendorId,
            costCenterId: lotCostCenter.id,
            userId: purchase.userId || 'system',
            notes: purchase.city && purchase.state 
              ? `Origem: ${purchase.city} - ${purchase.state}` 
              : 'Transporte de gado'
          }
        });
        createdExpenses.push(freightExpense);
        console.log(`   ✅ Despesa de frete criada: R$ ${purchase.freightCost.toFixed(2)}`);
      }
      
      // Criar alocações
      for (const expense of createdExpenses) {
        await prisma.expenseAllocation.create({
          data: {
            expenseId: expense.id,
            entityType: 'LOT',
            entityId: purchase.id,
            allocatedAmount: expense.totalAmount,
            percentage: 100
          }
        });
      }
      
      const totalValue = purchase.purchaseValue + purchase.commission + purchase.freightCost;
      console.log(`   💰 Total de despesas criadas: ${createdExpenses.length}`);
      console.log(`   💰 Valor total: R$ ${totalValue.toFixed(2)}`);
    }
    
    // Resumo final
    console.log('\n\n📊 RESUMO APÓS INTEGRAÇÃO:');
    console.log('============================');
    
    const totalExpenses = await prisma.expense.count();
    const totalValue = await prisma.expense.aggregate({
      _sum: { totalAmount: true }
    });
    
    const costCenters = await prisma.costCenter.findMany({
      where: { code: { contains: 'LOT' } },
      include: {
        _count: {
          select: { expenses: true }
        }
      }
    });
    
    console.log(`Total de despesas no sistema: ${totalExpenses}`);
    console.log(`Valor total de despesas: R$ ${(totalValue._sum.totalAmount || 0).toFixed(2)}`);
    console.log(`\nCentros de custo de lotes criados: ${costCenters.length}`);
    
    costCenters.forEach(cc => {
      console.log(`  • [${cc.code}] ${cc.name}: ${cc._count.expenses} despesas`);
    });
    
    // Verificar categorias utilizadas
    const categories = await prisma.expense.groupBy({
      by: ['category'],
      _count: true,
      _sum: {
        totalAmount: true
      }
    });
    
    console.log('\nDespesas por categoria:');
    categories.forEach(cat => {
      console.log(`  • ${cat.category}: ${cat._count} despesas - R$ ${(cat._sum.totalAmount || 0).toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

integrateExistingPurchase();
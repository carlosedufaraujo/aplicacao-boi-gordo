const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function vincularComprasCentroFinanceiro() {
  try {
    console.log('🔗 Vinculando compras ao centro financeiro...\n');
    
    // Buscar todas as compras
    const compras = await prisma.cattlePurchase.findMany({
      include: {
        vendor: true,
        payerAccount: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📦 Total de compras encontradas: ${compras.length}\n`);
    
    if (compras.length === 0) {
      console.log('❌ Nenhuma compra encontrada para vincular');
      return;
    }
    
    // Buscar categorias necessárias
    const categorias = await prisma.category.findMany({
      where: {
        id: {
          in: ['cat-exp-01', 'cat-exp-02', 'cat-exp-03']
        }
      }
    });
    
    const catCompra = categorias.find(c => c.id === 'cat-exp-01');
    const catFrete = categorias.find(c => c.id === 'cat-exp-02');
    const catComissao = categorias.find(c => c.id === 'cat-exp-03');
    
    if (!catCompra) {
      console.error('❌ Categoria de compra de gado não encontrada!');
      return;
    }
    
    let despesasCriadas = 0;
    let cashFlowsCriados = 0;
    let erros = 0;
    
    for (const compra of compras) {
      console.log(`\n📝 Processando lote ${compra.lotCode}...`);
      
      try {
        // Verificar se já existe despesa vinculada
        const despesaExistente = await prisma.expense.findFirst({
          where: { purchaseId: compra.id }
        });
        
        if (despesaExistente) {
          console.log(`   ⚠️ Já existe despesa vinculada`);
          continue;
        }
        
        // Criar despesa principal da compra
        const despesa = await prisma.expense.create({
          data: {
            category: 'CATTLE_PURCHASE',
            description: `Compra de Gado - ${compra.lotCode}`,
            totalAmount: compra.purchaseValue,
            dueDate: compra.principalDueDate || compra.purchaseDate,
            paymentDate: compra.paymentType === 'CASH' ? compra.purchaseDate : null,
            isPaid: compra.paymentType === 'CASH',
            purchaseId: compra.id,
            vendorId: compra.vendorId,
            payerAccountId: compra.payerAccountId,
            userId: compra.userId,
            notes: `${compra.initialQuantity} cabeças | ${compra.purchaseWeight}kg | R$ ${compra.pricePerArroba}/@`
          }
        });
        despesasCriadas++;
        console.log(`   ✅ Despesa principal criada: R$ ${compra.purchaseValue.toFixed(2)}`);
        
        // Criar despesa de frete se houver
        if (compra.freightCost && compra.freightCost > 0) {
          await prisma.expense.create({
            data: {
              category: 'FREIGHT',
              description: `Frete - ${compra.lotCode}`,
              totalAmount: compra.freightCost,
              dueDate: compra.freightDueDate || compra.purchaseDate,
              paymentDate: compra.paymentType === 'CASH' ? compra.purchaseDate : null,
              isPaid: compra.paymentType === 'CASH',
              purchaseId: compra.id,
              payerAccountId: compra.payerAccountId,
              userId: compra.userId
            }
          });
          despesasCriadas++;
          console.log(`   ✅ Despesa de frete criada: R$ ${compra.freightCost.toFixed(2)}`);
        }
        
        // Criar despesa de comissão se houver
        if (compra.commission && compra.commission > 0) {
          await prisma.expense.create({
            data: {
              category: 'COMMISSION',
              description: `Comissão - ${compra.lotCode}`,
              totalAmount: compra.commission,
              dueDate: compra.commissionDueDate || compra.purchaseDate,
              paymentDate: compra.paymentType === 'CASH' ? compra.purchaseDate : null,
              isPaid: compra.paymentType === 'CASH',
              purchaseId: compra.id,
              payerAccountId: compra.payerAccountId,
              userId: compra.userId
            }
          });
          despesasCriadas++;
          console.log(`   ✅ Despesa de comissão criada: R$ ${compra.commission.toFixed(2)}`);
        }
        
        // Criar lançamentos no CashFlow
        // 1. CashFlow da compra principal
        await prisma.cashFlow.create({
          data: {
            type: 'EXPENSE',
            categoryId: catCompra.id,
            accountId: compra.payerAccountId,
            description: `Compra de Gado - ${compra.lotCode}`,
            amount: compra.purchaseValue,
            date: compra.purchaseDate,
            dueDate: compra.principalDueDate || compra.purchaseDate,
            status: compra.paymentType === 'CASH' ? 'PAID' : 'PENDING',
            supplier: compra.vendor?.name || 'Fornecedor',
            reference: `COMPRA-${compra.lotCode}`,
            notes: `${compra.initialQuantity} cabeças | R$ ${compra.pricePerArroba}/@`,
            tags: ['compra-gado', compra.lotCode],
            userId: compra.userId
          }
        });
        cashFlowsCriados++;
        console.log(`   ✅ CashFlow principal criado`);
        
        // 2. CashFlow do frete
        if (compra.freightCost && compra.freightCost > 0 && catFrete) {
          await prisma.cashFlow.create({
            data: {
              type: 'EXPENSE',
              categoryId: catFrete.id,
              accountId: compra.payerAccountId,
              description: `Frete - ${compra.lotCode}`,
              amount: compra.freightCost,
              date: compra.purchaseDate,
              dueDate: compra.freightDueDate || compra.purchaseDate,
              status: compra.paymentType === 'CASH' ? 'PAID' : 'PENDING',
              supplier: 'Transportadora',
              reference: `FRETE-${compra.lotCode}`,
              tags: ['frete', compra.lotCode],
              userId: compra.userId
            }
          });
          cashFlowsCriados++;
          console.log(`   ✅ CashFlow de frete criado`);
        }
        
        // 3. CashFlow da comissão
        if (compra.commission && compra.commission > 0 && catComissao) {
          await prisma.cashFlow.create({
            data: {
              type: 'EXPENSE',
              categoryId: catComissao.id,
              accountId: compra.payerAccountId,
              description: `Comissão - ${compra.lotCode}`,
              amount: compra.commission,
              date: compra.purchaseDate,
              dueDate: compra.commissionDueDate || compra.purchaseDate,
              status: compra.paymentType === 'CASH' ? 'PAID' : 'PENDING',
              supplier: 'Corretor',
              reference: `COMISSAO-${compra.lotCode}`,
              tags: ['comissao', compra.lotCode],
              userId: compra.userId
            }
          });
          cashFlowsCriados++;
          console.log(`   ✅ CashFlow de comissão criado`);
        }
        
      } catch (error) {
        erros++;
        console.error(`   ❌ Erro ao processar lote ${compra.lotCode}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA VINCULAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Despesas criadas: ${despesasCriadas}`);
    console.log(`✅ CashFlows criados: ${cashFlowsCriados}`);
    console.log(`❌ Erros: ${erros}`);
    
    // Verificar totais
    const totalDespesas = await prisma.expense.aggregate({
      _sum: { totalAmount: true }
    });
    
    const totalCashFlow = await prisma.cashFlow.aggregate({
      where: { type: 'EXPENSE' },
      _sum: { amount: true }
    });
    
    console.log('\n📊 TOTAIS NO CENTRO FINANCEIRO:');
    console.log(`Despesas: R$ ${totalDespesas._sum.totalAmount?.toFixed(2) || '0.00'}`);
    console.log(`CashFlow: R$ ${totalCashFlow._sum.amount?.toFixed(2) || '0.00'}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

vincularComprasCentroFinanceiro();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function integrarVendasCashFlow() {
  try {
    console.log('🔄 Iniciando integração das vendas com Cash Flow...\n');

    // 1. Buscar todas as vendas que ainda não foram integradas
    const vendas = await prisma.saleRecord.findMany({
      select: {
        id: true,
        internalCode: true,
        saleDate: true,
        totalValue: true,
        netValue: true,
        status: true,
        receiverAccountId: true,
        buyer: {
          select: { name: true }
        }
      },
      orderBy: { saleDate: 'desc' }
    });

    console.log(`📊 Total de vendas encontradas: ${vendas.length}`);

    if (vendas.length === 0) {
      console.log('❌ Nenhuma venda encontrada para integrar.');
      return;
    }

    // 2. Verificar quais vendas já foram integradas
    const vendasJaIntegradas = await prisma.cashFlow.findMany({
      where: {
        type: 'INCOME',
        description: {
          contains: 'Venda de Gado'
        }
      },
      select: {
        description: true,
        reference: true
      }
    });

    const codigosIntegrados = new Set(
      vendasJaIntegradas.map(cf => cf.reference).filter(Boolean)
    );

    console.log(`📋 Vendas já integradas: ${codigosIntegrados.size}`);

    // 3. Filtrar vendas que ainda não foram integradas
    const vendasParaIntegrar = vendas.filter(venda => 
      !codigosIntegrados.has(venda.internalCode) && venda.status === 'PAID'
    );

    console.log(`🔄 Vendas para integrar: ${vendasParaIntegrar.length}`);

    if (vendasParaIntegrar.length === 0) {
      console.log('✅ Todas as vendas já estão integradas ao Cash Flow.');
      return;
    }

    // 4. Integrar cada venda
    let integradasCount = 0;
    for (const venda of vendasParaIntegrar) {
      console.log(`\n🔄 Integrando venda: ${venda.internalCode} - R$ ${venda.netValue?.toFixed(2)}`);

      // Usar netValue (valor líquido após deduções) para o Cash Flow
      const valorRecebido = venda.netValue || venda.totalValue || 0;

      await prisma.cashFlow.create({
        data: {
          type: 'INCOME',
          categoryId: 'cat-inc-01', // Venda de Gado Gordo
          accountId: venda.receiverAccountId,
          description: `Venda de Gado - ${venda.internalCode}`,
          amount: valorRecebido,
          date: venda.saleDate,
          status: 'RECEIVED', // Já recebido pois status é PAID
          paymentDate: venda.saleDate,
          reference: venda.internalCode,
          supplier: venda.buyer?.name || null,
          notes: `Integração automática - Venda de gado`,
          tags: ['gado', 'venda', 'integração']
        }
      });

      integradasCount++;
      console.log(`✅ Venda ${venda.internalCode} integrada com sucesso!`);
    }

    console.log(`\n✅ Integração concluída! ${integradasCount} vendas integradas ao Cash Flow.`);

    // 5. Verificar resultado final
    const totalReceitas = await prisma.cashFlow.findMany({
      where: { type: 'INCOME' },
      select: { amount: true }
    });

    const valorTotalReceitas = totalReceitas.reduce((sum, r) => sum + r.amount, 0);
    console.log(`\n📊 Total de receitas no Cash Flow: R$ ${valorTotalReceitas.toFixed(2)}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro durante a integração:', error);
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  integrarVendasCashFlow();
}

module.exports = { integrarVendasCashFlow };
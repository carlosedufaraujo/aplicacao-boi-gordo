const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPerpetualDRE() {
  console.log('=== TESTE DO DRE PERPÉTUO ===\n');
  
  try {
    // Buscar todos os DREs
    const allDREs = await prisma.dREStatement.findMany({
      orderBy: { referenceMonth: 'asc' }
    });
    
    console.log(`Total de DREs encontrados: ${allDREs.length}\n`);
    
    if (allDREs.length === 0) {
      console.log('❌ Nenhum DRE encontrado no banco de dados!');
      console.log('   O DRE Perpétuo retornará dados vazios.\n');
      return;
    }
    
    // Calcular totais como o DRE Perpétuo faz
    let totalNetProfit = 0;
    let totalGrossRevenue = 0;
    let totalDeductions = 0;
    let totalCosts = 0;
    let totalExpenses = 0;
    let bestMonth = { month: '', profit: -Infinity };
    let worstMonth = { month: '', profit: Infinity };
    
    allDREs.forEach(dre => {
      totalNetProfit += dre.netProfit;
      totalGrossRevenue += dre.grossRevenue;
      totalDeductions += dre.deductions;
      totalCosts += dre.totalCosts;
      totalExpenses += dre.totalExpenses;
      
      const monthStr = dre.referenceMonth.toISOString().substring(0, 7);
      console.log(`Mês ${monthStr}:`);
      console.log(`  Receita: R$ ${dre.grossRevenue.toFixed(2)}`);
      console.log(`  Deduções: R$ ${dre.deductions.toFixed(2)}`);
      console.log(`  Lucro: R$ ${dre.netProfit.toFixed(2)}`);
      console.log('');
      
      if (dre.netProfit > bestMonth.profit) {
        bestMonth = { month: monthStr, profit: dre.netProfit };
      }
      if (dre.netProfit < worstMonth.profit) {
        worstMonth = { month: monthStr, profit: dre.netProfit };
      }
    });
    
    console.log('=== RESUMO DO DRE PERPÉTUO ===');
    console.log(`Período: ${allDREs[0].referenceMonth.toISOString().substring(0, 7)} até ${allDREs[allDREs.length - 1].referenceMonth.toISOString().substring(0, 7)}`);
    console.log(`Meses analisados: ${allDREs.length}`);
    console.log(`\nTotais Acumulados:`);
    console.log(`  Receita Bruta: R$ ${totalGrossRevenue.toFixed(2)}`);
    console.log(`  Deduções: R$ ${totalDeductions.toFixed(2)}`);
    console.log(`  Custos: R$ ${totalCosts.toFixed(2)}`);
    console.log(`  Despesas: R$ ${totalExpenses.toFixed(2)}`);
    console.log(`  Lucro Líquido: R$ ${totalNetProfit.toFixed(2)}`);
    console.log(`\nMétricas:`);
    console.log(`  Lucro Médio Mensal: R$ ${(totalNetProfit / allDREs.length).toFixed(2)}`);
    console.log(`  Melhor Mês: ${bestMonth.month} (R$ ${bestMonth.profit.toFixed(2)})`);
    console.log(`  Pior Mês: ${worstMonth.month} (R$ ${worstMonth.profit.toFixed(2)})`);
    
  } catch (error) {
    console.error('❌ Erro ao testar DRE Perpétuo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPerpetualDRE();
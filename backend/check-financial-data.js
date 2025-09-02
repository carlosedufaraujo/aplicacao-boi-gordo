const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFinancialData() {
  try {
    console.log('=== VERIFICANDO DADOS FINANCEIROS ===\n');
    
    // 1. Centros de Custo
    console.log('📊 CENTROS DE CUSTO CADASTRADOS:');
    console.log('================================');
    const costCenters = await prisma.costCenter.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
            expenses: true,
            revenues: true
          }
        }
      }
    });
    
    if (costCenters.length === 0) {
      console.log('❌ Nenhum centro de custo cadastrado\n');
    } else {
      costCenters.forEach(cc => {
        console.log(`\n[${cc.code}] ${cc.name}`);
        console.log(`  Tipo: ${cc.type || 'N/A'}`);
        console.log(`  Status: ${cc.active ? '✅ Ativo' : '❌ Inativo'}`);
        console.log(`  Centro Pai: ${cc.parent ? cc.parent.name : 'Raiz'}`);
        console.log(`  Sub-centros: ${cc._count.children}`);
        console.log(`  Despesas vinculadas: ${cc._count.expenses}`);
        console.log(`  Receitas vinculadas: ${cc._count.revenues}`);
      });
    }
    
    // 2. Despesas
    console.log('\n\n💰 ÚLTIMAS 10 DESPESAS CADASTRADAS:');
    console.log('=====================================');
    const expenses = await prisma.expense.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        costCenter: true
      }
    });
    
    if (expenses.length === 0) {
      console.log('❌ Nenhuma despesa cadastrada\n');
    } else {
      expenses.forEach(exp => {
        console.log(`\n📝 ${exp.description}`);
        console.log(`  Categoria: ${exp.category}`);
        console.log(`  Valor: R$ ${exp.totalAmount.toFixed(2)}`);
        console.log(`  Vencimento: ${exp.dueDate.toLocaleDateString('pt-BR')}`);
        console.log(`  Status: ${exp.isPaid ? '✅ Pago' : '⏳ Pendente'}`);
        console.log(`  Centro de Custo: ${exp.costCenter ? exp.costCenter.name : 'Não vinculado'}`);
      });
    }
    
    // 3. Categorias de Despesas Únicas
    console.log('\n\n📁 CATEGORIAS DE DESPESAS UTILIZADAS:');
    console.log('======================================');
    const categories = await prisma.expense.findMany({
      select: { category: true },
      distinct: ['category']
    });
    
    if (categories.length === 0) {
      console.log('❌ Nenhuma categoria utilizada\n');
    } else {
      const categoryCounts = {};
      const allExpenses = await prisma.expense.findMany({
        select: { category: true }
      });
      
      allExpenses.forEach(exp => {
        categoryCounts[exp.category] = (categoryCounts[exp.category] || 0) + 1;
      });
      
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        console.log(`  • ${cat}: ${count} despesas`);
      });
    }
    
    // 4. Resumo Financeiro
    console.log('\n\n📈 RESUMO FINANCEIRO:');
    console.log('======================');
    
    const totalExpenses = await prisma.expense.aggregate({
      _sum: { totalAmount: true },
      _count: true
    });
    
    const paidExpenses = await prisma.expense.aggregate({
      where: { isPaid: true },
      _sum: { totalAmount: true },
      _count: true
    });
    
    const totalRevenues = await prisma.revenue.aggregate({
      _sum: { totalAmount: true },
      _count: true
    });
    
    const receivedRevenues = await prisma.revenue.aggregate({
      where: { isReceived: true },
      _sum: { totalAmount: true },
      _count: true
    });
    
    console.log(`\nDESPESAS:`);
    console.log(`  Total: R$ ${(totalExpenses._sum.totalAmount || 0).toFixed(2)} (${totalExpenses._count} registros)`);
    console.log(`  Pagas: R$ ${(paidExpenses._sum.totalAmount || 0).toFixed(2)} (${paidExpenses._count} registros)`);
    console.log(`  A Pagar: R$ ${((totalExpenses._sum.totalAmount || 0) - (paidExpenses._sum.totalAmount || 0)).toFixed(2)}`);
    
    console.log(`\nRECEITAS:`);
    console.log(`  Total: R$ ${(totalRevenues._sum.totalAmount || 0).toFixed(2)} (${totalRevenues._count} registros)`);
    console.log(`  Recebidas: R$ ${(receivedRevenues._sum.totalAmount || 0).toFixed(2)} (${receivedRevenues._count} registros)`);
    console.log(`  A Receber: R$ ${((totalRevenues._sum.totalAmount || 0) - (receivedRevenues._sum.totalAmount || 0)).toFixed(2)}`);
    
    console.log(`\nRESULTADO:`);
    console.log(`  Saldo (Receitas - Despesas): R$ ${((totalRevenues._sum.totalAmount || 0) - (totalExpenses._sum.totalAmount || 0)).toFixed(2)}`);
    
    // 5. Centros de Custo Padrão Sugeridos
    console.log('\n\n💡 CENTROS DE CUSTO SUGERIDOS (SE NÃO EXISTIREM):');
    console.log('==================================================');
    const suggestedCenters = [
      { code: 'ADM', name: 'Administrativo', type: 'ADMINISTRATIVE' },
      { code: 'OPR', name: 'Operacional', type: 'FATTENING' },
      { code: 'COM', name: 'Comercial', type: 'ADMINISTRATIVE' },
      { code: 'FIN', name: 'Financeiro', type: 'ADMINISTRATIVE' },
      { code: 'MAN', name: 'Manutenção', type: 'FATTENING' },
      { code: 'TRA', name: 'Transporte', type: 'FATTENING' }
    ];
    
    suggestedCenters.forEach(sc => {
      const exists = costCenters.find(cc => cc.code === sc.code);
      if (!exists) {
        console.log(`  ❓ ${sc.code} - ${sc.name} (${sc.type})`);
      } else {
        console.log(`  ✅ ${sc.code} - ${sc.name} já existe`);
      }
    });
    
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFinancialData();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Verificando dados no sistema...\n');
  
  try {
    const counts = {
      users: await prisma.user.count(),
      partners: await prisma.partner.count(),
      payerAccounts: await prisma.payerAccount.count(),
      cattlePurchases: await prisma.cattlePurchase.count(),
      expenses: await prisma.expense.count(),
      revenues: await prisma.revenue.count(),
      pens: await prisma.pen.count(),
      saleRecords: await prisma.saleRecord.count(),
      financialTransactions: await prisma.financialTransaction.count(),
      integratedAnalyses: await prisma.integratedFinancialAnalysis.count()
    };
    
    console.log('📊 Contagem de registros:');
    Object.entries(counts).forEach(([table, count]) => {
      const status = count === 0 ? '❌ VAZIO' : '✅ OK';
      console.log(`   • ${table}: ${count} registros ${status}`);
    });
    
    console.log('\n📅 Dados de análise integrada:');
    const analyses = await prisma.integratedFinancialAnalysis.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    
    if (analyses.length === 0) {
      console.log('   ❌ Nenhuma análise integrada encontrada');
    } else {
      analyses.forEach(analysis => {
        const date = new Date(analysis.referenceMonth);
        console.log(`   • ${date.getMonth() + 1}/${date.getFullYear()}: R$ ${analysis.totalRevenue.toFixed(2)} receita`);
      });
    }

    console.log('\n🔍 Primeiros registros de algumas tabelas:');
    
    // Verificar usuários
    const users = await prisma.user.findMany({ take: 3 });
    console.log(`\n👥 Usuários (${users.length}):`);
    users.forEach(user => {
      console.log(`   • ${user.email} (${user.role})`);
    });

    // Verificar transações financeiras
    const transactions = await prisma.financialTransaction.findMany({ 
      take: 3,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`\n💰 Transações Financeiras (${transactions.length}):`);
    transactions.forEach(t => {
      console.log(`   • ${t.description}: R$ ${t.amount.toFixed(2)} (${t.category})`);
    });

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
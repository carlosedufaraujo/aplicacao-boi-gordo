const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limparDespesasOrfas() {
  console.log('🧹 Iniciando limpeza de despesas órfãs...\n');
  
  try {
    // Verificar quantas despesas órfãs existem
    const despesasOrfas = await prisma.expense.findMany({
      where: { purchaseId: null },
      select: {
        id: true,
        category: true,
        description: true,
        totalAmount: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Total de despesas órfãs encontradas: ${despesasOrfas.length}`);
    
    if (despesasOrfas.length > 0) {
      console.log('\n📋 Despesas órfãs encontradas:');
      console.log('================================================');
      
      despesasOrfas.forEach((despesa, i) => {
        console.log(`${i+1}. ${despesa.category} - ${despesa.description}`);
        console.log(`   R$ ${despesa.totalAmount} - ${despesa.createdAt.toISOString().split('T')[0]}`);
      });
      
      console.log('\n🗑️  Removendo despesas órfãs...');
      
      // Primeiro remover alocações de despesas órfãs
      const expenseIds = despesasOrfas.map(d => d.id);
      
      console.log('   1. Removendo alocações de despesas...');
      await prisma.expenseAllocation.deleteMany({
        where: { expenseId: { in: expenseIds } }
      }).catch(() => {}); // Ignora erro se não tiver alocações
      
      console.log('   2. Removendo despesas...');
      const result = await prisma.expense.deleteMany({
        where: { purchaseId: null }
      });
      
      console.log(`✅ ${result.count} despesas órfãs removidas com sucesso!`);
    } else {
      console.log('✨ Nenhuma despesa órfã encontrada!');
    }
    
    // Verificar o estado final
    const totalDespesas = await prisma.expense.count();
    const totalCompras = await prisma.cattlePurchase.count();
    
    console.log('\n📋 Resumo final:');
    console.log('================');
    console.log(`Total de despesas no sistema: ${totalDespesas}`);
    console.log(`Total de compras no sistema: ${totalCompras}`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
limparDespesasOrfas()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n✨ Conexão com banco de dados encerrada!');
  });
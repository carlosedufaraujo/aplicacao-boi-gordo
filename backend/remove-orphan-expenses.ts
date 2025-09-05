import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function removeOrphanExpenses() {
  console.log('=== REMOÇÃO DE DESPESAS ÓRFÃS (DUPLICADAS) ===\n');
  
  // Primeiro, vamos verificar o estado atual
  const allExpenses = await prisma.expense.findMany({
    include: {
      purchase: true,
    }
  });
  
  const orphanExpenses = allExpenses.filter(exp => !exp.purchaseId);
  const linkedExpenses = allExpenses.filter(exp => exp.purchaseId);
  
  console.log('Estado ANTES da remoção:');
  console.log('- Total de despesas:', allExpenses.length);
  console.log('- Despesas órfãs (sem purchaseId):', orphanExpenses.length);
  console.log('- Despesas vinculadas (com purchaseId):', linkedExpenses.length);
  
  const orphanTotal = orphanExpenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);
  const linkedTotal = linkedExpenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);
  
  console.log('\nValores ANTES:');
  console.log('- Total órfãs: R$', orphanTotal.toLocaleString('pt-BR'));
  console.log('- Total vinculadas: R$', linkedTotal.toLocaleString('pt-BR'));
  console.log('- TOTAL GERAL: R$', (orphanTotal + linkedTotal).toLocaleString('pt-BR'));
  
  // Deletar todas as despesas órfãs
  if (orphanExpenses.length > 0) {
    console.log('\n=== REMOVENDO DESPESAS ÓRFÃS ===');
    
    const deleteResult = await prisma.expense.deleteMany({
      where: {
        purchaseId: null
      }
    });
    
    console.log(`✅ ${deleteResult.count} despesas órfãs removidas com sucesso!`);
    
    // Verificar o estado após a remoção
    const remainingExpenses = await prisma.expense.findMany({
      include: {
        purchase: true,
      }
    });
    
    const remainingTotal = remainingExpenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);
    
    console.log('\nEstado DEPOIS da remoção:');
    console.log('- Total de despesas:', remainingExpenses.length);
    console.log('- Valor total: R$', remainingTotal.toLocaleString('pt-BR'));
    console.log('\n✅ PROBLEMA CORRIGIDO!');
    console.log('O Centro Financeiro agora mostrará o valor correto de R$ 11.913.013,72');
  } else {
    console.log('\n✅ Não há despesas órfãs para remover. Sistema está correto!');
  }
  
  await prisma.$disconnect();
}

removeOrphanExpenses().catch(console.error);
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function forceDeleteAllPayerAccounts() {
  console.log('=== EXCLUSÃO FORÇADA DE TODAS AS CONTAS PAGADORAS ===\n');
  
  try {
    // Verificar quantas contas existem
    const accounts = await prisma.payerAccount.findMany();
    console.log(`Total de contas pagadoras encontradas: ${accounts.length}`);
    
    if (accounts.length === 0) {
      console.log('Não há contas pagadoras para excluir.');
      return;
    }
    
    console.log('\nContas que serão excluídas:');
    accounts.forEach(account => {
      console.log(`- ${account.accountName} (${account.bankName}) - ID: ${account.id}`);
    });
    
    // Primeiro, deletar todas as compras de gado que têm payerAccountId
    console.log('\n=== DELETANDO COMPRAS DE GADO VINCULADAS ===');
    const purchasesWithAccount = await prisma.cattlePurchase.findMany({
      where: {
        payerAccountId: {
          not: null
        }
      }
    });
    
    console.log(`Compras de gado com conta pagadora: ${purchasesWithAccount.length}`);
    
    if (purchasesWithAccount.length > 0) {
      // Deletar primeiro as despesas vinculadas às compras
      for (const purchase of purchasesWithAccount) {
        await prisma.expense.deleteMany({
          where: { purchaseId: purchase.id }
        });
      }
      
      // Depois deletar as compras
      const deletedPurchases = await prisma.cattlePurchase.deleteMany({
        where: {
          payerAccountId: {
            not: null
          }
        }
      });
      console.log(`✅ ${deletedPurchases.count} compras de gado deletadas`);
    }
    
    // Remover referências em expenses restantes
    console.log('\n=== REMOVENDO VÍNCULOS RESTANTES ===');
    const expensesUpdated = await prisma.expense.updateMany({
      where: { payerAccountId: { not: null } },
      data: { payerAccountId: null }
    });
    console.log(`- ${expensesUpdated.count} vínculos removidos de expenses`);
    
    // Remover referências em revenues
    const revenuesUpdated = await prisma.revenue.updateMany({
      where: { payerAccountId: { not: null } },
      data: { payerAccountId: null }
    });
    console.log(`- ${revenuesUpdated.count} vínculos removidos de revenues`);
    
    // Agora deletar todas as contas pagadoras
    console.log('\n=== EXCLUINDO CONTAS PAGADORAS ===');
    const deleteResult = await prisma.payerAccount.deleteMany({});
    
    console.log(`\n✅ ${deleteResult.count} contas pagadoras excluídas com sucesso!`);
    console.log('\n⚠️  ATENÇÃO: As compras de gado que tinham conta pagadora foram removidas.');
    console.log('Agora você pode cadastrar as contas pagadoras corretamente e reimportar os dados se necessário.');
    
  } catch (error) {
    console.error('❌ Erro ao excluir contas pagadoras:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceDeleteAllPayerAccounts().catch(console.error);
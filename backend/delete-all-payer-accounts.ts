import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deleteAllPayerAccounts() {
  console.log('=== EXCLUSÃO DE TODAS AS CONTAS PAGADORAS ===\n');
  
  try {
    // Primeiro, verificar quantas contas existem
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
    
    // Deletar todas as contas pagadoras
    console.log('\n=== EXCLUINDO CONTAS PAGADORAS ===');
    const deleteResult = await prisma.payerAccount.deleteMany({});
    
    console.log(`\n✅ ${deleteResult.count} contas pagadoras excluídas com sucesso!`);
    console.log('Agora você pode cadastrar as contas pagadoras corretamente de forma manual.');
    
  } catch (error) {
    console.error('❌ Erro ao excluir contas pagadoras:', error);
    
    // Se houver erro de constraint (relacionamento), tentar limpar as referências primeiro
    if ((error as any).code === 'P2003') {
      console.log('\n⚠️  Existem registros vinculados às contas. Removendo vínculos primeiro...');
      
      // Remover referências em expenses
      const expensesUpdated = await prisma.expense.updateMany({
        data: { payerAccountId: null }
      });
      console.log(`- ${expensesUpdated.count} vínculos removidos de expenses`);
      
      // Remover referências em revenues
      const revenuesUpdated = await prisma.revenue.updateMany({
        data: { payerAccountId: null }
      });
      console.log(`- ${revenuesUpdated.count} vínculos removidos de revenues`);
      
      // Remover referências em cattle_purchases
      const purchasesUpdated = await prisma.cattlePurchase.updateMany({
        data: { payerAccountId: null }
      });
      console.log(`- ${purchasesUpdated.count} vínculos removidos de cattle_purchases`);
      
      console.log('\nTodos os vínculos removidos. Tentando excluir novamente...');
      
      // Tentar deletar novamente
      const deleteResult = await prisma.payerAccount.deleteMany({});
      console.log(`\n✅ ${deleteResult.count} contas pagadoras excluídas com sucesso após remover vínculos!`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllPayerAccounts().catch(console.error);
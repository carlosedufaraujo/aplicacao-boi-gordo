import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkExpenses() {
  // Buscar todas as despesas
  const expenses = await prisma.expense.findMany({
    include: {
      purchase: true,
      costCenter: true
    }
  });
  
  console.log('Total de despesas:', expenses.length);
  
  // Calcular o total
  const total = expenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);
  console.log('Valor total de despesas: R$', total.toLocaleString('pt-BR'));
  
  // Verificar duplicações por descrição
  const descriptionMap = new Map<string, any[]>();
  expenses.forEach(exp => {
    if (!descriptionMap.has(exp.description)) {
      descriptionMap.set(exp.description, []);
    }
    descriptionMap.get(exp.description)!.push(exp);
  });
  
  console.log('\n=== Possíveis duplicações por descrição ===');
  for (const [description, expenseList] of descriptionMap.entries()) {
    if (expenseList.length > 1) {
      console.log(`\nDescrição: ${description}`);
      console.log(`Quantidade: ${expenseList.length}`);
      expenseList.forEach((expense: any) => {
        console.log(`  - ID: ${expense.id}, Valor: R$ ${Number(expense.totalAmount).toLocaleString('pt-BR')}, Data: ${expense.dueDate}, Compra: ${expense.purchaseId}`);
      });
    }
  }
  
  // Verificar despesas sem purchaseId
  const orphanExpenses = expenses.filter(exp => !exp.purchaseId);
  console.log('\n=== Despesas sem purchaseId (órfãs) ===');
  console.log('Total de despesas órfãs:', orphanExpenses.length);
  const orphanTotal = orphanExpenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);
  console.log('Valor total de despesas órfãs: R$', orphanTotal.toLocaleString('pt-BR'));
  
  if (orphanExpenses.length > 0) {
    console.log('\nDetalhes das despesas órfãs:');
    orphanExpenses.forEach((expense: any) => {
      console.log(`  - ${expense.description}: R$ ${Number(expense.totalAmount).toLocaleString('pt-BR')} (ID: ${expense.id})`);
    });
  }
  
  // Calcular diferença esperada
  const valorCorreto = 11913013.72;
  const valorIncorreto = 13810269.29;
  const diferenca = valorIncorreto - valorCorreto;
  
  console.log('\n=== Análise da Diferença ===');
  console.log('Valor correto esperado: R$', valorCorreto.toLocaleString('pt-BR'));
  console.log('Valor incorreto observado: R$', valorIncorreto.toLocaleString('pt-BR'));
  console.log('Diferença: R$', diferenca.toLocaleString('pt-BR'));
  console.log('\nProcurando despesas que somam aproximadamente a diferença...');
  
  // Buscar combinações que possam resultar na diferença
  const tolerancia = 100; // R$ 100 de tolerância
  expenses.forEach((expense: any) => {
    const valor = Number(expense.totalAmount);
    if (Math.abs(valor - diferenca) < tolerancia) {
      console.log(`  - Possível despesa duplicada: ${expense.description} - R$ ${valor.toLocaleString('pt-BR')} (ID: ${expense.id})`);
    }
  });
  
  await prisma.$disconnect();
}

checkExpenses().catch(console.error);
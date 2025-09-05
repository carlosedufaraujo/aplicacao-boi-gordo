import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function analyzeExpenseDuplication() {
  // Buscar todas as despesas
  const allExpenses = await prisma.expense.findMany({
    include: {
      purchase: true,
      costCenter: true
    },
    orderBy: { description: 'asc' }
  });
  
  console.log('=== ANÁLISE DE DUPLICAÇÃO DE DESPESAS ===\n');
  console.log('Total de despesas no banco:', allExpenses.length);
  
  // Separar despesas órfãs e com purchaseId
  const orphanExpenses = allExpenses.filter(exp => !exp.purchaseId);
  const linkedExpenses = allExpenses.filter(exp => exp.purchaseId);
  
  console.log('Despesas órfãs (sem purchaseId):', orphanExpenses.length);
  console.log('Despesas vinculadas (com purchaseId):', linkedExpenses.length);
  
  // Calcular totais
  const orphanTotal = orphanExpenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);
  const linkedTotal = linkedExpenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);
  const grandTotal = allExpenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);
  
  console.log('\n=== VALORES ===');
  console.log('Total despesas órfãs: R$', orphanTotal.toLocaleString('pt-BR'));
  console.log('Total despesas vinculadas: R$', linkedTotal.toLocaleString('pt-BR'));
  console.log('TOTAL GERAL: R$', grandTotal.toLocaleString('pt-BR'));
  
  // Verificar se existem despesas duplicadas (mesma descrição e valor)
  console.log('\n=== ANÁLISE DE DUPLICAÇÃO ===');
  
  // Criar mapa para verificar duplicações
  const expenseMap = new Map<string, any[]>();
  
  allExpenses.forEach(exp => {
    // Extrair número do lote da descrição
    const loteMatch = exp.description.match(/LOT-(\d+)/);
    if (loteMatch) {
      const loteKey = loteMatch[1];
      const key = `${loteKey}-${exp.description.includes('Comissão') ? 'comissao' : 'compra'}`;
      
      if (!expenseMap.has(key)) {
        expenseMap.set(key, []);
      }
      expenseMap.get(key)!.push(exp);
    }
  });
  
  console.log('\nDespesas por lote (possíveis duplicações):');
  let duplicatedCount = 0;
  let duplicatedValue = 0;
  
  for (const [key, expenses] of expenseMap.entries()) {
    if (expenses.length > 1) {
      console.log(`\n${key}: ${expenses.length} registros`);
      expenses.forEach((exp: any) => {
        console.log(`  - ID: ${exp.id}`);
        console.log(`    Descrição: ${exp.description}`);
        console.log(`    Valor: R$ ${Number(exp.totalAmount).toLocaleString('pt-BR')}`);
        console.log(`    PurchaseId: ${exp.purchaseId || 'SEM VÍNCULO'}`);
      });
      
      // Considerar como duplicada apenas se uma tem purchaseId e outra não
      const hasOrphan = expenses.some(e => !e.purchaseId);
      const hasLinked = expenses.some(e => e.purchaseId);
      
      if (hasOrphan && hasLinked) {
        duplicatedCount++;
        // Somar o valor da despesa órfã (que é a duplicada)
        const orphan = expenses.find(e => !e.purchaseId);
        if (orphan) {
          duplicatedValue += Number(orphan.totalAmount);
        }
      }
    }
  }
  
  console.log('\n=== RESUMO DA DUPLICAÇÃO ===');
  console.log('Lotes com duplicação (órfã + vinculada):', duplicatedCount);
  console.log('Valor total duplicado: R$', duplicatedValue.toLocaleString('pt-BR'));
  
  console.log('\n=== SOLUÇÃO PROPOSTA ===');
  if (orphanExpenses.length > 0 && linkedExpenses.length > 0) {
    console.log('PROBLEMA IDENTIFICADO: Existem despesas duplicadas!');
    console.log('- Despesas órfãs são duplicatas das despesas vinculadas às compras');
    console.log('- Recomendação: DELETAR todas as despesas órfãs (sem purchaseId)');
    console.log(`- Isso removerá R$ ${orphanTotal.toLocaleString('pt-BR')} em duplicatas`);
    console.log(`- Valor final correto será: R$ ${linkedTotal.toLocaleString('pt-BR')}`);
  }
  
  await prisma.$disconnect();
}

analyzeExpenseDuplication().catch(console.error);
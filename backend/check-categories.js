const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  try {
    // Verificar quantas categorias existem no banco
    const categoriesCount = await prisma.category.count();
    console.log(`\n📊 Total de categorias no banco: ${categoriesCount}`);
    
    // Buscar todas as categorias
    const categories = await prisma.category.findMany({
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });
    
    // Separar por tipo
    const income = categories.filter(c => c.type === 'INCOME');
    const expense = categories.filter(c => c.type === 'EXPENSE');
    
    console.log(`\n💵 Categorias de RECEITA (${income.length}):`);
    income.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}, Default: ${cat.isDefault})`);
    });
    
    console.log(`\n💸 Categorias de DESPESA (${expense.length}):`);
    expense.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}, Default: ${cat.isDefault})`);
    });
    
    // Verificar cash flows
    const cashFlowCount = await prisma.cashFlow.count();
    console.log(`\n📈 Total de movimentações (cash_flows): ${cashFlowCount}`);
    
    // Verificar categorias órfãs (sem uso)
    const usedCategories = await prisma.cashFlow.findMany({
      select: { categoryId: true },
      distinct: ['categoryId']
    });
    
    const usedCategoryIds = new Set(usedCategories.map(cf => cf.categoryId));
    const unusedCategories = categories.filter(cat => !usedCategoryIds.has(cat.id));
    
    if (unusedCategories.length > 0) {
      console.log(`\n⚠️  Categorias sem uso (${unusedCategories.length}):`);
      unusedCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.type})`);
      });
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();

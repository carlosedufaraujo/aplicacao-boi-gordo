const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeCashFlows() {
  try {
    // Buscar todas as movimentações com suas categorias
    const cashFlows = await prisma.cashFlow.findMany({
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 20 // Últimas 20 movimentações
    });
    
    console.log(`\n📊 Análise das últimas ${cashFlows.length} movimentações:`);
    console.log('─'.repeat(80));
    
    // Agrupar por categoria
    const categoryUsage = {};
    
    cashFlows.forEach(flow => {
      const key = `${flow.category.name} (${flow.type})`;
      if (!categoryUsage[key]) {
        categoryUsage[key] = {
          count: 0,
          total: 0,
          categoryId: flow.category.id
        };
      }
      categoryUsage[key].count++;
      categoryUsage[key].total += flow.amount;
    });
    
    console.log('\n📈 Categorias em uso:');
    Object.entries(categoryUsage).forEach(([key, data]) => {
      console.log(`  - ${key}: ${data.count} movimentações, Total: R$ ${data.total.toFixed(2)}`);
    });
    
    // Mostrar detalhes das movimentações
    console.log('\n📝 Detalhes das movimentações:');
    cashFlows.forEach(flow => {
      const status = flow.status === 'PAID' ? '✅' : flow.status === 'RECEIVED' ? '💰' : '⏳';
      console.log(`  ${status} ${flow.date.toISOString().split('T')[0]} | ${flow.type} | ${flow.category.name} | R$ ${flow.amount.toFixed(2)} | ${flow.description}`);
    });
    
    // Verificar categorias customizadas
    const customCategories = await prisma.category.findMany({
      where: {
        isDefault: false
      }
    });
    
    if (customCategories.length > 0) {
      console.log(`\n🎨 Categorias customizadas (${customCategories.length}):`);
      customCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.type}) - ID: ${cat.id}`);
      });
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCashFlows();

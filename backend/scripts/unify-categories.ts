import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unifyCategories() {
  console.log('🔄 Iniciando unificação de categorias...');
  
  try {
    // Mapeamento de categorias antigas para novas
    const categoryMapping = {
      'COMPRA_GADO': 'animal_purchase',
      'TRANSPORTE': 'freight',
      'COMISSAO': 'commission',
      'COMPRA_ANIMAIS': 'animal_purchase',
      'FRETE': 'freight',
    };

    // Atualizar despesas com categorias antigas
    for (const [oldCategory, newCategory] of Object.entries(categoryMapping)) {
      const result = await prisma.expense.updateMany({
        where: { category: oldCategory },
        data: { category: newCategory }
      });
      
      if (result.count > 0) {
        console.log(`✅ Atualizadas ${result.count} despesas de "${oldCategory}" para "${newCategory}"`);
      }
    }

    // Verificar o resultado
    const categories = await prisma.expense.groupBy({
      by: ['category'],
      _count: true,
      _sum: {
        totalAmount: true
      }
    });

    console.log('\n📊 Categorias após unificação:');
    categories.forEach(cat => {
      console.log(`  - ${cat.category}: ${cat._count} registros, Total: R$ ${cat._sum.totalAmount?.toFixed(2) || '0.00'}`);
    });

    console.log('\n✨ Unificação concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao unificar categorias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

unifyCategories();
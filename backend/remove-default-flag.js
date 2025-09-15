const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeDefaultFlag() {
  console.log('🔄 Removendo flag isDefault de todas as categorias...\n');

  try {
    // Atualizar todas as categorias para isDefault = false
    const result = await prisma.category.updateMany({
      where: {
        isDefault: true
      },
      data: {
        isDefault: false
      }
    });

    console.log(`✅ ${result.count} categorias atualizadas`);
    console.log('📝 Todas as categorias agora podem ser editadas e excluídas (se não estiverem em uso)');

    // Verificar resultado
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        type: true,
        isDefault: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('\n📊 Status das categorias:');
    const defaultCount = categories.filter(c => c.isDefault).length;
    console.log(`  - Total de categorias: ${categories.length}`);
    console.log(`  - Categorias marcadas como padrão: ${defaultCount}`);

    if (defaultCount === 0) {
      console.log('\n✅ Sucesso! Nenhuma categoria está mais marcada como padrão.');
      console.log('   Todas podem ser editadas e excluídas (se não estiverem em uso).');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

removeDefaultFlag();
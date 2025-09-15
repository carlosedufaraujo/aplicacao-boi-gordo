const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeIcons() {
  console.log('🔄 Removendo ícones de todas as categorias...\n');

  try {
    // Remover ícones de todas as categorias
    const result = await prisma.category.updateMany({
      where: {
        icon: { not: null }
      },
      data: {
        icon: null
      }
    });

    console.log(`✅ ${result.count} categorias atualizadas`);
    console.log('📝 Todos os ícones foram removidos');

    // Verificar resultado
    const categoriesWithIcons = await prisma.category.count({
      where: {
        icon: { not: null }
      }
    });

    if (categoriesWithIcons === 0) {
      console.log('\n✅ Sucesso! Nenhuma categoria possui ícone agora.');
    } else {
      console.log(`\n⚠️ Ainda existem ${categoriesWithIcons} categorias com ícones`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

removeIcons();
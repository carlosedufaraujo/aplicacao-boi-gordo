const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mapeamento das categorias antigas para as novas (padrão do sistema)
const CATEGORY_MAPPING = {
  'cattle-purchase': 'cat-exp-01', // Compra de Gado
  'commission': 'cat-exp-03',      // Comissão de Compra
  'freight': 'cat-exp-02',         // Frete de Gado (caso exista)
};

async function corrigirCategoriasCashFlow() {
  try {
    console.log('🔄 Iniciando correção de categorias no Cash Flow...');

    // Buscar todos os registros
    const allRecords = await prisma.cashFlow.findMany({
      select: {
        id: true,
        categoryId: true,
        description: true,
        type: true
      }
    });

    console.log(`📊 Total de registros encontrados: ${allRecords.length}`);

    // Analisar categorias atuais
    const currentCategories = {};
    allRecords.forEach(record => {
      if (!currentCategories[record.categoryId]) {
        currentCategories[record.categoryId] = 0;
      }
      currentCategories[record.categoryId]++;
    });

    console.log('\n📋 Categorias atuais:');
    Object.entries(currentCategories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} registros`);
    });

    // Identificar registros que precisam de correção
    const toUpdate = allRecords.filter(record => 
      CATEGORY_MAPPING.hasOwnProperty(record.categoryId)
    );

    console.log(`\n🔧 Registros que precisam de correção: ${toUpdate.length}`);

    if (toUpdate.length === 0) {
      console.log('✅ Nenhuma correção necessária!');
      return;
    }

    // Mostrar o que será alterado
    console.log('\n📝 Alterações planejadas:');
    Object.entries(CATEGORY_MAPPING).forEach(([oldId, newId]) => {
      const count = currentCategories[oldId] || 0;
      if (count > 0) {
        console.log(`   ${oldId} → ${newId} (${count} registros)`);
      }
    });

    // Confirmar ação
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmar = await new Promise(resolve => {
      rl.question(`\n⚠️  Deseja prosseguir com a correção? (s/N): `, (answer) => {
        resolve(answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim');
      });
    });

    rl.close();

    if (!confirmar) {
      console.log('❌ Operação cancelada.');
      return;
    }

    // Executar correções
    console.log('\n🔄 Iniciando correção...');
    let updatedCount = 0;

    for (const record of toUpdate) {
      const newCategoryId = CATEGORY_MAPPING[record.categoryId];
      
      await prisma.cashFlow.update({
        where: { id: record.id },
        data: { categoryId: newCategoryId }
      });

      updatedCount++;
      console.log(`✅ ${record.description} - ${record.categoryId} → ${newCategoryId}`);
    }

    console.log(`\n✅ Correção concluída!`);
    console.log(`   Registros atualizados: ${updatedCount}`);

    // Verificar resultado final
    const finalRecords = await prisma.cashFlow.findMany({
      select: { categoryId: true }
    });

    const finalCategories = {};
    finalRecords.forEach(record => {
      if (!finalCategories[record.categoryId]) {
        finalCategories[record.categoryId] = 0;
      }
      finalCategories[record.categoryId]++;
    });

    console.log('\n📊 Categorias finais:');
    Object.entries(finalCategories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} registros`);
    });

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  corrigirCategoriasCashFlow();
}

module.exports = { corrigirCategoriasCashFlow, CATEGORY_MAPPING };
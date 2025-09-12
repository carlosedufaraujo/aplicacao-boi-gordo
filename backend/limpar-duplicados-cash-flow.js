const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function limparDuplicadosCashFlow() {
  try {
    console.log('🔄 Iniciando limpeza de duplicados no Cash Flow...');

    // Buscar todos os registros
    const allRecords = await prisma.cashFlow.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Total de registros encontrados: ${allRecords.length}`);

    // Agrupar por combinação de reference + categoryId + type
    const groups = {};
    allRecords.forEach(record => {
      const key = `${record.reference || 'no-ref'}_${record.categoryId}_${record.type}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
    });

    let totalToDelete = 0;
    let duplicateGroups = 0;

    // Identificar duplicados
    Object.entries(groups).forEach(([key, records]) => {
      if (records.length > 1) {
        duplicateGroups++;
        totalToDelete += (records.length - 1); // Manter apenas o mais recente
        console.log(`🔍 Grupo "${key}": ${records.length} registros duplicados`);
      }
    });

    console.log(`\n📈 Resumo:`);
    console.log(`   Grupos duplicados: ${duplicateGroups}`);
    console.log(`   Registros a deletar: ${totalToDelete}`);
    console.log(`   Registros a manter: ${allRecords.length - totalToDelete}`);

    if (totalToDelete === 0) {
      console.log('✅ Nenhum duplicado encontrado!');
      return;
    }

    // Confirmar ação
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmar = await new Promise(resolve => {
      rl.question(`\n⚠️  Deseja prosseguir com a limpeza? (s/N): `, (answer) => {
        resolve(answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim');
      });
    });

    rl.close();

    if (!confirmar) {
      console.log('❌ Operação cancelada.');
      return;
    }

    // Executar limpeza
    console.log('\n🗑️  Iniciando limpeza...');
    let deletedCount = 0;

    for (const [key, records] of Object.entries(groups)) {
      if (records.length > 1) {
        // Ordenar por data de criação (mais recente primeiro)
        records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Manter o primeiro (mais recente), deletar os outros
        const toKeep = records[0];
        const toDelete = records.slice(1);

        console.log(`🔧 Processando "${key}": mantendo ${toKeep.id}, deletando ${toDelete.length} registros...`);

        for (const record of toDelete) {
          await prisma.cashFlow.delete({
            where: { id: record.id }
          });
          deletedCount++;
        }
      }
    }

    console.log(`\n✅ Limpeza concluída!`);
    console.log(`   Registros deletados: ${deletedCount}`);
    console.log(`   Registros restantes: ${allRecords.length - deletedCount}`);

    // Verificar resultado final
    const finalCount = await prisma.cashFlow.count();
    console.log(`📊 Contagem final no banco: ${finalCount}`);

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  limparDuplicadosCashFlow();
}

module.exports = { limparDuplicadosCashFlow };
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDuplicateDREs() {
  console.log('🧹 Iniciando limpeza de DREs duplicados...\n');

  try {
    // Buscar todos os DREs agrupados por mês
    const allDREs = await prisma.dREStatement.findMany({
      orderBy: [
        { referenceMonth: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Agrupar por referenceMonth
    const dresByMonth = new Map<string, typeof allDREs>();
    
    for (const dre of allDREs) {
      const monthKey = dre.referenceMonth.toISOString();
      if (!dresByMonth.has(monthKey)) {
        dresByMonth.set(monthKey, []);
      }
      dresByMonth.get(monthKey)!.push(dre);
    }

    console.log(`📊 Encontrados ${allDREs.length} DREs no total`);
    console.log(`📅 ${dresByMonth.size} meses únicos\n`);

    // Processar cada mês
    for (const [month, dres] of dresByMonth) {
      if (dres.length > 1) {
        console.log(`\n🔍 Mês ${month.substring(0, 7)} tem ${dres.length} DREs:`);
        
        // Encontrar o DRE com maior dedução (provavelmente tem mortalidade)
        let mainDRE = dres[0];
        let maxDeductions = 0;
        
        for (const dre of dres) {
          console.log(`  - ID: ${dre.id.substring(0, 8)}... | Ciclo: ${dre.cycleId || 'null'} | Deduções: R$ ${dre.deductions.toFixed(2)}`);
          if (dre.deductions > maxDeductions) {
            maxDeductions = dre.deductions;
            mainDRE = dre;
          }
        }
        
        console.log(`  ✅ Mantendo DRE ${mainDRE.id.substring(0, 8)}... com deduções de R$ ${maxDeductions.toFixed(2)}`);
        
        // Deletar os outros DREs
        for (const dre of dres) {
          if (dre.id !== mainDRE.id) {
            console.log(`  ❌ Deletando DRE duplicado ${dre.id.substring(0, 8)}...`);
            await prisma.dREStatement.delete({
              where: { id: dre.id }
            });
          }
        }
      }
    }

    console.log('\n✨ Limpeza concluída com sucesso!');
    
    // Mostrar estatísticas finais
    const finalCount = await prisma.dREStatement.count();
    console.log(`\n📊 Estatísticas finais:`);
    console.log(`  - DREs antes: ${allDREs.length}`);
    console.log(`  - DREs depois: ${finalCount}`);
    console.log(`  - DREs removidos: ${allDREs.length - finalCount}`);
    
  } catch (error) {
    console.error('❌ Erro ao limpar DREs duplicados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanDuplicateDREs();
}

export default cleanDuplicateDREs;
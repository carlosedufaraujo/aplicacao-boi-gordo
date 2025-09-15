const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function atualizarCapacidadeCurrais() {
  try {
    console.log('🐮 Atualizando capacidade de todos os currais para 150 animais...\n');

    // Buscar todos os currais
    const currais = await prisma.pen.findMany({
      orderBy: { penNumber: 'asc' }
    });

    console.log(`📊 Total de currais encontrados: ${currais.length}`);
    console.log('────────────────────────────────────────\n');

    let atualizados = 0;
    let jaCorretos = 0;

    for (const curral of currais) {
      if (curral.capacity !== 150) {
        // Atualizar capacidade para 150
        await prisma.pen.update({
          where: { id: curral.id },
          data: { capacity: 150 }
        });

        console.log(`✅ ${curral.penNumber} - Atualizado de ${curral.capacity} para 150 animais`);
        atualizados++;
      } else {
        console.log(`✓  ${curral.penNumber} - Já possui capacidade de 150 animais`);
        jaCorretos++;
      }
    }

    console.log('\n────────────────────────────────────────');
    console.log('📈 RESUMO DA ATUALIZAÇÃO:');
    console.log(`✅ Currais atualizados: ${atualizados}`);
    console.log(`✓  Já estavam corretos: ${jaCorretos}`);
    console.log(`📊 Total de currais: ${currais.length}`);
    console.log(`🐄 Capacidade total do sistema: ${currais.length * 150} animais`);
    console.log('────────────────────────────────────────\n');

    // Verificar atualização
    const verificacao = await prisma.pen.groupBy({
      by: ['capacity'],
      _count: true
    });

    console.log('🔍 Verificação das capacidades:');
    verificacao.forEach(v => {
      console.log(`   Capacidade ${v.capacity}: ${v._count} currais`);
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar currais:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✨ Processo finalizado!');
  }
}

// Executar atualização
atualizarCapacidadeCurrais();
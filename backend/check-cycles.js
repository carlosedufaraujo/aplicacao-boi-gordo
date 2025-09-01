const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCycles() {
  try {
    console.log('🔍 Verificando ciclos no banco de dados...\n');
    
    // Buscar todos os ciclos
    const cycles = await prisma.cycle.findMany({
      orderBy: {
        startDate: 'desc'
      }
    });
    
    if (cycles.length === 0) {
      console.log('❌ Nenhum ciclo encontrado no banco!');
      console.log('\n💡 Use o comando: node seed-cycles-prisma.js para criar ciclos de teste');
    } else {
      console.log(`📊 Total de ciclos encontrados: ${cycles.length}\n`);
      
      cycles.forEach((cycle, index) => {
        console.log(`🔄 Ciclo ${index + 1}:`);
        console.log(`   📛 Nome: ${cycle.name}`);
        console.log(`   📝 Descrição: ${cycle.description || 'Sem descrição'}`);
        console.log(`   📅 Início: ${cycle.startDate.toLocaleDateString('pt-BR')}`);
        console.log(`   📅 Fim: ${cycle.endDate ? cycle.endDate.toLocaleDateString('pt-BR') : 'Em andamento'}`);
        console.log(`   📊 Status: ${cycle.status}`);
        
        if (cycle.status === 'ACTIVE') {
          console.log(`   ✅ ESTE É O CICLO ATIVO ATUAL`);
        }
        
        console.log('');
      });
      
      // Verificar se existe ciclo ativo
      const activeCycle = cycles.find(c => c.status === 'ACTIVE');
      if (!activeCycle) {
        console.log('⚠️  Nenhum ciclo ATIVO encontrado!');
        console.log('💡 Todas as novas operações precisam de um ciclo ativo.');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCycles();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCycles() {
  try {
    // Verificar se já existem ciclos
    const existingCount = await prisma.cycle.count();
    
    if (existingCount > 0) {
      console.log(`✅ Já existem ${existingCount} ciclos no banco`);
      return;
    }

    // Criar ciclos
    const cycles = [
      {
        name: 'Ciclo 2024/1 - Confinamento',
        description: 'Primeiro ciclo de 2024',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        status: 'COMPLETED'
      },
      {
        name: 'Ciclo 2024/2 - Expansão',
        description: 'Segundo ciclo de 2024 com foco em expansão',
        startDate: new Date('2024-07-01'),
        endDate: null,
        status: 'ACTIVE'
      }
    ];

    // Inserir ciclos
    for (const cycle of cycles) {
      const created = await prisma.cycle.create({
        data: cycle
      });
      
      console.log(`✅ Ciclo "${created.name}" criado`);
      console.log(`   📅 Início: ${created.startDate.toLocaleDateString('pt-BR')}`);
      console.log(`   📊 Status: ${created.status}`);
      console.log('');
    }

    console.log('\n📊 Ciclos criados com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedCycles();
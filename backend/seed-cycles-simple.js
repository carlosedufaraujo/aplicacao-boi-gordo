const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCycles() {
  try {
    // Verificar se a tabela cycles existe e quantos registros tem
    const existingCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM cycles
    `.catch(() => null);
    
    if (existingCount && parseInt(existingCount[0].count) > 0) {
      console.log(`✅ Já existem ${existingCount[0].count} ciclos no banco`);
      return;
    }

    // Criar ciclos usando comandos SQL mais simples
    const cycles = [
      {
        name: 'Ciclo 2024/1 - Confinamento',
        description: 'Primeiro ciclo de 2024',
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        status: 'COMPLETED'
      },
      {
        name: 'Ciclo 2024/2 - Expansão',
        description: 'Segundo ciclo de 2024',
        startDate: '2024-07-01',
        endDate: null,
        status: 'ACTIVE'
      }
    ];

    // Inserir ciclos
    for (const cycle of cycles) {
      try {
        // Tentar inserir com campos mínimos
        await prisma.$executeRaw`
          INSERT INTO cycles (
            id,
            name, 
            description, 
            "startDate", 
            "endDate", 
            status
          ) VALUES (
            gen_random_uuid(),
            ${cycle.name},
            ${cycle.description},
            ${cycle.startDate}::timestamp,
            ${cycle.endDate}::timestamp,
            ${cycle.status}::"CycleStatus"
          )
        `;
        
        console.log(`✅ Ciclo "${cycle.name}" criado`);
        console.log(`   📅 Início: ${cycle.startDate}`);
        console.log(`   📊 Status: ${cycle.status}`);
        console.log('');
        
      } catch (error) {
        console.log(`⚠️ Erro ao criar ciclo ${cycle.name}:`, error.message);
        
        // Tentar alternativa sem campos que podem não existir
        try {
          await prisma.$executeRaw`
            INSERT INTO cycles (name, description, "startDate", status) 
            VALUES (${cycle.name}, ${cycle.description}, ${cycle.startDate}::timestamp, ${cycle.status}::"CycleStatus")
          `;
          console.log(`✅ Ciclo "${cycle.name}" criado (versão simplificada)`);
        } catch (error2) {
          console.log(`❌ Falha ao criar ciclo ${cycle.name}`);
        }
      }
    }

    console.log('\n📊 Ciclos processados com sucesso!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedCycles();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createCycleTable() {
  try {
    // Primeiro, vamos criar a tabela se não existir
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS cycles (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        status TEXT DEFAULT 'PLANNED',
        "targetAnimals" INTEGER,
        budget DOUBLE PRECISION,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('✅ Tabela cycles criada/verificada');
    
  } catch (error) {
    console.log('ℹ️ Tabela cycles já existe ou erro:', error.message);
  }
}

async function seedCycles() {
  try {
    // Verificar se já existem ciclos usando Prisma ORM
    const existingCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM cycles
    `;
    
    if (parseInt(existingCount[0].count) > 0) {
      console.log(`✅ Já existem ${existingCount[0].count} ciclos no banco`);
      return;
    }

    // Criar ciclos
    const cycles = [
      {
        name: 'Ciclo 2024/1 - Confinamento Intensivo',
        description: 'Primeiro ciclo de 2024 focado em confinamento intensivo com meta de 500 animais',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        status: 'COMPLETED',
        targetAnimals: 500,
        budget: 2500000.00
      },
      {
        name: 'Ciclo 2024/2 - Expansão',
        description: 'Segundo ciclo de 2024 com expansão da capacidade e meta de 800 animais',
        startDate: new Date('2024-07-01'),
        endDate: null,
        status: 'ACTIVE',
        targetAnimals: 800,
        budget: 4000000.00
      }
    ];

    // Inserir ciclos usando SQL direto com CAST para enum
    for (const cycle of cycles) {
      await prisma.$executeRaw`
        INSERT INTO cycles (
          name, 
          description, 
          "startDate", 
          "endDate", 
          status, 
          "targetAnimals", 
          budget
        ) VALUES (
          ${cycle.name},
          ${cycle.description},
          ${cycle.startDate},
          ${cycle.endDate},
          ${cycle.status}::"CycleStatus",
          ${cycle.targetAnimals},
          ${cycle.budget}
        )
      `;
      
      console.log(`✅ Ciclo "${cycle.name}" criado`);
      console.log(`   📅 Período: ${cycle.startDate.toLocaleDateString('pt-BR')} - ${cycle.endDate ? cycle.endDate.toLocaleDateString('pt-BR') : 'Em andamento'}`);
      console.log(`   🎯 Meta: ${cycle.targetAnimals} animais`);
      console.log(`   💰 Orçamento: R$ ${cycle.budget.toLocaleString('pt-BR')}`);
      console.log(`   📊 Status: ${cycle.status}`);
      console.log('');
    }

    console.log('\n📊 Resumo:');
    console.log(`✅ ${cycles.length} ciclos criados`);
    console.log(`🎯 Meta total: ${cycles.reduce((sum, c) => sum + c.targetAnimals, 0)} animais`);
    console.log(`💰 Orçamento total: R$ ${cycles.reduce((sum, c) => sum + c.budget, 0).toLocaleString('pt-BR')}`);

  } catch (error) {
    console.error('❌ Erro ao criar ciclos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCycles();
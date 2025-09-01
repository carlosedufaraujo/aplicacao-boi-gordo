const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPens() {
  try {
    // Verificar se já existem currais
    const existingPens = await prisma.pen.count();
    
    if (existingPens > 0) {
      console.log(`✅ Já existem ${existingPens} currais no banco`);
      return;
    }

    // Criar currais de exemplo
    const pens = [
      { penNumber: 'C01', capacity: 100, location: 'Setor A', status: 'AVAILABLE' },
      { penNumber: 'C02', capacity: 150, location: 'Setor A', status: 'AVAILABLE' },
      { penNumber: 'C03', capacity: 120, location: 'Setor B', status: 'AVAILABLE' },
      { penNumber: 'C04', capacity: 80, location: 'Setor B', status: 'AVAILABLE' },
      { penNumber: 'C05', capacity: 200, location: 'Setor C', status: 'AVAILABLE' },
    ];

    for (const pen of pens) {
      await prisma.pen.create({ data: pen });
      console.log(`✅ Curral ${pen.penNumber} criado - Capacidade: ${pen.capacity} animais`);
    }

    console.log('\n🎯 5 currais criados com sucesso!');
    console.log('Capacidade total: 650 animais');

  } catch (error) {
    console.error('❌ Erro ao criar currais:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPens();
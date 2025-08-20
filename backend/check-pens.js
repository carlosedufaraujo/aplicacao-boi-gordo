const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPens() {
  try {
    // Busca todos os currais
    const pens = await prisma.pen.findMany({
      orderBy: {
        penNumber: 'asc'
      }
    });

    console.log(`\n=== TOTAL DE CURRAIS: ${pens.length} ===\n`);
    
    // Lista todos os currais
    pens.forEach((pen, index) => {
      console.log(`${index + 1}. Curral ${pen.penNumber} - Capacidade: ${pen.capacity} - Status: ${pen.status} - Tipo: ${pen.type}`);
    });

    // Agrupa por status
    const byStatus = pens.reduce((acc, pen) => {
      acc[pen.status] = (acc[pen.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n=== RESUMO POR STATUS ===');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`${status}: ${count} currais`);
    });

    // Capacidade total
    const totalCapacity = pens.reduce((sum, pen) => sum + pen.capacity, 0);
    console.log(`\n=== CAPACIDADE TOTAL: ${totalCapacity} animais ===`);

  } catch (error) {
    console.error('Erro ao buscar currais:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPens();
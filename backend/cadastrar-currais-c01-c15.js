const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cadastrarCurraisFaltantes() {
  console.log('🏗️ CADASTRANDO CURRAIS C-01 e C-15');
  console.log('=====================================\n');
  
  const curraisFaltantes = [
    { penNumber: 'C-01', capacity: 100, location: 'Setor C' },
    { penNumber: 'C-15', capacity: 100, location: 'Setor C' }
  ];
  
  for (const curral of curraisFaltantes) {
    try {
      await prisma.pen.create({
        data: {
          penNumber: curral.penNumber,
          capacity: curral.capacity,
          type: 'FATTENING',
          status: 'AVAILABLE',
          location: curral.location,
          isActive: true
        }
      });
      console.log(`✅ Curral ${curral.penNumber} criado com sucesso`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️ Curral ${curral.penNumber} já existe`);
      } else {
        console.error(`❌ Erro ao criar curral ${curral.penNumber}:`, error.message);
      }
    }
  }
  
  const totalCurrais = await prisma.pen.count();
  console.log(`\n📊 Total de currais no sistema agora: ${totalCurrais}`);
  
  await prisma.$disconnect();
}

cadastrarCurraisFaltantes().catch(console.error);
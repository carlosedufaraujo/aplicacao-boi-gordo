const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cadastrarCurraisFaltantes() {
  console.log('🏗️ CADASTRANDO CURRAIS FALTANTES');
  console.log('==================================\n');
  
  // Currais que precisam ser criados
  const curraisFaltantes = [
    { penNumber: 'D-01', capacity: 100, location: 'Setor D' },
    { penNumber: 'D-05', capacity: 100, location: 'Setor D' },
    { penNumber: 'D-06', capacity: 120, location: 'Setor D' },
    { penNumber: 'E-01', capacity: 110, location: 'Setor E' },
    { penNumber: 'E-03', capacity: 110, location: 'Setor E' },
    { penNumber: 'E-13', capacity: 100, location: 'Setor E' },
    { penNumber: 'H-01', capacity: 130, location: 'Setor H' },
    { penNumber: 'H-02', capacity: 130, location: 'Setor H' },
    { penNumber: 'L-03', capacity: 120, location: 'Setor L' },
    { penNumber: 'L-04', capacity: 120, location: 'Setor L' },
    { penNumber: 'L-07', capacity: 100, location: 'Setor L' },
    { penNumber: 'N-09', capacity: 110, location: 'Setor N' },
    { penNumber: 'N-10', capacity: 110, location: 'Setor N' },
    { penNumber: 'O-02', capacity: 80, location: 'Setor O' },
    { penNumber: 'P-08', capacity: 90, location: 'Setor P' },
    { penNumber: 'Q-03', capacity: 100, location: 'Setor Q' }
  ];
  
  let criados = 0;
  let erros = 0;
  
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
      criados++;
      console.log(`✅ Curral ${curral.penNumber} criado com sucesso`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️ Curral ${curral.penNumber} já existe`);
      } else {
        console.error(`❌ Erro ao criar curral ${curral.penNumber}:`, error.message);
        erros++;
      }
    }
  }
  
  console.log('\n📊 RESUMO:');
  console.log(`✅ Currais criados: ${criados}`);
  console.log(`❌ Erros: ${erros}`);
  
  // Verificar total de currais
  const totalCurrais = await prisma.pen.count();
  console.log(`\n📊 Total de currais no sistema: ${totalCurrais}`);
  
  await prisma.$disconnect();
}

cadastrarCurraisFaltantes();
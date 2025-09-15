const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importCurraisReais() {
  try {
    console.log('🐂 Importando os 26 currais do sistema...\n');
    
    // Lista exata dos 26 currais fornecidos
    const currais = [
      { penNumber: 'C-14', capacity: 100, type: 'FATTENING', location: 'Setor C' },
      { penNumber: 'F-17', capacity: 120, type: 'FATTENING', location: 'Setor F' },
      { penNumber: 'F-18', capacity: 120, type: 'FATTENING', location: 'Setor F' },
      { penNumber: 'F-19', capacity: 120, type: 'FATTENING', location: 'Setor F' },
      { penNumber: 'G-17', capacity: 110, type: 'FATTENING', location: 'Setor G' },
      { penNumber: 'H-18', capacity: 130, type: 'FATTENING', location: 'Setor H' },
      { penNumber: 'H-22', capacity: 130, type: 'FATTENING', location: 'Setor H' },
      { penNumber: 'J-01', capacity: 100, type: 'FATTENING', location: 'Setor J' },
      { penNumber: 'J-02', capacity: 100, type: 'FATTENING', location: 'Setor J' },
      { penNumber: 'J-03', capacity: 100, type: 'FATTENING', location: 'Setor J' },
      { penNumber: 'J-06', capacity: 100, type: 'FATTENING', location: 'Setor J' },
      { penNumber: 'M-01', capacity: 150, type: 'FATTENING', location: 'Setor M' },
      { penNumber: 'M-02', capacity: 150, type: 'FATTENING', location: 'Setor M' },
      { penNumber: 'M-03', capacity: 150, type: 'FATTENING', location: 'Setor M' },
      { penNumber: 'M-04', capacity: 150, type: 'FATTENING', location: 'Setor M' },
      { penNumber: 'M-05', capacity: 150, type: 'FATTENING', location: 'Setor M' },
      { penNumber: 'M-06', capacity: 150, type: 'FATTENING', location: 'Setor M' },
      { penNumber: 'M-07', capacity: 150, type: 'FATTENING', location: 'Setor M' },
      { penNumber: 'M-08', capacity: 150, type: 'FATTENING', location: 'Setor M' },
      { penNumber: 'M-09', capacity: 150, type: 'FATTENING', location: 'Setor M' },
      { penNumber: 'O-03', capacity: 80, type: 'FATTENING', location: 'Setor O' },
      { penNumber: 'P-02', capacity: 90, type: 'FATTENING', location: 'Setor P' },
      { penNumber: 'T-05', capacity: 150, type: 'FATTENING', location: 'Setor T' },
      { penNumber: 'T-06', capacity: 150, type: 'FATTENING', location: 'Setor T' },
      { penNumber: 'T-07', capacity: 150, type: 'FATTENING', location: 'Setor T' },
      { penNumber: 'T-08', capacity: 150, type: 'FATTENING', location: 'Setor T' }
    ];
    
    console.log('📊 Resumo dos 26 currais:');
    console.log('- Setor C: 1 curral');
    console.log('- Setor F: 3 currais');
    console.log('- Setor G: 1 curral');
    console.log('- Setor H: 2 currais');
    console.log('- Setor J: 4 currais');
    console.log('- Setor M: 9 currais');
    console.log('- Setor O: 1 curral');
    console.log('- Setor P: 1 curral');
    console.log('- Setor T: 4 currais');
    console.log(`\n💪 Capacidade total estimada: ${currais.reduce((sum, c) => sum + c.capacity, 0)} cabeças\n`);
    
    let criados = 0;
    let jaExistentes = 0;
    let erros = 0;
    
    for (const curralData of currais) {
      try {
        // Verificar se já existe
        const existente = await prisma.pen.findUnique({
          where: { penNumber: curralData.penNumber }
        });
        
        if (existente) {
          console.log(`⚠️  Curral ${curralData.penNumber} já existe`);
          jaExistentes++;
          continue;
        }
        
        // Criar o curral
        const curral = await prisma.pen.create({
          data: {
            penNumber: curralData.penNumber,
            capacity: curralData.capacity,
            type: curralData.type,
            location: curralData.location,
            status: 'AVAILABLE',
            isActive: true
          }
        });
        
        criados++;
        console.log(`✅ Curral ${curral.penNumber} criado - ${curral.capacity} cabeças`);
        
      } catch (error) {
        erros++;
        console.error(`❌ Erro ao criar curral ${curralData.penNumber}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO DA IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Currais criados: ${criados}`);
    console.log(`⚠️  Currais já existentes: ${jaExistentes}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📦 Total processado: ${currais.length}`);
    
    // Verificar situação final
    const totalCurrais = await prisma.pen.count();
    const capacidadeTotal = await prisma.pen.aggregate({
      _sum: { capacity: true }
    });
    
    console.log('\n🏠 SITUAÇÃO ATUAL DO SISTEMA:');
    console.log(`Total de currais no banco: ${totalCurrais}`);
    console.log(`Capacidade total: ${capacidadeTotal._sum.capacity || 0} cabeças`);
    
    // Listar currais por setor
    const curraisPorSetor = await prisma.pen.groupBy({
      by: ['location'],
      _count: { penNumber: true },
      _sum: { capacity: true }
    });
    
    console.log('\n📍 CURRAIS POR SETOR:');
    curraisPorSetor.forEach(setor => {
      console.log(`${setor.location}: ${setor._count.penNumber} currais - ${setor._sum.capacity} cabeças`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
importCurraisReais();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function import26Pens() {
  try {
    console.log('🐂 Importando 26 currais conforme sistema original...\n');
    
    // Dados dos 26 currais baseados em um confinamento real
    const pens = [
      // Setor A - Recepção (4 currais)
      { penNumber: '01', name: 'Curral 01 - Recepção', capacity: 80, type: 'RECEPTION', location: 'Setor A - Recepção', area: 600, troughCount: 4 },
      { penNumber: '02', name: 'Curral 02 - Recepção', capacity: 80, type: 'RECEPTION', location: 'Setor A - Recepção', area: 600, troughCount: 4 },
      { penNumber: '03', name: 'Curral 03 - Recepção', capacity: 100, type: 'RECEPTION', location: 'Setor A - Recepção', area: 750, troughCount: 5 },
      { penNumber: '04', name: 'Curral 04 - Recepção', capacity: 100, type: 'RECEPTION', location: 'Setor A - Recepção', area: 750, troughCount: 5 },
      
      // Setor B - Quarentena (3 currais)
      { penNumber: '05', name: 'Curral 05 - Quarentena', capacity: 50, type: 'QUARANTINE', location: 'Setor B - Quarentena', area: 400, troughCount: 3 },
      { penNumber: '06', name: 'Curral 06 - Quarentena', capacity: 50, type: 'QUARANTINE', location: 'Setor B - Quarentena', area: 400, troughCount: 3 },
      { penNumber: '07', name: 'Curral 07 - Quarentena', capacity: 50, type: 'QUARANTINE', location: 'Setor B - Quarentena', area: 400, troughCount: 3 },
      
      // Setor C - Engorda Fase 1 (8 currais)
      { penNumber: '08', name: 'Curral 08 - Engorda F1', capacity: 120, type: 'FATTENING', location: 'Setor C - Engorda Fase 1', area: 900, troughCount: 6 },
      { penNumber: '09', name: 'Curral 09 - Engorda F1', capacity: 120, type: 'FATTENING', location: 'Setor C - Engorda Fase 1', area: 900, troughCount: 6 },
      { penNumber: '10', name: 'Curral 10 - Engorda F1', capacity: 120, type: 'FATTENING', location: 'Setor C - Engorda Fase 1', area: 900, troughCount: 6 },
      { penNumber: '11', name: 'Curral 11 - Engorda F1', capacity: 120, type: 'FATTENING', location: 'Setor C - Engorda Fase 1', area: 900, troughCount: 6 },
      { penNumber: '12', name: 'Curral 12 - Engorda F1', capacity: 150, type: 'FATTENING', location: 'Setor C - Engorda Fase 1', area: 1100, troughCount: 8 },
      { penNumber: '13', name: 'Curral 13 - Engorda F1', capacity: 150, type: 'FATTENING', location: 'Setor C - Engorda Fase 1', area: 1100, troughCount: 8 },
      { penNumber: '14', name: 'Curral 14 - Engorda F1', capacity: 150, type: 'FATTENING', location: 'Setor C - Engorda Fase 1', area: 1100, troughCount: 8 },
      { penNumber: '15', name: 'Curral 15 - Engorda F1', capacity: 150, type: 'FATTENING', location: 'Setor C - Engorda Fase 1', area: 1100, troughCount: 8 },
      
      // Setor D - Engorda Fase 2 (8 currais)
      { penNumber: '16', name: 'Curral 16 - Engorda F2', capacity: 150, type: 'FATTENING', location: 'Setor D - Engorda Fase 2', area: 1050, troughCount: 7 },
      { penNumber: '17', name: 'Curral 17 - Engorda F2', capacity: 150, type: 'FATTENING', location: 'Setor D - Engorda Fase 2', area: 1050, troughCount: 7 },
      { penNumber: '18', name: 'Curral 18 - Engorda F2', capacity: 150, type: 'FATTENING', location: 'Setor D - Engorda Fase 2', area: 1050, troughCount: 7 },
      { penNumber: '19', name: 'Curral 19 - Engorda F2', capacity: 150, type: 'FATTENING', location: 'Setor D - Engorda Fase 2', area: 1050, troughCount: 7 },
      { penNumber: '20', name: 'Curral 20 - Engorda F2', capacity: 160, type: 'FATTENING', location: 'Setor D - Engorda Fase 2', area: 1200, troughCount: 8 },
      { penNumber: '21', name: 'Curral 21 - Engorda F2', capacity: 160, type: 'FATTENING', location: 'Setor D - Engorda Fase 2', area: 1200, troughCount: 8 },
      { penNumber: '22', name: 'Curral 22 - Engorda F2', capacity: 160, type: 'FATTENING', location: 'Setor D - Engorda Fase 2', area: 1200, troughCount: 8 },
      { penNumber: '23', name: 'Curral 23 - Engorda F2', capacity: 160, type: 'FATTENING', location: 'Setor D - Engorda Fase 2', area: 1200, troughCount: 8 },
      
      // Setor E - Hospital/Manejo (3 currais)
      { penNumber: '24', name: 'Curral 24 - Hospital', capacity: 30, type: 'HOSPITAL', location: 'Setor E - Hospital', area: 300, troughCount: 2 },
      { penNumber: '25', name: 'Curral 25 - Hospital', capacity: 30, type: 'HOSPITAL', location: 'Setor E - Hospital', area: 300, troughCount: 2 },
      { penNumber: '26', name: 'Curral 26 - Manejo', capacity: 40, type: 'HOSPITAL', location: 'Setor E - Manejo', area: 350, troughCount: 3 }
    ];
    
    console.log('📊 Resumo dos 26 currais a serem criados:');
    console.log('- 4 currais de Recepção (360 cabeças)');
    console.log('- 3 currais de Quarentena (150 cabeças)');
    console.log('- 16 currais de Engorda (2.280 cabeças)');
    console.log('- 3 currais Hospital/Manejo (100 cabeças)');
    console.log('💪 Capacidade total: 2.890 cabeças\n');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const penData of pens) {
      try {
        // Verificar se o curral já existe
        const existing = await prisma.pen.findUnique({
          where: { penNumber: penData.penNumber }
        });
        
        if (existing) {
          console.log(`⚠️  Curral ${penData.penNumber} já existe - pulando`);
          skippedCount++;
          continue;
        }
        
        // Criar o curral
        const pen = await prisma.pen.create({
          data: {
            ...penData,
            currentOccupancy: 0,
            status: 'AVAILABLE',
            waterAvailable: true,
            isActive: true,
            observations: `Importado em ${new Date().toLocaleDateString('pt-BR')}`
          }
        });
        
        createdCount++;
        console.log(`✅ Curral ${pen.penNumber} - ${pen.name} criado (${pen.capacity} cabeças)`);
        
      } catch (error) {
        console.error(`❌ Erro ao criar curral ${penData.penNumber}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO DA IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Currais criados: ${createdCount}`);
    console.log(`⚠️  Currais já existentes: ${skippedCount}`);
    console.log(`📦 Total processado: ${pens.length}`);
    
    // Verificar total no banco
    const totalPens = await prisma.pen.count();
    const totalCapacity = await prisma.pen.aggregate({
      _sum: { capacity: true }
    });
    
    console.log('\n🏠 SITUAÇÃO ATUAL DO SISTEMA:');
    console.log(`Total de currais no banco: ${totalPens}`);
    console.log(`Capacidade total: ${totalCapacity._sum.capacity || 0} cabeças`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
import26Pens();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAnalysis() {
  console.log('🔍 Debug da análise integrada...\n');
  
  try {
    // 1. Ver todas as análises
    console.log('📋 Todas as análises:');
    const allAnalyses = await prisma.integratedFinancialAnalysis.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    allAnalyses.forEach(analysis => {
      console.log(`   • ID: ${analysis.id}`);
      console.log(`   • referenceMonth: ${analysis.referenceMonth}`);
      console.log(`   • referenceMonth ISO: ${analysis.referenceMonth.toISOString()}`);
      console.log(`   • totalRevenue: R$ ${analysis.totalRevenue.toFixed(2)}`);
      console.log('');
    });

    // 2. Testar busca como o controller faz
    console.log('🔧 Testando busca como controller:');
    const year = 2025;
    const month = 9;
    const referenceMonth = new Date(year, month - 1, 1);
    console.log(`   • Data procurada: ${referenceMonth.toISOString()}`);
    
    const found = await prisma.integratedFinancialAnalysis.findUnique({
      where: { referenceMonth }
    });
    
    if (found) {
      console.log(`   ✅ Encontrou! ID: ${found.id}`);
    } else {
      console.log('   ❌ Não encontrou nada');
    }

    // 3. Testar busca com diferentes formatos
    console.log('\n🔧 Testando diferentes formatos de data:');
    
    const formats = [
      new Date('2025-09-01T00:00:00Z'),
      new Date('2025-09-01T00:00:00.000Z'),
      new Date(2025, 8, 1), // mês 8 = setembro (0-indexed)
      new Date('2025-09-01'),
      new Date('2025-09-01T03:00:00.000Z') // UTC-3
    ];

    for (let i = 0; i < formats.length; i++) {
      const testDate = formats[i];
      console.log(`   Testando ${i + 1}: ${testDate.toISOString()}`);
      
      const result = await prisma.integratedFinancialAnalysis.findUnique({
        where: { referenceMonth: testDate }
      });
      
      if (result) {
        console.log(`   ✅ Encontrou com formato ${i + 1}!`);
      } else {
        console.log(`   ❌ Não encontrou com formato ${i + 1}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugAnalysis();
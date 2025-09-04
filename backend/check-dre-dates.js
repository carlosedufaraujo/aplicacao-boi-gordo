const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDREs() {
  console.log('=== VERIFICANDO DREs NO BANCO ===\n');
  
  try {
    // Buscar todos os DREs ordenados por data
    const dres = await prisma.dREStatement.findMany({
      orderBy: { referenceMonth: 'desc' },
      take: 10,
      select: {
        id: true,
        referenceMonth: true,
        deductions: true,
        cycleId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`Total de DREs encontrados: ${dres.length}\n`);

    dres.forEach((dre, index) => {
      const localDate = new Date(dre.referenceMonth);
      console.log(`DRE ${index + 1}:`);
      console.log(`  ID: ${dre.id.substring(0, 8)}...`);
      console.log(`  referenceMonth (ISO): ${dre.referenceMonth.toISOString()}`);
      console.log(`  Mês/Ano local: ${localDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })}`);
      console.log(`  Deduções: R$ ${dre.deductions.toFixed(2)}`);
      console.log(`  Ciclo: ${dre.cycleId || 'null'}`);
      console.log(`  Criado em: ${dre.createdAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log(`  Atualizado em: ${dre.updatedAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log('');
    });

    // Buscar especificamente DREs com deduções > 0
    console.log('=== DREs COM DEDUÇÕES (MORTALIDADE) ===\n');
    const dresWithDeductions = await prisma.dREStatement.findMany({
      where: {
        deductions: { gt: 0 }
      },
      orderBy: { referenceMonth: 'desc' }
    });

    dresWithDeductions.forEach(dre => {
      const localDate = new Date(dre.referenceMonth);
      console.log(`Mês: ${localDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })}`);
      console.log(`  Deduções: R$ ${dre.deductions.toFixed(2)}`);
      console.log(`  Data no banco: ${dre.referenceMonth.toISOString()}`);
      console.log('');
    });

    // Verificar últimas mortalidades registradas
    console.log('=== ÚLTIMAS MORTALIDADES ===\n');
    const mortalities = await prisma.mortalityRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        deathDate: true,
        quantity: true,
        estimatedLoss: true,
        createdAt: true
      }
    });

    mortalities.forEach(mort => {
      const deathLocal = new Date(mort.deathDate);
      console.log(`Mortalidade ID: ${mort.id.substring(0, 8)}...`);
      console.log(`  Data da morte (ISO): ${mort.deathDate.toISOString()}`);
      console.log(`  Data local: ${deathLocal.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log(`  Quantidade: ${mort.quantity}`);
      console.log(`  Perda estimada: R$ ${mort.estimatedLoss?.toFixed(2) || '0.00'}`);
      console.log(`  Registrada em: ${mort.createdAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      console.log('');
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDREs();
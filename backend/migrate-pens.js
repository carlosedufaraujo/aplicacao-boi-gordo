const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migratePens() {
  try {
    console.log('🔄 Iniciando migração dos currais...\n');
    
    // 1. Apagar currais existentes
    console.log('🗑️  Apagando currais existentes...');
    await prisma.pen.deleteMany({});
    console.log('✅ Currais existentes removidos\n');
    
    // 2. Gerar os 60 currais conforme o padrão do frontend
    const penRegistrations = [];
    const pensPerLine = 15;
    const totalLines = 4;
    const totalPens = pensPerLine * totalLines;
    const lineLetters = ['A', 'B', 'C', 'D'];
    
    console.log('📝 Criando 60 novos currais...\n');
    
    for (let i = 1; i <= totalPens; i++) {
      const penNumber = `CURRAL-${i.toString().padStart(2, '0')}`;
      const lineIndex = Math.floor((i - 1) / pensPerLine);
      const lineLetter = lineLetters[lineIndex];
      
      penRegistrations.push({
        penNumber: penNumber,
        capacity: 130, // Capacidade padrão conforme o frontend
        location: `Linha ${lineLetter}`,
        type: 'FATTENING', // Tipo padrão de engorda
        status: 'AVAILABLE', // Status disponível
        isActive: true
      });
    }
    
    // 3. Inserir todos os currais no banco
    const result = await prisma.pen.createMany({
      data: penRegistrations
    });
    
    console.log(`✅ ${result.count} currais criados com sucesso!\n`);
    
    // 4. Listar resumo dos currais criados
    const createdPens = await prisma.pen.findMany({
      orderBy: { penNumber: 'asc' }
    });
    
    console.log('📊 RESUMO DOS CURRAIS CRIADOS:');
    console.log('═'.repeat(50));
    
    // Agrupar por linha
    const byLine = {};
    createdPens.forEach(pen => {
      const line = pen.location;
      if (!byLine[line]) {
        byLine[line] = [];
      }
      byLine[line].push(pen.penNumber);
    });
    
    // Mostrar currais por linha
    Object.entries(byLine).forEach(([line, pens]) => {
      console.log(`\n${line} (${pens.length} currais):`);
      console.log(pens.join(', '));
    });
    
    console.log('\n' + '═'.repeat(50));
    console.log(`TOTAL: ${createdPens.length} currais`);
    console.log(`Capacidade total: ${createdPens.reduce((sum, pen) => sum + pen.capacity, 0)} animais`);
    console.log('═'.repeat(50));
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a migração
migratePens();
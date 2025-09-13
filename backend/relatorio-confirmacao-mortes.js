const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function gerarRelatorioConfirmacao() {
  console.log('\n📊 RELATÓRIO DE CONFIRMAÇÃO - REGISTRO DE MORTES');
  console.log('===================================================\n');
  
  // Buscar todas as mortes registradas
  const mortes = await prisma.deathRecord.findMany({
    include: {
      pen: true,
      purchase: true
    },
    orderBy: [
      { pen: { penNumber: 'asc' } },
      { deathDate: 'desc' }
    ]
  });
  
  // Agrupar por curral
  const mortesPorCurral = {};
  for (const morte of mortes) {
    const penNumber = morte.pen.penNumber;
    if (!mortesPorCurral[penNumber]) {
      mortesPorCurral[penNumber] = [];
    }
    mortesPorCurral[penNumber].push(morte);
  }
  
  console.log('📍 MORTES POR CURRAL:');
  console.log('======================\n');
  
  for (const [curral, mortesNoCurral] of Object.entries(mortesPorCurral)) {
    const totalMortes = mortesNoCurral.reduce((acc, m) => acc + m.quantity, 0);
    console.log(`Curral ${curral}: ${totalMortes} morte(s)`);
    
    for (const morte of mortesNoCurral) {
      const lote = morte.purchase ? morte.purchase.lotCode : 'N/A';
      console.log(`  → ${morte.quantity} morte(s) - ${morte.cause || morte.deathType} (Lote: ${lote})`);
    }
    console.log('');
  }
  
  // Estatísticas por tipo de morte
  const estatisticasPorTipo = await prisma.deathRecord.groupBy({
    by: ['deathType'],
    _sum: {
      quantity: true,
      estimatedLoss: true
    }
  });
  
  console.log('📈 ESTATÍSTICAS POR TIPO DE MORTE:');
  console.log('====================================\n');
  
  const mapeamentoTipos = {
    'DISEASE': 'Doença',
    'ACCIDENT': 'Acidente',
    'PREDATION': 'Predação',
    'POISONING': 'Envenenamento',
    'STRESS': 'Estresse',
    'UNKNOWN': 'Não Identificada',
    'OTHER': 'Outras'
  };
  
  for (const stat of estatisticasPorTipo) {
    const tipoPortugues = mapeamentoTipos[stat.deathType] || stat.deathType;
    const perda = stat._sum.estimatedLoss || 0;
    console.log(`${tipoPortugues}: ${stat._sum.quantity} mortes - Perda: R$ ${perda.toFixed(2)}`);
  }
  
  // Estatísticas por lote
  const estatisticasPorLote = await prisma.deathRecord.groupBy({
    by: ['purchaseId'],
    _sum: {
      quantity: true,
      estimatedLoss: true
    }
  });
  
  console.log('\n📦 ESTATÍSTICAS POR LOTE:');
  console.log('==========================\n');
  
  for (const stat of estatisticasPorLote) {
    const lote = await prisma.cattlePurchase.findUnique({
      where: { id: stat.purchaseId }
    });
    
    if (lote) {
      const taxaMortalidade = ((stat._sum.quantity / lote.initialQuantity) * 100).toFixed(2);
      console.log(`Lote ${lote.lotCode}:`);
      console.log(`  → Mortes: ${stat._sum.quantity}/${lote.initialQuantity} animais`);
      console.log(`  → Taxa de Mortalidade: ${taxaMortalidade}%`);
      console.log(`  → Perda Estimada: R$ ${(stat._sum.estimatedLoss || 0).toFixed(2)}`);
      console.log('');
    }
  }
  
  // Resumo geral
  const totalMortes = await prisma.deathRecord.aggregate({
    _sum: {
      quantity: true,
      estimatedLoss: true
    }
  });
  
  const totalAnimais = await prisma.cattlePurchase.aggregate({
    _sum: {
      initialQuantity: true
    }
  });
  
  const taxaMortalidadeGeral = ((totalMortes._sum.quantity / totalAnimais._sum.initialQuantity) * 100).toFixed(2);
  
  console.log('📊 RESUMO GERAL:');
  console.log('=================\n');
  console.log(`Total de Mortes Registradas: ${totalMortes._sum.quantity}`);
  console.log(`Total de Animais no Sistema: ${totalAnimais._sum.initialQuantity}`);
  console.log(`Taxa de Mortalidade Geral: ${taxaMortalidadeGeral}%`);
  console.log(`Perda Total Estimada: R$ ${(totalMortes._sum.estimatedLoss || 0).toFixed(2)}`);
  
  // Verificar currais com alta mortalidade
  console.log('\n⚠️ ALERTAS:');
  console.log('============\n');
  
  const curraisComAltaMortalidade = [];
  
  for (const [curral, mortesNoCurral] of Object.entries(mortesPorCurral)) {
    const totalMortes = mortesNoCurral.reduce((acc, m) => acc + m.quantity, 0);
    
    // Buscar alocação atual do curral
    const pen = await prisma.pen.findFirst({
      where: { penNumber: curral },
      include: {
        lotAllocations: {
          where: { status: 'ACTIVE' }
        }
      }
    });
    
    if (pen && pen.lotAllocations.length > 0) {
      const totalAnimaisNoCurral = pen.lotAllocations.reduce((acc, link) => acc + link.quantity, 0);
      if (totalAnimaisNoCurral > 0) {
        const taxaMortalidadeCurral = (totalMortes / (totalAnimaisNoCurral + totalMortes)) * 100;
        
        if (taxaMortalidadeCurral > 5) {
          curraisComAltaMortalidade.push({
            curral,
            mortes: totalMortes,
            taxa: taxaMortalidadeCurral.toFixed(2)
          });
        }
      }
    }
  }
  
  if (curraisComAltaMortalidade.length > 0) {
    console.log('Currais com alta mortalidade (> 5%):');
    for (const item of curraisComAltaMortalidade) {
      console.log(`  → Curral ${item.curral}: ${item.mortes} mortes (${item.taxa}%)`);
    }
  } else {
    console.log('✅ Nenhum curral com mortalidade acima de 5%');
  }
  
  // Comparação com benchmarks
  console.log('\n📊 COMPARAÇÃO COM BENCHMARKS DO SETOR:');
  console.log('========================================\n');
  
  const taxaMortalidade = parseFloat(taxaMortalidadeGeral);
  
  if (taxaMortalidade < 1) {
    console.log('✅ EXCELENTE: Taxa de mortalidade abaixo de 1%');
  } else if (taxaMortalidade < 2) {
    console.log('✅ BOM: Taxa de mortalidade entre 1-2% (dentro do esperado)');
  } else if (taxaMortalidade < 3) {
    console.log('⚠️ ATENÇÃO: Taxa de mortalidade entre 2-3% (acima da média)');
  } else if (taxaMortalidade < 5) {
    console.log('⚠️ ALERTA: Taxa de mortalidade entre 3-5% (requer investigação)');
  } else {
    console.log('🚨 CRÍTICO: Taxa de mortalidade acima de 5% (situação crítica)');
  }
  
  console.log('\n====================================================');
  console.log('Relatório gerado em:', new Date().toLocaleString('pt-BR'));
  console.log('====================================================\n');
  
  await prisma.$disconnect();
}

gerarRelatorioConfirmacao().catch(console.error);
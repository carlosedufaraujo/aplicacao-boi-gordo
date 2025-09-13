const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarCurrais() {
  console.log('🔍 VERIFICAÇÃO DE CURRAIS - MORTES VS SISTEMA');
  console.log('================================================\n');
  
  // Currais mencionados no relatório de mortes (piquetes)
  const curraisRelatorioMortes = [
    'C-01', 'C-14', 'C-15', 'D-01', 'D-05', 'D-06', 
    'E-01', 'E-03', 'E-13', 'F-17', 'F-18', 'F-19', 
    'G-17', 'H-01', 'H-02', 'H-18', 'H-22', 'J-01', 
    'J-02', 'J-03', 'J-06', 'L-03', 'L-04', 'L-07', 
    'M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 
    'M-07', 'M-08', 'M-09', 'N-09', 'N-10', 'O-02', 
    'O-03', 'P-02', 'P-08', 'Q-03', 'T-05', 'T-06', 
    'T-07', 'T-08'
  ];
  
  // Buscar todos os currais do sistema
  const curraisNoSistema = await prisma.pen.findMany({
    orderBy: { penNumber: 'asc' },
    select: { 
      penNumber: true, 
      id: true,
      capacity: true,
      status: true
    }
  });
  
  const penNumbersNoSistema = curraisNoSistema.map(p => p.penNumber);
  
  console.log('📋 CURRAIS NO RELATÓRIO DE MORTES:', curraisRelatorioMortes.length);
  console.log(curraisRelatorioMortes.join(', '));
  
  console.log('\n📊 CURRAIS NO SISTEMA:', penNumbersNoSistema.length);
  console.log(penNumbersNoSistema.join(', '));
  
  // Verificar discrepâncias
  console.log('\n🔍 ANÁLISE DE DISCREPÂNCIAS:');
  console.log('================================');
  
  // Currais no relatório mas não no sistema
  const curraisFaltandoNoSistema = curraisRelatorioMortes.filter(
    c => !penNumbersNoSistema.includes(c)
  );
  
  if (curraisFaltandoNoSistema.length > 0) {
    console.log('\n❌ CURRAIS NO RELATÓRIO MAS NÃO NO SISTEMA:');
    console.log(curraisFaltandoNoSistema.join(', '));
  } else {
    console.log('\n✅ Todos os currais do relatório existem no sistema!');
  }
  
  // Currais no sistema mas não no relatório
  const curraisExtrasNoSistema = penNumbersNoSistema.filter(
    c => !curraisRelatorioMortes.includes(c)
  );
  
  if (curraisExtrasNoSistema.length > 0) {
    console.log('\n📌 CURRAIS NO SISTEMA MAS NÃO NO RELATÓRIO:');
    console.log(curraisExtrasNoSistema.join(', '));
  }
  
  // Verificar possíveis erros de digitação
  console.log('\n🔤 VERIFICAÇÃO DE POSSÍVEIS ERROS DE DIGITAÇÃO:');
  console.log('================================================');
  
  for (const curralRelatorio of curraisFaltandoNoSistema) {
    console.log(`\nAnalisando: ${curralRelatorio}`);
    
    // Buscar currais similares no sistema
    const similares = penNumbersNoSistema.filter(penSistema => {
      // Mesma letra inicial
      if (curralRelatorio[0] === penSistema[0]) {
        // Verificar se os números são próximos
        const numRelatorio = parseInt(curralRelatorio.split('-')[1]);
        const numSistema = parseInt(penSistema.split('-')[1]);
        
        if (Math.abs(numRelatorio - numSistema) <= 1) {
          return true;
        }
      }
      return false;
    });
    
    if (similares.length > 0) {
      console.log(`  Possíveis correspondências: ${similares.join(', ')}`);
    }
  }
  
  // Verificar currais com alocações
  console.log('\n📦 CURRAIS COM ALOCAÇÕES ATIVAS:');
  console.log('==================================');
  
  const curraisComAlocacao = await prisma.lotPenLink.findMany({
    where: { status: 'ACTIVE' },
    select: {
      pen: {
        select: { penNumber: true }
      },
      quantity: true,
      purchase: {
        select: { lotCode: true }
      }
    },
    orderBy: {
      pen: { penNumber: 'asc' }
    }
  });
  
  const curraisAlocadosMap = {};
  for (const alocacao of curraisComAlocacao) {
    const penNumber = alocacao.pen.penNumber;
    if (!curraisAlocadosMap[penNumber]) {
      curraisAlocadosMap[penNumber] = {
        totalAnimais: 0,
        lotes: []
      };
    }
    curraisAlocadosMap[penNumber].totalAnimais += alocacao.quantity;
    curraisAlocadosMap[penNumber].lotes.push(alocacao.purchase.lotCode);
  }
  
  for (const [penNumber, info] of Object.entries(curraisAlocadosMap)) {
    console.log(`${penNumber}: ${info.totalAnimais} animais (Lotes: ${info.lotes.join(', ')})`);
  }
  
  // Verificar se currais do relatório têm alocações
  console.log('\n⚠️ CURRAIS DO RELATÓRIO DE MORTES COM ALOCAÇÕES:');
  console.log('==================================================');
  
  let curraisComMortesEAlocacoes = 0;
  for (const curralRelatorio of curraisRelatorioMortes) {
    if (curraisAlocadosMap[curralRelatorio]) {
      console.log(`✅ ${curralRelatorio}: ${curraisAlocadosMap[curralRelatorio].totalAnimais} animais`);
      curraisComMortesEAlocacoes++;
    } else if (penNumbersNoSistema.includes(curralRelatorio)) {
      console.log(`⚠️ ${curralRelatorio}: Existe mas SEM alocação ativa`);
    }
  }
  
  console.log('\n📊 RESUMO FINAL:');
  console.log('================');
  console.log(`Total de currais no relatório: ${curraisRelatorioMortes.length}`);
  console.log(`Total de currais no sistema: ${penNumbersNoSistema.length}`);
  console.log(`Currais faltando no sistema: ${curraisFaltandoNoSistema.length}`);
  console.log(`Currais do relatório com alocações: ${curraisComMortesEAlocacoes}`);
  
  await prisma.$disconnect();
}

verificarCurrais().catch(console.error);
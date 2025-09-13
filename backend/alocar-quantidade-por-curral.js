const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function alocarQuantidadePorCurral() {
  try {
    console.log('🐂 INICIANDO ALOCAÇÃO COM QUANTIDADES FIXAS POR CURRAL');
    console.log('========================================================\n');
    
    // Quantidades fornecidas pelo usuário (26 valores - um para cada curral)
    const quantidadesPorCurral = [
      121, 131, 129, 128, 129, 131, 129, 109, 113, 113,
      116, 105, 102, 105, 101, 119, 116, 116, 103, 104,
      98, 98, 119, 112, 118, 120
    ];
    
    // Buscar todos os currais ordenados
    const currais = await prisma.pen.findMany({
      orderBy: { penNumber: 'asc' }
    });
    
    console.log(`🏠 Total de currais: ${currais.length}`);
    console.log(`📊 Total de quantidades fornecidas: ${quantidadesPorCurral.length}\n`);
    
    if (currais.length !== quantidadesPorCurral.length) {
      console.error('❌ ERRO: Número de currais não corresponde ao número de quantidades!');
      return;
    }
    
    // Associar cada curral com sua quantidade
    const curraisComQuantidade = currais.map((curral, index) => ({
      ...curral,
      quantidadeDesejada: quantidadesPorCurral[index],
      espacoDisponivel: quantidadesPorCurral[index],
      lotesAlocados: []
    }));
    
    console.log('📋 DISTRIBUIÇÃO DE QUANTIDADES POR CURRAL:');
    console.log('==========================================');
    curraisComQuantidade.forEach(c => {
      console.log(`   ${c.penNumber}: ${c.quantidadeDesejada} animais`);
    });
    
    // Buscar todos os lotes (compras) ordenados por data
    const lotes = await prisma.cattlePurchase.findMany({
      orderBy: { purchaseDate: 'asc' },
      include: {
        vendor: true
      }
    });
    
    console.log(`\n📦 Total de lotes para alocar: ${lotes.length}`);
    const totalAnimaisLotes = lotes.reduce((sum, lote) => sum + lote.initialQuantity, 0);
    const totalQuantidadesDesejadas = quantidadesPorCurral.reduce((sum, q) => sum + q, 0);
    console.log(`🐄 Total de animais nos lotes: ${totalAnimaisLotes}`);
    console.log(`📊 Total de vagas nos currais: ${totalQuantidadesDesejadas}\n`);
    
    // Limpar alocações anteriores
    console.log('🧹 Limpando alocações anteriores...');
    await prisma.lotPenLink.deleteMany({});
    console.log('✅ Alocações anteriores removidas\n');
    
    // Estratégia: Alocar lotes sequencialmente nos currais com espaço disponível
    const alocacoes = [];
    let loteIndex = 0;
    
    console.log('🎯 INICIANDO ALOCAÇÃO DOS LOTES NOS CURRAIS:');
    console.log('============================================\n');
    
    for (const curral of curraisComQuantidade) {
      console.log(`\n📍 Curral ${curral.penNumber} (Capacidade: ${curral.quantidadeDesejada} animais):`);
      
      while (curral.espacoDisponivel > 0 && loteIndex < lotes.length) {
        const lote = lotes[loteIndex];
        const quantidadeDisponivel = lote.initialQuantity - (lote.alocado || 0);
        
        if (quantidadeDisponivel <= 0) {
          loteIndex++;
          continue;
        }
        
        const quantidadeAlocar = Math.min(curral.espacoDisponivel, quantidadeDisponivel);
        
        alocacoes.push({
          purchaseId: lote.id,
          penId: curral.id,
          penNumber: curral.penNumber,
          lotCode: lote.lotCode,
          quantity: quantidadeAlocar,
          percentageOfLot: (quantidadeAlocar / lote.initialQuantity) * 100,
          percentageOfPen: (quantidadeAlocar / curral.quantidadeDesejada) * 100,
          vendor: lote.vendor?.name
        });
        
        curral.espacoDisponivel -= quantidadeAlocar;
        curral.lotesAlocados.push(lote.lotCode);
        lote.alocado = (lote.alocado || 0) + quantidadeAlocar;
        
        console.log(`   ✅ Lote ${lote.lotCode}: ${quantidadeAlocar} animais (${lote.vendor?.name})`);
        
        // Se o lote foi completamente alocado, passar para o próximo
        if (lote.alocado >= lote.initialQuantity) {
          loteIndex++;
        }
      }
      
      if (curral.espacoDisponivel > 0) {
        console.log(`   ⚠️ Sobraram ${curral.espacoDisponivel} vagas não preenchidas`);
      }
    }
    
    // Salvar alocações no banco
    console.log('\n💾 SALVANDO ALOCAÇÕES NO BANCO DE DADOS...\n');
    
    let alocacoesSalvas = 0;
    let errosSalvamento = 0;
    
    for (const alocacao of alocacoes) {
      try {
        await prisma.lotPenLink.create({
          data: {
            purchaseId: alocacao.purchaseId,
            penId: alocacao.penId,
            quantity: alocacao.quantity,
            percentageOfLot: alocacao.percentageOfLot,
            percentageOfPen: alocacao.percentageOfPen,
            allocationDate: new Date(),
            status: 'ACTIVE'
          }
        });
        alocacoesSalvas++;
      } catch (error) {
        console.error(`❌ Erro ao salvar alocação: ${alocacao.lotCode} -> ${alocacao.penNumber}`);
        errosSalvamento++;
      }
    }
    
    // Relatório final detalhado
    console.log('\n' + '='.repeat(70));
    console.log('📊 RELATÓRIO FINAL DA ALOCAÇÃO');
    console.log('='.repeat(70));
    
    console.log('\n🏠 DISTRIBUIÇÃO DETALHADA POR CURRAL:');
    console.log('=====================================');
    
    for (const curral of curraisComQuantidade) {
      const ocupacao = curral.quantidadeDesejada - curral.espacoDisponivel;
      const percentual = ((ocupacao / curral.quantidadeDesejada) * 100).toFixed(1);
      console.log(`\n${curral.penNumber}:`);
      console.log(`   Quantidade definida: ${curral.quantidadeDesejada} animais`);
      console.log(`   Ocupação real: ${ocupacao} animais (${percentual}%)`);
      if (curral.lotesAlocados.length > 0) {
        console.log(`   Lotes alocados: ${curral.lotesAlocados.join(', ')}`);
      } else {
        console.log(`   ⚠️ Nenhum lote alocado`);
      }
    }
    
    // Verificar lotes não completamente alocados
    console.log('\n📦 STATUS DOS LOTES:');
    console.log('===================');
    
    const lotesCompletos = [];
    const lotesParciais = [];
    const lotesNaoAlocados = [];
    
    for (const lote of lotes) {
      const alocado = lote.alocado || 0;
      if (alocado === lote.initialQuantity) {
        lotesCompletos.push(lote);
      } else if (alocado > 0) {
        lotesParciais.push(lote);
      } else {
        lotesNaoAlocados.push(lote);
      }
    }
    
    console.log(`\n✅ Lotes completamente alocados: ${lotesCompletos.length}`);
    lotesCompletos.forEach(l => {
      console.log(`   - ${l.lotCode}: ${l.initialQuantity} animais`);
    });
    
    if (lotesParciais.length > 0) {
      console.log(`\n⚠️ Lotes parcialmente alocados: ${lotesParciais.length}`);
      lotesParciais.forEach(l => {
        const percentual = ((l.alocado / l.initialQuantity) * 100).toFixed(1);
        console.log(`   - ${l.lotCode}: ${l.alocado}/${l.initialQuantity} animais (${percentual}%)`);
      });
    }
    
    if (lotesNaoAlocados.length > 0) {
      console.log(`\n❌ Lotes não alocados: ${lotesNaoAlocados.length}`);
      lotesNaoAlocados.forEach(l => {
        console.log(`   - ${l.lotCode}: ${l.initialQuantity} animais`);
      });
    }
    
    // Estatísticas gerais
    const totalAlocado = alocacoes.reduce((sum, a) => sum + a.quantity, 0);
    const curraisUtilizados = curraisComQuantidade.filter(c => c.lotesAlocados.length > 0).length;
    
    console.log('\n📈 ESTATÍSTICAS GERAIS:');
    console.log('======================');
    console.log(`   Total de animais alocados: ${totalAlocado}/${totalQuantidadesDesejadas}`);
    console.log(`   Taxa de ocupação: ${((totalAlocado / totalQuantidadesDesejadas) * 100).toFixed(1)}%`);
    console.log(`   Total de alocações criadas: ${alocacoesSalvas}`);
    console.log(`   Currais utilizados: ${curraisUtilizados}/${currais.length}`);
    console.log(`   Erros de salvamento: ${errosSalvamento}`);
    
    // Verificar ocupação total no banco
    const ocupacaoTotal = await prisma.lotPenLink.aggregate({
      where: { removalDate: null },
      _sum: { quantity: true }
    });
    
    console.log(`\n✅ OCUPAÇÃO TOTAL CONFIRMADA NO BANCO: ${ocupacaoTotal._sum.quantity || 0} animais`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

alocarQuantidadePorCurral();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function alocarLotesNosCurrais() {
  try {
    console.log('🐂 INICIANDO ALOCAÇÃO DE LOTES NOS CURRAIS');
    console.log('===========================================\n');
    
    // Quantidades fornecidas pelo usuário (26 valores)
    const quantidadesPorCurral = [
      121, 131, 129, 128, 129, 131, 129, 109, 113, 113,
      116, 105, 102, 105, 101, 119, 116, 116, 103, 104,
      98, 98, 119, 112, 118, 120
    ];
    
    // Buscar todos os lotes (compras) ordenados por data
    const lotes = await prisma.cattlePurchase.findMany({
      orderBy: { purchaseDate: 'asc' },
      include: {
        vendor: true
      }
    });
    
    console.log(`📦 Total de lotes encontrados: ${lotes.length}`);
    console.log(`📊 Total de quantidades fornecidas: ${quantidadesPorCurral.length}\n`);
    
    // Buscar todos os currais ordenados
    const currais = await prisma.pen.findMany({
      orderBy: { penNumber: 'asc' }
    });
    
    console.log(`🏠 Total de currais disponíveis: ${currais.length}\n`);
    
    // Verificar se temos 22 lotes ou 26
    if (lotes.length === 22 && quantidadesPorCurral.length === 26) {
      console.log('⚠️  Temos 22 lotes e 26 quantidades.');
      console.log('    Vou alocar os 22 lotes usando as primeiras 22 quantidades.\n');
    }
    
    // Calcular total de animais
    const totalAnimaisLotes = lotes.reduce((sum, lote) => sum + lote.initialQuantity, 0);
    const totalQuantidadesFornecidas = quantidadesPorCurral.slice(0, lotes.length).reduce((sum, q) => sum + q, 0);
    
    console.log(`🐄 Total de animais nos lotes: ${totalAnimaisLotes}`);
    console.log(`📋 Total das quantidades fornecidas (primeiras ${lotes.length}): ${totalQuantidadesFornecidas}\n`);
    
    // Criar array de currais disponíveis com suas capacidades
    const curraisDisponiveis = currais.map(c => ({
      ...c,
      espacoDisponivel: c.capacity,
      lotesAlocados: []
    }));
    
    // Estratégia de alocação: distribuir cada lote em múltiplos currais se necessário
    const alocacoes = [];
    let erros = 0;
    
    for (let i = 0; i < Math.min(lotes.length, quantidadesPorCurral.length); i++) {
      const lote = lotes[i];
      const quantidadeDesejada = quantidadesPorCurral[i];
      const quantidadeReal = Math.min(quantidadeDesejada, lote.initialQuantity);
      
      console.log(`\n📝 Alocando Lote ${lote.lotCode}:`);
      console.log(`   Fornecedor: ${lote.vendor?.name || 'N/A'}`);
      console.log(`   Quantidade no lote: ${lote.initialQuantity}`);
      console.log(`   Quantidade a alocar: ${quantidadeReal}`);
      
      let quantidadeRestante = quantidadeReal;
      const alocacoesDoLote = [];
      
      // Embaralhar currais para distribuição aleatória
      const curraisEmbaralhados = [...curraisDisponiveis].sort(() => Math.random() - 0.5);
      
      for (const curral of curraisEmbaralhados) {
        if (quantidadeRestante <= 0) break;
        
        if (curral.espacoDisponivel > 0) {
          const quantidadeAlocar = Math.min(quantidadeRestante, curral.espacoDisponivel);
          
          alocacoesDoLote.push({
            purchaseId: lote.id,
            penId: curral.id,
            penNumber: curral.penNumber,
            quantity: quantidadeAlocar,
            percentageOfLot: (quantidadeAlocar / lote.initialQuantity) * 100,
            percentageOfPen: (quantidadeAlocar / curral.capacity) * 100
          });
          
          curral.espacoDisponivel -= quantidadeAlocar;
          curral.lotesAlocados.push(lote.lotCode);
          quantidadeRestante -= quantidadeAlocar;
          
          console.log(`   ✅ Alocados ${quantidadeAlocar} animais no curral ${curral.penNumber}`);
        }
      }
      
      if (quantidadeRestante > 0) {
        console.log(`   ⚠️ AVISO: Não foi possível alocar ${quantidadeRestante} animais (capacidade insuficiente)`);
        erros++;
      }
      
      alocacoes.push(...alocacoesDoLote);
    }
    
    // Executar as alocações no banco de dados
    console.log('\n💾 SALVANDO ALOCAÇÕES NO BANCO DE DADOS...\n');
    
    let alocacoesSalvas = 0;
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
        console.error(`❌ Erro ao salvar alocação do curral ${alocacao.penNumber}:`, error.message);
      }
    }
    
    // Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DA ALOCAÇÃO');
    console.log('='.repeat(60));
    
    console.log('\n🏠 DISTRIBUIÇÃO POR CURRAL:');
    for (const curral of curraisDisponiveis) {
      if (curral.lotesAlocados.length > 0) {
        const ocupacao = curral.capacity - curral.espacoDisponivel;
        const percentual = ((ocupacao / curral.capacity) * 100).toFixed(1);
        console.log(`   ${curral.penNumber}: ${ocupacao}/${curral.capacity} animais (${percentual}%) - Lotes: ${curral.lotesAlocados.join(', ')}`);
      }
    }
    
    // Estatísticas gerais
    const totalAlocado = alocacoes.reduce((sum, a) => sum + a.quantity, 0);
    const curraisUtilizados = curraisDisponiveis.filter(c => c.lotesAlocados.length > 0).length;
    
    console.log('\n📈 ESTATÍSTICAS GERAIS:');
    console.log(`   Total de animais alocados: ${totalAlocado}`);
    console.log(`   Total de alocações criadas: ${alocacoesSalvas}`);
    console.log(`   Currais utilizados: ${curraisUtilizados}/${currais.length}`);
    console.log(`   Lotes com problemas de alocação: ${erros}`);
    
    // Verificar ocupação total
    const ocupacaoTotal = await prisma.lotPenLink.aggregate({
      where: { removalDate: null },
      _sum: { quantity: true }
    });
    
    console.log(`\n✅ OCUPAÇÃO TOTAL DOS CURRAIS: ${ocupacaoTotal._sum.quantity || 0} animais`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

alocarLotesNosCurrais();
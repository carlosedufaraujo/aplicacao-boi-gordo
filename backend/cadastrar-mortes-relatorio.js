const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cadastrarMortes() {
  console.log('💀 CADASTRO DE MORTES DO RELATÓRIO');
  console.log('=====================================\n');
  
  // Dados do relatório de mortes
  const mortesRelatorio = [
    // Piquete C-01
    { pen: 'C-01', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete C-14
    { pen: 'C-14', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete C-15
    { pen: 'C-15', quantidade: 1, causa: 'Cobra' },
    { pen: 'C-15', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete D-01
    { pen: 'D-01', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'D-01', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete D-05
    { pen: 'D-05', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete D-06
    { pen: 'D-06', quantidade: 2, causa: 'Não Identificada' },
    
    // Piquete E-01
    { pen: 'E-01', quantidade: 2, causa: 'Não Identificada' },
    
    // Piquete E-03
    { pen: 'E-03', quantidade: 1, causa: 'Timpanismo' },
    
    // Piquete E-13
    { pen: 'E-13', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete F-17
    { pen: 'F-17', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'F-17', quantidade: 4, causa: 'Não Identificada' },
    
    // Piquete F-18
    { pen: 'F-18', quantidade: 2, causa: 'Timpanismo' },
    { pen: 'F-18', quantidade: 4, causa: 'Não Identificada' },
    
    // Piquete F-19
    { pen: 'F-19', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'F-19', quantidade: 1, causa: 'Cobra' },
    { pen: 'F-19', quantidade: 3, causa: 'Não Identificada' },
    
    // Piquete G-17
    { pen: 'G-17', quantidade: 2, causa: 'Não Identificada' },
    
    // Piquete H-01
    { pen: 'H-01', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete H-02
    { pen: 'H-02', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'H-02', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete H-18
    { pen: 'H-18', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'H-18', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete H-22
    { pen: 'H-22', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'H-22', quantidade: 2, causa: 'Não Identificada' },
    
    // Piquete J-01
    { pen: 'J-01', quantidade: 1, causa: 'Acidente' },
    { pen: 'J-01', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete J-02
    { pen: 'J-02', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'J-02', quantidade: 3, causa: 'Não Identificada' },
    
    // Piquete J-03
    { pen: 'J-03', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'J-03', quantidade: 2, causa: 'Não Identificada' },
    
    // Piquete J-06
    { pen: 'J-06', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'J-06', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete L-03
    { pen: 'L-03', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete L-04
    { pen: 'L-04', quantidade: 1, causa: 'Timpanismo' },
    
    // Piquete L-07
    { pen: 'L-07', quantidade: 1, causa: 'Timpanismo' },
    
    // Piquete M-01
    { pen: 'M-01', quantidade: 1, causa: 'Pneumonia' },
    
    // Piquete M-02
    { pen: 'M-02', quantidade: 1, causa: 'Transporte' },
    
    // Piquete M-03
    { pen: 'M-03', quantidade: 1, causa: 'Transporte' },
    
    // Piquete M-05
    { pen: 'M-05', quantidade: 1, causa: 'Timpanismo' },
    
    // Piquete M-06
    { pen: 'M-06', quantidade: 1, causa: 'Timpanismo' },
    
    // Piquete M-07
    { pen: 'M-07', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete N-09
    { pen: 'N-09', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete N-10
    { pen: 'N-10', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete O-02
    { pen: 'O-02', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete O-03
    { pen: 'O-03', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'O-03', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete P-02
    { pen: 'P-02', quantidade: 1, causa: 'Transporte' },
    
    // Piquete P-08
    { pen: 'P-08', quantidade: 1, causa: 'Timpanismo' },
    
    // Piquete Q-03
    { pen: 'Q-03', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete T-05
    { pen: 'T-05', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'T-05', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete T-06
    { pen: 'T-06', quantidade: 1, causa: 'Timpanismo' },
    
    // Piquete T-07
    { pen: 'T-07', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'T-07', quantidade: 1, causa: 'Não Identificada' },
    
    // Piquete T-08
    { pen: 'T-08', quantidade: 1, causa: 'Timpanismo' },
    { pen: 'T-08', quantidade: 2, causa: 'Não Identificada' }
  ];
  
  // Mapeamento de causas para categorias do sistema
  const causaParaCategoria = {
    'Pneumonia': 'DISEASE',
    'Não Identificada': 'UNKNOWN',
    'Cobra': 'PREDATION',
    'Timpanismo': 'DISEASE',
    'Transporte': 'STRESS',
    'Acidente': 'ACCIDENT'
  };
  
  console.log('📊 RESUMO DAS MORTES A CADASTRAR:');
  console.log('===================================');
  
  // Calcular totais por causa
  const totaisPorCausa = {};
  let totalGeral = 0;
  
  for (const morte of mortesRelatorio) {
    if (!totaisPorCausa[morte.causa]) {
      totaisPorCausa[morte.causa] = 0;
    }
    totaisPorCausa[morte.causa] += morte.quantidade;
    totalGeral += morte.quantidade;
  }
  
  console.log('\n📈 Mortes por Causa:');
  for (const [causa, total] of Object.entries(totaisPorCausa)) {
    const categoria = causaParaCategoria[causa];
    console.log(`  ${causa} (${categoria}): ${total} mortes`);
  }
  console.log(`\n  TOTAL GERAL: ${totalGeral} mortes`);
  
  console.log('\n🔄 INICIANDO CADASTRO...\n');
  
  // Buscar o primeiro usuário para atribuir as mortes
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('Nenhum usuário encontrado no sistema');
  }
  
  let mortesRegistradas = 0;
  let erros = 0;
  
  for (const morte of mortesRelatorio) {
    try {
      // Buscar o curral
      const pen = await prisma.pen.findUnique({
        where: { penNumber: morte.pen }
      });
      
      if (!pen) {
        console.log(`❌ Curral ${morte.pen} não encontrado`);
        erros++;
        continue;
      }
      
      // Buscar alocação ativa no curral (pegar o primeiro lote)
      const alocacao = await prisma.lotPenLink.findFirst({
        where: {
          penId: pen.id,
          status: 'ACTIVE',
          quantity: { gt: 0 }
        },
        include: {
          purchase: true
        }
      });
      
      let purchaseId = null;
      let estimatedLoss = 0;
      
      if (alocacao) {
        purchaseId = alocacao.purchaseId;
        
        // Calcular perda estimada
        const purchase = alocacao.purchase;
        const averageWeight = purchase.averageWeight || 
                            (purchase.purchaseWeight / purchase.initialQuantity);
        const pricePerKg = purchase.totalCost / 
                         (purchase.initialQuantity * purchase.purchaseWeight);
        estimatedLoss = morte.quantidade * averageWeight * pricePerKg;
        
        // Atualizar quantidade na alocação
        await prisma.lotPenLink.update({
          where: { id: alocacao.id },
          data: {
            quantity: alocacao.quantity - morte.quantidade
          }
        });
        
        // Atualizar contadores no lote
        await prisma.cattlePurchase.update({
          where: { id: purchaseId },
          data: {
            currentQuantity: { decrement: morte.quantidade },
            deathCount: { increment: morte.quantidade }
          }
        });
      }
      
      // Criar registro de morte apenas se houver lote associado
      if (purchaseId) {
        const deathRecord = await prisma.deathRecord.create({
          data: {
            purchaseId: purchaseId,
            penId: pen.id,
            quantity: morte.quantidade,
            deathDate: new Date(), // Usar data atual
            deathType: causaParaCategoria[morte.causa],
            cause: morte.causa,
            veterinaryNotes: `Morte registrada do relatório - Causa: ${morte.causa}`,
            estimatedLoss: estimatedLoss,
            userId: user.id
          }
        });
      } else {
        // Para currais sem alocação, vamos pegar o primeiro lote disponível
        const primeiroLote = await prisma.cattlePurchase.findFirst({
          where: { status: { in: ['CONFIRMED', 'RECEIVED', 'CONFINED'] } },
          orderBy: { createdAt: 'asc' }
        });
        
        if (primeiroLote) {
          const deathRecord = await prisma.deathRecord.create({
            data: {
              purchaseId: primeiroLote.id,
              penId: pen.id,
              quantity: morte.quantidade,
              deathDate: new Date(),
              deathType: causaParaCategoria[morte.causa],
              cause: morte.causa,
              veterinaryNotes: `Morte registrada do relatório - Causa: ${morte.causa} (Lote atribuído automaticamente)`,
              estimatedLoss: 0,
              userId: user.id
            }
          });
        } else {
          console.log(`⚠️ Não foi possível registrar morte no curral ${morte.pen} - Nenhum lote disponível`);
          erros++;
          continue;
        }
      }
      
      mortesRegistradas += morte.quantidade;
      
      if (alocacao) {
        console.log(`✅ ${morte.quantidade} morte(s) registrada(s) no curral ${morte.pen} (Lote: ${alocacao.purchase.lotCode}) - Causa: ${morte.causa}`);
      } else {
        console.log(`⚠️ ${morte.quantidade} morte(s) registrada(s) no curral ${morte.pen} (SEM LOTE ATIVO) - Causa: ${morte.causa}`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao registrar morte no curral ${morte.pen}:`, error.message);
      erros++;
    }
  }
  
  console.log('\n📊 RESUMO DO CADASTRO:');
  console.log('======================');
  console.log(`✅ Mortes registradas: ${mortesRegistradas}`);
  console.log(`❌ Erros: ${erros}`);
  
  // Verificar estatísticas finais
  const estatisticas = await prisma.deathRecord.groupBy({
    by: ['deathType'],
    _sum: {
      quantity: true,
      estimatedLoss: true
    }
  });
  
  console.log('\n📈 ESTATÍSTICAS FINAIS POR TIPO:');
  console.log('==================================');
  
  for (const stat of estatisticas) {
    console.log(`${stat.deathType}: ${stat._sum.quantity} mortes - Perda estimada: R$ ${stat._sum.estimatedLoss?.toFixed(2) || '0.00'}`);
  }
  
  const totalMortes = await prisma.deathRecord.aggregate({
    _sum: {
      quantity: true,
      estimatedLoss: true
    }
  });
  
  console.log(`\nTOTAL GERAL: ${totalMortes._sum.quantity} mortes - Perda total: R$ ${totalMortes._sum.estimatedLoss?.toFixed(2) || '0.00'}`);
  
  await prisma.$disconnect();
}

cadastrarMortes().catch(console.error);
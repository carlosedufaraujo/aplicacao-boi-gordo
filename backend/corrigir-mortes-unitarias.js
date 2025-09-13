const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigirMortesUnitarias() {
  console.log('🔄 CORREÇÃO DO CADASTRO DE MORTES');
  console.log('==================================\n');
  
  try {
    // 1. PRIMEIRO: Limpar todos os registros de mortes existentes
    console.log('🧹 Limpando registros de mortes anteriores...');
    const deletadas = await prisma.deathRecord.deleteMany({});
    console.log(`✅ ${deletadas.count} registros de mortes removidos\n`);
    
    // 2. Restaurar quantidades nos lotes
    console.log('📦 Restaurando quantidades nos lotes...');
    const lotes = await prisma.cattlePurchase.findMany();
    for (const lote of lotes) {
      await prisma.cattlePurchase.update({
        where: { id: lote.id },
        data: {
          currentQuantity: lote.initialQuantity,
          deathCount: 0
        }
      });
    }
    console.log(`✅ ${lotes.length} lotes restaurados\n`);
    
    // 3. Calcular custo médio por animal (apenas compra + comissão)
    console.log('💰 CALCULANDO CUSTO MÉDIO POR ANIMAL:');
    console.log('=====================================\n');
    
    let custoTotalComprasComComissao = 0;
    let totalAnimaisComprados = 0;
    
    for (const lote of lotes) {
      const custoCompra = lote.purchaseValue || lote.totalCost || 0;
      const comissao = lote.commission || 0;
      const custoComComissao = custoCompra + comissao;
      
      custoTotalComprasComComissao += custoComComissao;
      totalAnimaisComprados += lote.initialQuantity;
      
      console.log(`Lote ${lote.lotCode}:`);
      console.log(`  Custo compra: R$ ${custoCompra.toFixed(2)}`);
      console.log(`  Comissão: R$ ${comissao.toFixed(2)}`);
      console.log(`  Total: R$ ${custoComComissao.toFixed(2)}`);
      console.log(`  Animais: ${lote.initialQuantity}`);
    }
    
    const custoMedioPorAnimal = custoTotalComprasComComissao / totalAnimaisComprados;
    
    console.log('\n📊 RESUMO DO CÁLCULO:');
    console.log(`Custo total (compra + comissão): R$ ${custoTotalComprasComComissao.toFixed(2)}`);
    console.log(`Total de animais: ${totalAnimaisComprados}`);
    console.log(`CUSTO MÉDIO POR ANIMAL: R$ ${custoMedioPorAnimal.toFixed(2)}\n`);
    
    // 4. Dados das 75 mortes do relatório
    const mortesParaCadastrar = [
      { pen: 'C-01', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'C-14', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'C-15', causa: 'Cobra', tipo: 'PREDATION' },
      { pen: 'C-15', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'D-01', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'D-01', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'D-05', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'D-06', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'D-06', causa: 'Não Identificada', tipo: 'UNKNOWN' }, // 2ª morte em D-06
      { pen: 'E-01', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'E-01', causa: 'Não Identificada', tipo: 'UNKNOWN' }, // 2ª morte em E-01
      { pen: 'E-03', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'E-13', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'F-17', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'F-17', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'F-17', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'F-17', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'F-17', causa: 'Não Identificada', tipo: 'UNKNOWN' }, // Total: 5 em F-17
      { pen: 'F-18', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'F-18', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'F-18', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'F-18', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'F-18', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'F-18', causa: 'Não Identificada', tipo: 'UNKNOWN' }, // Total: 6 em F-18
      { pen: 'F-19', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'F-19', causa: 'Cobra', tipo: 'PREDATION' },
      { pen: 'F-19', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'F-19', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'F-19', causa: 'Não Identificada', tipo: 'UNKNOWN' }, // Total: 5 em F-19
      { pen: 'G-17', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'G-17', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'H-01', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'H-02', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'H-02', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'H-18', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'H-18', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'H-22', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'H-22', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'H-22', causa: 'Não Identificada', tipo: 'UNKNOWN' }, // Total: 3 em H-22
      { pen: 'J-01', causa: 'Acidente', tipo: 'ACCIDENT' },
      { pen: 'J-01', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'J-02', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'J-02', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'J-02', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'J-02', causa: 'Não Identificada', tipo: 'UNKNOWN' }, // Total: 4 em J-02
      { pen: 'J-03', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'J-03', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'J-03', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'J-06', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'J-06', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'L-03', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'L-04', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'L-07', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'M-01', causa: 'Pneumonia', tipo: 'DISEASE' },
      { pen: 'M-02', causa: 'Transporte', tipo: 'STRESS' },
      { pen: 'M-03', causa: 'Transporte', tipo: 'STRESS' },
      { pen: 'M-05', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'M-06', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'M-07', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'N-09', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'N-10', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'O-02', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'O-03', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'O-03', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'P-02', causa: 'Transporte', tipo: 'STRESS' },
      { pen: 'P-08', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'Q-03', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'T-05', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'T-05', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'T-06', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'T-07', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'T-07', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'T-08', causa: 'Timpanismo', tipo: 'DISEASE' },
      { pen: 'T-08', causa: 'Não Identificada', tipo: 'UNKNOWN' },
      { pen: 'T-08', causa: 'Não Identificada', tipo: 'UNKNOWN' } // Total: 3 em T-08
    ];
    
    console.log(`\n💀 CADASTRANDO ${mortesParaCadastrar.length} MORTES UNITÁRIAS:`);
    console.log('=====================================\n');
    
    // Buscar primeiro usuário
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('Nenhum usuário encontrado');
    
    let mortesRegistradas = 0;
    let errosRegistro = 0;
    
    for (let i = 0; i < mortesParaCadastrar.length; i++) {
      const morte = mortesParaCadastrar[i];
      
      try {
        // Buscar o curral
        const pen = await prisma.pen.findUnique({
          where: { penNumber: morte.pen }
        });
        
        if (!pen) {
          console.log(`❌ Curral ${morte.pen} não encontrado`);
          errosRegistro++;
          continue;
        }
        
        // Buscar alocação ativa no curral
        const alocacao = await prisma.lotPenLink.findFirst({
          where: {
            penId: pen.id,
            status: 'ACTIVE',
            quantity: { gt: 0 }
          },
          include: { purchase: true }
        });
        
        let purchaseId = null;
        
        if (alocacao) {
          purchaseId = alocacao.purchaseId;
          
          // Atualizar quantidade na alocação
          await prisma.lotPenLink.update({
            where: { id: alocacao.id },
            data: { quantity: alocacao.quantity - 1 }
          });
          
          // Atualizar contadores no lote
          await prisma.cattlePurchase.update({
            where: { id: purchaseId },
            data: {
              currentQuantity: { decrement: 1 },
              deathCount: { increment: 1 }
            }
          });
        } else {
          // Se não houver alocação, pegar primeiro lote disponível
          const primeiroLote = await prisma.cattlePurchase.findFirst({
            where: { status: { in: ['CONFIRMED', 'RECEIVED', 'CONFINED'] } },
            orderBy: { createdAt: 'asc' }
          });
          
          if (primeiroLote) {
            purchaseId = primeiroLote.id;
            
            // Atualizar contadores no lote
            await prisma.cattlePurchase.update({
              where: { id: purchaseId },
              data: {
                currentQuantity: { decrement: 1 },
                deathCount: { increment: 1 }
              }
            });
          }
        }
        
        if (!purchaseId) {
          console.log(`❌ Não foi possível atribuir lote para morte no curral ${morte.pen}`);
          errosRegistro++;
          continue;
        }
        
        // Criar registro de morte individual
        await prisma.deathRecord.create({
          data: {
            purchaseId: purchaseId,
            penId: pen.id,
            quantity: 1, // SEMPRE 1 (unitário)
            deathDate: new Date(),
            deathType: morte.tipo,
            cause: morte.causa,
            veterinaryNotes: `Morte registrada - ${morte.causa}`,
            estimatedLoss: custoMedioPorAnimal, // Custo médio calculado
            userId: user.id
          }
        });
        
        mortesRegistradas++;
        console.log(`✅ Morte ${i+1}/75: ${morte.pen} - ${morte.causa} (R$ ${custoMedioPorAnimal.toFixed(2)})`);
        
      } catch (error) {
        console.error(`❌ Erro ao registrar morte ${i+1}:`, error.message);
        errosRegistro++;
      }
    }
    
    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log('===================');
    console.log(`Total de mortes esperadas: 75`);
    console.log(`Mortes registradas com sucesso: ${mortesRegistradas}`);
    console.log(`Erros no registro: ${errosRegistro}`);
    console.log(`Custo médio por animal: R$ ${custoMedioPorAnimal.toFixed(2)}`);
    console.log(`PERDA CONTÁBIL TOTAL: R$ ${(mortesRegistradas * custoMedioPorAnimal).toFixed(2)}`);
    
    // Verificar totais por tipo
    const estatisticas = await prisma.deathRecord.groupBy({
      by: ['deathType'],
      _sum: { quantity: true, estimatedLoss: true }
    });
    
    console.log('\n📈 ESTATÍSTICAS POR TIPO:');
    for (const stat of estatisticas) {
      console.log(`${stat.deathType}: ${stat._sum.quantity} mortes - R$ ${stat._sum.estimatedLoss.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigirMortesUnitarias().catch(console.error);
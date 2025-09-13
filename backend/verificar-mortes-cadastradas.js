const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarMortes() {
  console.log('📊 VERIFICAÇÃO DETALHADA DAS MORTES CADASTRADAS');
  console.log('================================================\n');
  
  try {
    // 1. Total geral
    const totalMortes = await prisma.deathRecord.aggregate({
      _sum: {
        quantity: true,
        estimatedLoss: true
      }
    });
    
    console.log('📈 TOTAIS GERAIS:');
    console.log(`Total de mortes: ${totalMortes._sum.quantity}`);
    console.log(`Perda contábil total: R$ ${totalMortes._sum.estimatedLoss?.toFixed(2) || '0.00'}`);
    console.log(`Custo médio por animal: R$ ${(totalMortes._sum.estimatedLoss / totalMortes._sum.quantity).toFixed(2)}\n`);
    
    // 2. Por tipo/causa
    const porCausa = await prisma.deathRecord.groupBy({
      by: ['cause'],
      _sum: { quantity: true }
    });
    
    console.log('📊 MORTES POR CAUSA:');
    const totaisPorCausa = {};
    for (const item of porCausa) {
      totaisPorCausa[item.cause] = item._sum.quantity;
      console.log(`${item.cause}: ${item._sum.quantity}`);
    }
    
    // 3. Por piquete
    const porPiquete = await prisma.deathRecord.groupBy({
      by: ['penId'],
      _sum: { quantity: true }
    });
    
    console.log('\n📍 MORTES POR PIQUETE:');
    for (const item of porPiquete) {
      const pen = await prisma.pen.findUnique({
        where: { id: item.penId }
      });
      console.log(`${pen.penNumber}: ${item._sum.quantity} mortes`);
    }
    
    // 4. Validação com relatório original
    console.log('\n✅ VALIDAÇÃO COM RELATÓRIO ORIGINAL:');
    console.log('======================================');
    
    const esperado = {
      'Pneumonia': 36,
      'Não Identificada': 30,
      'Cobra': 2,
      'Acidente': 1,
      'Outras': 1
    };
    
    let totalEsperado = 0;
    let totalCadastrado = 0;
    
    for (const [causa, qtdEsperada] of Object.entries(esperado)) {
      const qtdCadastrada = totaisPorCausa[causa] || 0;
      totalEsperado += qtdEsperada;
      totalCadastrado += qtdCadastrada;
      
      if (qtdCadastrada === qtdEsperada) {
        console.log(`✅ ${causa}: ${qtdCadastrada} (esperado: ${qtdEsperada})`);
      } else {
        console.log(`❌ ${causa}: ${qtdCadastrada} (esperado: ${qtdEsperada}) - DIFERENÇA: ${qtdCadastrada - qtdEsperada}`);
      }
    }
    
    console.log(`\nTOTAL ESPERADO: ${totalEsperado}`);
    console.log(`TOTAL CADASTRADO: ${totalMortes._sum.quantity}`);
    
    if (totalMortes._sum.quantity === 70) {
      console.log('✅ TOTAL CORRETO: 70 mortes');
    } else {
      console.log(`❌ TOTAL INCORRETO: ${totalMortes._sum.quantity} (esperado: 70)`);
    }
    
    // 5. Top 5 piquetes
    const piquetesComMortes = [];
    for (const item of porPiquete) {
      const pen = await prisma.pen.findUnique({
        where: { id: item.penId }
      });
      piquetesComMortes.push({
        piquete: pen.penNumber,
        mortes: item._sum.quantity
      });
    }
    
    piquetesComMortes.sort((a, b) => b.mortes - a.mortes);
    
    console.log('\n🏆 TOP 5 PIQUETES COM MAIS MORTES:');
    for (let i = 0; i < Math.min(5, piquetesComMortes.length); i++) {
      console.log(`${i+1}. ${piquetesComMortes[i].piquete}: ${piquetesComMortes[i].mortes} mortes`);
    }
    
    // 6. Período das mortes
    const mortes = await prisma.deathRecord.findMany({
      select: { deathDate: true }
    });
    
    const datas = mortes.map(m => m.deathDate);
    const dataMin = new Date(Math.min(...datas));
    const dataMax = new Date(Math.max(...datas));
    
    console.log('\n📅 PERÍODO DAS MORTES:');
    console.log(`De: ${dataMin.toLocaleDateString('pt-BR')}`);
    console.log(`Até: ${dataMax.toLocaleDateString('pt-BR')}`);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarMortes().catch(console.error);
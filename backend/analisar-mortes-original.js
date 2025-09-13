const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analisarMortesOriginal() {
  console.log('📊 ANÁLISE MINUCIOSA DO RELATÓRIO DE MORTES');
  console.log('============================================\n');
  
  // Dados EXATOS do relatório original
  const mortesRelatorio = [
    { piquete: 'C-01', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'C-14', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'C-15', causa: 'Cobra', quantidade: 1 },
    { piquete: 'C-15', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'D-01', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'D-01', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'D-05', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'D-06', causa: 'Não Identificada', quantidade: 2 },
    { piquete: 'E-01', causa: 'Não Identificada', quantidade: 2 },
    { piquete: 'E-03', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'E-13', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'F-17', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'F-17', causa: 'Não Identificada', quantidade: 4 },
    { piquete: 'F-18', causa: 'Timpanismo', quantidade: 2 },
    { piquete: 'F-18', causa: 'Não Identificada', quantidade: 4 },
    { piquete: 'F-19', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'F-19', causa: 'Cobra', quantidade: 1 },
    { piquete: 'F-19', causa: 'Não Identificada', quantidade: 3 },
    { piquete: 'G-17', causa: 'Não Identificada', quantidade: 2 },
    { piquete: 'H-01', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'H-02', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'H-02', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'H-18', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'H-18', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'H-22', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'H-22', causa: 'Não Identificada', quantidade: 2 },
    { piquete: 'J-01', causa: 'Acidente', quantidade: 1 },
    { piquete: 'J-01', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'J-02', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'J-02', causa: 'Não Identificada', quantidade: 3 },
    { piquete: 'J-03', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'J-03', causa: 'Não Identificada', quantidade: 2 },
    { piquete: 'J-06', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'J-06', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'L-03', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'L-04', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'L-07', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'M-01', causa: 'Pneumonia', quantidade: 1 },
    { piquete: 'M-02', causa: 'Transporte', quantidade: 1 },
    { piquete: 'M-03', causa: 'Transporte', quantidade: 1 },
    { piquete: 'M-05', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'M-06', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'M-07', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'N-09', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'N-10', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'O-02', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'O-03', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'O-03', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'P-02', causa: 'Transporte', quantidade: 1 },
    { piquete: 'P-08', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'Q-03', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'T-05', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'T-05', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'T-06', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'T-07', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'T-07', causa: 'Não Identificada', quantidade: 1 },
    { piquete: 'T-08', causa: 'Timpanismo', quantidade: 1 },
    { piquete: 'T-08', causa: 'Não Identificada', quantidade: 2 }
  ];
  
  // Contar total de mortes
  let totalMortes = 0;
  const mortesPorCausa = {};
  const mortesPorPiquete = {};
  
  for (const morte of mortesRelatorio) {
    totalMortes += morte.quantidade;
    
    // Por causa
    if (!mortesPorCausa[morte.causa]) {
      mortesPorCausa[morte.causa] = 0;
    }
    mortesPorCausa[morte.causa] += morte.quantidade;
    
    // Por piquete
    if (!mortesPorPiquete[morte.piquete]) {
      mortesPorPiquete[morte.piquete] = 0;
    }
    mortesPorPiquete[morte.piquete] += morte.quantidade;
  }
  
  console.log('📊 CONTAGEM EXATA DO RELATÓRIO ORIGINAL:');
  console.log('=========================================\n');
  
  console.log('TOTAL DE MORTES:', totalMortes);
  console.log('\nMORTES POR CAUSA:');
  for (const [causa, qtd] of Object.entries(mortesPorCausa)) {
    console.log(`  ${causa}: ${qtd}`);
  }
  
  console.log('\nTOTAL DE PIQUETES AFETADOS:', Object.keys(mortesPorPiquete).length);
  console.log('\nMORTES POR PIQUETE:');
  for (const [piquete, qtd] of Object.entries(mortesPorPiquete)) {
    console.log(`  ${piquete}: ${qtd}`);
  }
  
  // Calcular custo médio por animal
  console.log('\n💰 CÁLCULO DO CUSTO MÉDIO POR ANIMAL:');
  console.log('======================================\n');
  
  const compras = await prisma.cattlePurchase.findMany({
    select: {
      lotCode: true,
      initialQuantity: true,
      purchaseValue: true,
      commission: true,
      totalCost: true
    }
  });
  
  let custoTotalCompras = 0;
  let totalAnimaisComprados = 0;
  
  for (const compra of compras) {
    // Custo de compra + comissão (purchaseValue já é o custo de compra)
    const custoCompra = compra.purchaseValue || compra.totalCost;
    const comissao = compra.commission || 0;
    const custoTotal = custoCompra + comissao;
    
    custoTotalCompras += custoTotal;
    totalAnimaisComprados += compra.initialQuantity;
    
    console.log(`Lote ${compra.lotCode}:`);
    console.log(`  Custo compra: R$ ${custoCompra.toFixed(2)}`);
    console.log(`  Comissão: R$ ${comissao.toFixed(2)}`);
    console.log(`  Total: R$ ${custoTotal.toFixed(2)}`);
    console.log(`  Quantidade: ${compra.initialQuantity} animais`);
  }
  
  const custoMedioPorAnimal = custoTotalCompras / totalAnimaisComprados;
  const perdaContabilTotal = totalMortes * custoMedioPorAnimal;
  
  console.log('\n📈 RESULTADO FINAL:');
  console.log('===================');
  console.log(`Custo total (compra + comissão): R$ ${custoTotalCompras.toFixed(2)}`);
  console.log(`Total de animais comprados: ${totalAnimaisComprados}`);
  console.log(`CUSTO MÉDIO POR ANIMAL: R$ ${custoMedioPorAnimal.toFixed(2)}`);
  console.log(`\nTotal de mortes: ${totalMortes}`);
  console.log(`PERDA CONTÁBIL TOTAL: R$ ${perdaContabilTotal.toFixed(2)}`);
  
  await prisma.$disconnect();
}

analisarMortesOriginal().catch(console.error);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCompleteSale() {
  try {
    console.log('🔍 Verificando vendas existentes...');
    const existingSales = await prisma.saleRecord.findMany();
    console.log(`📊 Vendas existentes: ${existingSales.length}`);
    
    // Buscar dados necessários
    console.log('\n🔍 Buscando dados necessários...');
    
    const pen = await prisma.pen.findFirst({
      where: { isActive: true }
    });
    
    const buyer = await prisma.partner.findFirst({
      where: { type: 'BUYER' }
    });
    
    const receiverAccount = await prisma.payerAccount.findFirst();
    
    const purchase = await prisma.cattlePurchase.findFirst();
    
    if (!pen || !buyer) {
      console.log('❌ Dados necessários não encontrados');
      console.log('Pen:', pen ? '✅' : '❌');
      console.log('Buyer:', buyer ? '✅' : '❌');
      return;
    }
    
    // Criar venda de teste
    const saleData = {
      saleDate: new Date(),
      penId: pen.id,
      purchaseId: purchase?.id,
      saleType: 'total',
      quantity: 10,
      buyerId: buyer.id,
      exitWeight: 4500, // 450kg por cabeça
      carcassWeight: 2250, // 50% de rendimento
      carcassYield: 50,
      pricePerArroba: 300,
      arrobas: 150, // 2250 / 15
      totalValue: 45000, // 150 * 300
      deductions: 0,
      netValue: 45000,
      paymentType: 'cash',
      paymentDate: new Date(),
      receiverAccountId: receiverAccount?.id,
      observations: 'Venda de teste',
      status: 'PENDING'
    };
    
    console.log('\n📝 Criando venda de teste...');
    console.log('Dados:', JSON.stringify(saleData, null, 2));
    
    const newSale = await prisma.saleRecord.create({
      data: saleData,
      include: {
        pen: true,
        buyer: true,
        purchase: true,
        receiverAccount: true
      }
    });
    
    console.log('\n✅ Venda criada com sucesso!');
    console.log('ID:', newSale.id);
    console.log('Status:', newSale.status);
    console.log('Valor Total:', newSale.totalValue);
    
    // Verificar se foi salva
    console.log('\n🔍 Verificando se foi salva...');
    const savedSale = await prisma.saleRecord.findUnique({
      where: { id: newSale.id }
    });
    
    if (savedSale) {
      console.log('✅ Venda encontrada no banco de dados!');
      
      // Testar listagem
      console.log('\n📋 Testando listagem...');
      const allSales = await prisma.saleRecord.findMany({
        include: {
          pen: true,
          buyer: true,
          purchase: true,
          receiverAccount: true
        }
      });
      
      console.log(`Total de vendas: ${allSales.length}`);
      
      // Testar estatísticas
      console.log('\n📊 Calculando estatísticas...');
      const stats = await prisma.saleRecord.aggregate({
        _count: true,
        _sum: {
          quantity: true,
          exitWeight: true,
          carcassWeight: true,
          totalValue: true,
          netValue: true
        },
        _avg: {
          pricePerArroba: true,
          carcassYield: true
        }
      });
      
      console.log('Estatísticas:');
      console.log('- Total de vendas:', stats._count);
      console.log('- Quantidade total:', stats._sum.quantity);
      console.log('- Peso total de saída:', stats._sum.exitWeight);
      console.log('- Peso total de carcaça:', stats._sum.carcassWeight);
      console.log('- Valor total:', stats._sum.totalValue);
      console.log('- Valor líquido total:', stats._sum.netValue);
      console.log('- Preço médio por arroba:', stats._avg.pricePerArroba);
      console.log('- Rendimento médio:', stats._avg.carcassYield);
      
    } else {
      console.log('❌ Venda não foi encontrada no banco!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    console.error('Detalhes:', error.message);
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteSale();
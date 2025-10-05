import { prisma } from '../src/config/database';

async function addSales() {
  console.log('🔄 Adicionando vendas ao sistema...');

  try {
    // Buscar primeiro comprador disponível (ou criar um padrão)
    let buyer = await prisma.partner.findFirst({
      where: { type: 'BUYER' }
    });

    if (!buyer) {
      console.log('📝 Criando comprador padrão...');
      buyer = await prisma.partner.create({
        data: {
          name: 'Frigorífico Central',
          type: 'BUYER',
          document: '12.345.678/0001-90',
          phone: '(65) 99999-9999',
          email: 'contato@frigorifico.com',
          address: 'Rodovia BR-163, KM 500',
          city: 'Cuiabá',
          state: 'MT',
          zipCode: '78000-000',
          isActive: true
        }
      });
    }

    // Dados das 4 vendas com cálculos corretos
    const salesData = [
      {
        saleDate: new Date('2025-10-01'),
        buyerId: buyer.id,
        quantity: 45,
        exitWeight: 27000, // 600kg por boi
        carcassWeight: 13500, // 50% de rendimento
        carcassYield: 50,
        pricePerArroba: 283.64, // Calculado baseado no valor total
        arrobas: 900, // 13500 / 15
        totalValue: 255774.36,
        deductions: 0,
        netValue: 255774.36,
        saleType: 'REGULAR',
        paymentType: 'TRANSFER',
        paymentDate: new Date('2025-10-01'),
        status: 'PAID' as const,
        observations: 'Venda de 45 bois - Lote outubro/2025'
      },
      {
        saleDate: new Date('2025-10-02'),
        buyerId: buyer.id,
        quantity: 50,
        exitWeight: 30000, // 600kg por boi
        carcassWeight: 15000, // 50% de rendimento
        carcassYield: 50,
        pricePerArroba: 237.53, // Calculado baseado no valor total
        arrobas: 1000, // 15000 / 15
        totalValue: 237525.79,
        deductions: 0,
        netValue: 237525.79,
        saleType: 'REGULAR',
        paymentType: 'TRANSFER',
        paymentDate: new Date('2025-10-02'),
        status: 'PAID' as const,
        observations: 'Venda de 50 bois - Lote outubro/2025'
      },
      {
        saleDate: new Date('2025-10-03'),
        buyerId: buyer.id,
        quantity: 100,
        exitWeight: 60000, // 600kg por boi
        carcassWeight: 30000, // 50% de rendimento
        carcassYield: 50,
        pricePerArroba: 228.87, // Calculado baseado no valor total
        arrobas: 2000, // 30000 / 15
        totalValue: 455734.26,
        deductions: 0,
        netValue: 455734.26,
        saleType: 'REGULAR',
        paymentType: 'TRANSFER',
        paymentDate: new Date('2025-10-03'),
        status: 'PAID' as const,
        observations: 'Venda de 100 bois - Primeiro lote outubro/2025'
      },
      {
        saleDate: new Date('2025-10-03'),
        buyerId: buyer.id,
        quantity: 100,
        exitWeight: 60000, // 600kg por boi
        carcassWeight: 30000, // 50% de rendimento
        carcassYield: 50,
        pricePerArroba: 235.44, // Calculado baseado no valor total
        arrobas: 2000, // 30000 / 15
        totalValue: 470881.50,
        deductions: 0,
        netValue: 470881.50,
        saleType: 'REGULAR',
        paymentType: 'TRANSFER',
        paymentDate: new Date('2025-10-03'),
        status: 'PAID' as const,
        observations: 'Venda de 100 bois - Segundo lote outubro/2025'
      }
    ];

    // Criar as vendas
    for (const saleData of salesData) {
      const sale = await prisma.saleRecord.create({
        data: saleData
      });

      console.log(`✅ Venda criada: ${sale.quantity} bois - R$ ${sale.totalValue.toFixed(2)}`);
    }

    // Verificar total de vendas
    const totalSales = await prisma.saleRecord.count();
    const totalRevenue = await prisma.saleRecord.aggregate({
      _sum: {
        totalValue: true
      }
    });

    console.log('\n📊 Resumo das vendas:');
    console.log(`Total de vendas no sistema: ${totalSales}`);
    console.log(`Valor total vendido: R$ ${totalRevenue._sum.totalValue?.toFixed(2) || '0.00'}`);
    console.log('\n✅ Todas as 4 vendas foram adicionadas com sucesso!');

    // Mostrar detalhes das vendas adicionadas
    console.log('\n📝 Detalhes das vendas adicionadas:');
    console.log('1. 45 bois - R$ 255.774,36');
    console.log('2. 50 bois - R$ 237.525,79');
    console.log('3. 100 bois - R$ 455.734,26');
    console.log('4. 100 bois - R$ 470.881,50');
    console.log(`\nTotal: 295 bois - R$ 1.419.915,91`);

  } catch (error) {
    console.error('❌ Erro ao adicionar vendas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
addSales().catch(console.error);
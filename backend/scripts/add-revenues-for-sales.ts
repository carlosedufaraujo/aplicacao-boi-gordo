import { prisma } from '../src/config/database';

async function addRevenuesForSales() {
  console.log('🔄 Adicionando receitas para as vendas existentes...');

  try {
    // Buscar usuário admin para associar às receitas
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (!adminUser) {
      throw new Error('Nenhum usuário admin encontrado');
    }

    // Buscar vendas que não têm receitas associadas
    const salesWithoutRevenue = await prisma.saleRecord.findMany({
      where: {
        revenues: {
          none: {}
        }
      },
      include: {
        buyer: true
      }
    });

    console.log(`📊 Encontradas ${salesWithoutRevenue.length} vendas sem receitas`);

    for (const sale of salesWithoutRevenue) {
      // Criar receita para a venda
      const revenue = await prisma.revenue.create({
        data: {
          dueDate: sale.paymentDate || sale.saleDate,
          receiptDate: sale.status === 'PAID' ? sale.saleDate : null,
          totalAmount: sale.totalValue,
          description: `Venda de ${sale.quantity} bois - ${sale.buyer.name}`,
          category: 'Venda de Gado',
          isReceived: sale.status === 'PAID',
          saleRecordId: sale.id,
          buyerId: sale.buyerId,
          userId: adminUser.id,
          notes: sale.observations
        }
      });

      console.log(`✅ Receita criada para venda de ${sale.quantity} bois - R$ ${revenue.totalAmount.toFixed(2)}`);
    }

    // Verificar totais
    const totalRevenues = await prisma.revenue.count();
    const totalRevenueAmount = await prisma.revenue.aggregate({
      _sum: {
        totalAmount: true
      },
      where: {
        category: 'Venda de Gado'
      }
    });

    console.log('\n📊 Resumo das receitas:');
    console.log(`Total de receitas no sistema: ${totalRevenues}`);
    console.log(`Valor total de vendas (receitas): R$ ${totalRevenueAmount._sum.totalAmount?.toFixed(2) || '0.00'}`);

    // Verificar fluxo de caixa
    const totalIncome = await prisma.cashFlow.aggregate({
      _sum: {
        amount: true
      },
      where: {
        type: 'INCOME',
        category: 'Venda de Gado'
      }
    });

    console.log(`Total no fluxo de caixa (vendas): R$ ${totalIncome._sum.amount?.toFixed(2) || '0.00'}`);
    console.log('\n✅ Todas as receitas foram adicionadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao adicionar receitas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
addRevenuesForSales().catch(console.error);
import { prisma } from '../src/config/database';

async function addCashFlowsForSales() {
  console.log('🔄 Adicionando registros de fluxo de caixa para as vendas...');

  try {
    // Buscar uma conta padrão ou criar uma
    let account = await prisma.payerAccount.findFirst({
      where: {
        isActive: true
      }
    });

    if (!account) {
      console.log('📝 Criando conta padrão...');
      account = await prisma.payerAccount.create({
        data: {
          name: 'Conta Principal',
          accountType: 'CHECKING',
          bank: 'Banco do Brasil',
          agency: '0001',
          accountNumber: '123456',
          isActive: true,
          balance: 0
        }
      });
    }

    // Buscar ou criar categoria de Vendas
    let category = await prisma.category.findFirst({
      where: {
        name: 'Venda de Gado'
      }
    });

    if (!category) {
      console.log('📝 Criando categoria de vendas...');
      category = await prisma.category.create({
        data: {
          name: 'Venda de Gado',
          type: 'INCOME',
          isActive: true,
          color: '#10B981',
          icon: 'TrendingUp'
        }
      });
    }

    // Buscar vendas que já têm receitas
    const salesWithRevenues = await prisma.saleRecord.findMany({
      where: {
        revenues: {
          some: {}
        }
      },
      include: {
        buyer: true,
        revenues: true
      }
    });

    console.log(`📊 Encontradas ${salesWithRevenues.length} vendas com receitas`);

    // Buscar fluxos de caixa existentes para vendas de gado
    const existingCashFlows = await prisma.cashFlow.findMany({
      where: {
        categoryId: category.id,
        description: {
          contains: 'Venda de'
        }
      }
    });

    console.log(`📊 ${existingCashFlows.length} registros de vendas já existem no fluxo de caixa`);

    // Para cada venda, verificar se já existe fluxo de caixa
    let createdCount = 0;
    for (const sale of salesWithRevenues) {
      const description = `Venda de ${sale.quantity} bois - ${sale.buyer.name}`;

      // Verificar se já existe um fluxo de caixa para esta venda
      const exists = existingCashFlows.some(cf =>
        cf.description === description &&
        cf.date.toISOString().slice(0, 10) === sale.saleDate.toISOString().slice(0, 10)
      );

      if (!exists) {
        // Criar registro no fluxo de caixa
        const cashFlow = await prisma.cashFlow.create({
          data: {
            date: sale.saleDate,
            type: 'INCOME',
            categoryId: category.id,
            accountId: account.id,
            description: description,
            amount: sale.netValue,
            status: sale.status === 'PAID' ? 'PAID' : 'PENDING',
            paymentDate: sale.status === 'PAID' ? sale.paymentDate || sale.saleDate : null,
            reference: `VENDA-${sale.id.slice(-6).toUpperCase()}`,
            notes: sale.observations
          }
        });

        console.log(`✅ Fluxo de caixa criado para venda de ${sale.quantity} bois - R$ ${cashFlow.amount.toFixed(2)}`);
        createdCount++;
      }
    }

    if (createdCount === 0) {
      console.log('ℹ️  Todos os registros de vendas já estão no fluxo de caixa');
    }

    // Verificar totais
    const totalCashFlows = await prisma.cashFlow.count();
    const totalIncome = await prisma.cashFlow.aggregate({
      _sum: {
        amount: true
      },
      where: {
        type: 'INCOME'
      }
    });

    const vendaIncome = await prisma.cashFlow.aggregate({
      _sum: {
        amount: true
      },
      where: {
        type: 'INCOME',
        categoryId: category.id
      }
    });

    console.log('\n📊 Resumo do fluxo de caixa:');
    console.log(`Total de registros no fluxo de caixa: ${totalCashFlows}`);
    console.log(`Valor total de entradas: R$ ${totalIncome._sum.amount?.toFixed(2) || '0.00'}`);
    console.log(`Valor de vendas de gado: R$ ${vendaIncome._sum.amount?.toFixed(2) || '0.00'}`);
    console.log('\n✅ Fluxo de caixa atualizado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao adicionar fluxo de caixa:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
addCashFlowsForSales().catch(console.error);
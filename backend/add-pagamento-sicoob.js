const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addPagamentoSicoob() {
  try {
    console.log('🔄 Iniciando adição de Pagamento Sicoob no cash flow...');

    // Buscar ou criar categoria "Pagamento Sicoob"
    let category = await prisma.category.findFirst({
      where: { name: 'Pagamento Sicoob' }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Pagamento Sicoob',
          type: 'EXPENSE',
          color: '#1976D2',
          icon: 'account_balance',
          isActive: true
        }
      });
      console.log('✅ Categoria "Pagamento Sicoob" criada');
    } else {
      console.log('ℹ️ Categoria "Pagamento Sicoob" já existe');
    }

    // Criar a movimentação de Pagamento Sicoob
    const movimentacao = {
      description: 'Pagamento Sicoob - Despesas Administrativas',
      amount: 200000,
      dueDate: new Date('2024-09-30'),
      paidAt: new Date('2024-09-30')
    };

    // Verificar se já existe uma movimentação similar
    const existing = await prisma.cashFlow.findFirst({
      where: {
        description: movimentacao.description,
        amount: movimentacao.amount
      }
    });

    if (!existing) {
      // Buscar uma conta padrão ou usar a primeira disponível
      let account = await prisma.payerAccount.findFirst({
        where: { isActive: true }
      });
      
      if (!account) {
        console.log('❌ Nenhuma conta ativa encontrada. Criando conta padrão...');
        account = await prisma.payerAccount.create({
          data: {
            name: 'Conta Principal',
            type: 'BANK',
            balance: 0,
            isActive: true
          }
        });
      }
      
      const created = await prisma.cashFlow.create({
        data: {
          type: 'EXPENSE',
          categoryId: category.id,
          accountId: account.id,
          description: movimentacao.description,
          amount: movimentacao.amount,
          date: movimentacao.dueDate,
          dueDate: movimentacao.dueDate,
          paymentDate: movimentacao.paidAt,
          status: 'PAID',
          paymentMethod: 'BANK_TRANSFER',
          notes: 'Pagamento Sicoob - Despesas Administrativas/Bancárias'
        }
      });
      console.log(`✅ Movimentação criada: ${movimentacao.description} - R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    } else {
      console.log(`ℹ️ Movimentação já existe: ${movimentacao.description}`);
    }

    console.log(`\n💰 Total de Pagamento Sicoob: R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar Pagamento Sicoob:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
addPagamentoSicoob();
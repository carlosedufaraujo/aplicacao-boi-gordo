const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addPagamentoJuros() {
  try {
    console.log('🔄 Iniciando adição de Pagamento de Juros no cash flow...');

    // Buscar ou criar categoria "Juros e Multas"
    let category = await prisma.category.findFirst({
      where: { name: 'Juros e Multas' }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Juros e Multas',
          type: 'EXPENSE',
          color: '#F44336',
          icon: 'payments',
          isActive: true
        }
      });
      console.log('✅ Categoria "Juros e Multas" criada');
    } else {
      console.log('ℹ️ Categoria "Juros e Multas" já existe');
    }

    // Criar a movimentação de Pagamento de Juros
    const movimentacao = {
      description: 'Pagamento de Juros - Despesas Financeiras',
      amount: 356917.49,
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
          notes: 'Pagamento de juros sobre empréstimos e financiamentos'
        }
      });
      console.log(`✅ Movimentação criada: ${movimentacao.description} - R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    } else {
      console.log(`ℹ️ Movimentação já existe: ${movimentacao.description}`);
    }

    console.log(`\n💰 Total de Pagamento de Juros: R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar Pagamento de Juros:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
addPagamentoJuros();
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addEmprestimosTerceiros() {
  try {
    console.log('🔄 Iniciando adição de Empréstimos a Terceiros no cash flow...');

    // Buscar ou criar categoria "Empréstimos a Terceiros"
    let category = await prisma.category.findFirst({
      where: { name: 'Empréstimos a Terceiros' }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Empréstimos a Terceiros',
          type: 'EXPENSE',
          color: '#9C27B0',
          icon: 'account_balance',
          isActive: true
        }
      });
      console.log('✅ Categoria "Empréstimos a Terceiros" criada');
    } else {
      console.log('ℹ️ Categoria "Empréstimos a Terceiros" já existe');
    }

    // Criar a movimentação de Empréstimos a Terceiros
    const movimentacao = {
      description: 'Empréstimos a Terceiros - Despesas Financeiras',
      amount: 480000,
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
          notes: 'Empréstimos concedidos a terceiros - despesas financeiras'
        }
      });
      console.log(`✅ Movimentação criada: ${movimentacao.description} - R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    } else {
      console.log(`ℹ️ Movimentação já existe: ${movimentacao.description}`);
    }

    console.log(`\n💰 Total de Empréstimos a Terceiros: R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar Empréstimos a Terceiros:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
addEmprestimosTerceiros();
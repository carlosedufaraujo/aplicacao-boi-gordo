const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addFeeCredito() {
  try {
    console.log('🔄 Iniciando adição de Fee de Crédito no cash flow...');

    // Buscar ou criar categoria "Fee de Crédito"
    let category = await prisma.category.findFirst({
      where: { name: 'Fee de Crédito' }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Fee de Crédito',
          type: 'EXPENSE',
          color: '#FF5722',
          icon: 'credit_card',
          isActive: true
        }
      });
      console.log('✅ Categoria "Fee de Crédito" criada');
    } else {
      console.log('ℹ️ Categoria "Fee de Crédito" já existe');
    }

    // Criar a movimentação de Fee de Crédito
    const movimentacao = {
      description: 'Fee de Crédito - Despesas Financeiras',
      amount: 466012.18,
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
          notes: 'Taxa de crédito e financiamento bancário'
        }
      });
      console.log(`✅ Movimentação criada: ${movimentacao.description} - R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    } else {
      console.log(`ℹ️ Movimentação já existe: ${movimentacao.description}`);
    }

    console.log(`\n💰 Total de Fee de Crédito: R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar Fee de Crédito:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
addFeeCredito();
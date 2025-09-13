const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addFinanciamentoPendente() {
  try {
    console.log('🔄 Iniciando adição de Financiamento pendente no cash flow...');

    // Buscar ou criar categoria "Financiamento"
    let category = await prisma.category.findFirst({
      where: { name: 'Financiamento' }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Financiamento',
          type: 'EXPENSE',
          color: '#3F51B5',
          icon: 'account_balance_wallet',
          isActive: true
        }
      });
      console.log('✅ Categoria "Financiamento" criada');
    } else {
      console.log('ℹ️ Categoria "Financiamento" já existe');
    }

    // Criar a ordem de pagamento pendente de Financiamento
    const movimentacao = {
      description: 'Ordem de Pagamento - Financiamento',
      amount: 11868851.25,
      dueDate: new Date('2025-01-20')
    };

    // Verificar se já existe uma movimentação similar
    const existing = await prisma.cashFlow.findFirst({
      where: {
        description: movimentacao.description,
        amount: movimentacao.amount,
        dueDate: movimentacao.dueDate
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
          status: 'PENDING',
          paymentMethod: 'BANK_TRANSFER',
          notes: 'Ordem de pagamento de financiamento com vencimento em 20/01/2025'
        }
      });
      console.log(`✅ Ordem de pagamento criada: ${movimentacao.description}`);
      console.log(`   Valor: R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
      console.log(`   Vencimento: ${movimentacao.dueDate.toLocaleDateString('pt-BR')}`);
      console.log(`   Status: PENDENTE`);
    } else {
      console.log(`ℹ️ Ordem de pagamento já existe: ${movimentacao.description}`);
    }

    console.log(`\n💰 Total do Financiamento (pendente): R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    console.log(`📅 Vencimento: 20/01/2025`);
    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar Financiamento pendente:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
addFinanciamentoPendente();
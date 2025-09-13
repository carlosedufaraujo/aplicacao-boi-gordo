const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addFreteGado() {
  try {
    console.log('🔄 Iniciando adição de Frete de Gado no cash flow...');

    // Buscar ou criar categoria "Frete de Gado"
    let category = await prisma.category.findFirst({
      where: { name: 'Frete de Gado' }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Frete de Gado',
          type: 'EXPENSE',
          color: '#9C27B0',
          icon: 'local_shipping',
          isActive: true
        }
      });
      console.log('✅ Categoria "Frete de Gado" criada');
    } else {
      console.log('ℹ️ Categoria "Frete de Gado" já existe');
    }

    // Criar a movimentação de Frete de Gado - Pagamento a Terceiros
    const movimentacao = {
      description: 'Frete de Gado - Pagamento a Terceiros',
      amount: 13670,
      dueDate: new Date('2024-09-28'),
      paidAt: new Date('2024-09-28')
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
          notes: 'Pagamento de frete para transporte de gado a terceiros'
        }
      });
      console.log(`✅ Movimentação criada: ${movimentacao.description} - R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    } else {
      console.log(`ℹ️ Movimentação já existe: ${movimentacao.description}`);
    }

    console.log(`\n💰 Total de Frete de Gado (Pagamento a Terceiros): R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar Frete de Gado:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
addFreteGado();
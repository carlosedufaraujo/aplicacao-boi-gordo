const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addAjustesMercadoFuturo() {
  try {
    console.log('🔄 Iniciando adição de Ajustes Mercado Futuro no cash flow...');

    // Buscar ou criar categoria "Ajustes Mercado Futuro"
    let category = await prisma.category.findFirst({
      where: { name: 'Ajustes Mercado Futuro' }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Ajustes Mercado Futuro',
          type: 'EXPENSE',
          color: '#FF9800',
          icon: 'trending_down',
          isActive: true
        }
      });
      console.log('✅ Categoria "Ajustes Mercado Futuro" criada');
    } else {
      console.log('ℹ️ Categoria "Ajustes Mercado Futuro" já existe');
    }

    // Criar a movimentação de Ajustes Mercado Futuro
    const movimentacao = {
      description: 'Ajustes Mercado Futuro - Operações de hedge',
      amount: 901770,
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
          notes: 'Ajustes de operações no mercado futuro de commodities'
        }
      });
      console.log(`✅ Movimentação criada: ${movimentacao.description} - R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    } else {
      console.log(`ℹ️ Movimentação já existe: ${movimentacao.description}`);
    }

    console.log(`\n💰 Total de Ajustes Mercado Futuro: R$ ${movimentacao.amount.toLocaleString('pt-BR')}`);
    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar Ajustes Mercado Futuro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
addAjustesMercadoFuturo();
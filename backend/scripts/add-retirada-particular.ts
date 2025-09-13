import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient({
  log: ['error', 'warn']
});

async function addRetiradaParticular() {
  try {
    console.log('🔄 Iniciando adição de Retirada Particular no cash flow...');

    // Buscar ou criar categoria "Retirada Particular"
    let category = await prisma.cashFlowCategory.findFirst({
      where: { name: 'Retirada Particular' }
    });

    if (!category) {
      category = await prisma.cashFlowCategory.create({
        data: {
          name: 'Retirada Particular',
          type: 'EXPENSE',
          color: '#FF6B6B',
          icon: 'wallet',
          isActive: true
        }
      });
      console.log('✅ Categoria "Retirada Particular" criada');
    } else {
      console.log('ℹ️ Categoria "Retirada Particular" já existe');
    }

    // Criar as 3 movimentações de Retirada Particular
    const movimentacoes = [
      {
        description: 'Retirada Particular - Pagamento a terceiros #1',
        amount: 95000,
        dueDate: new Date('2024-09-15'),
        paidAt: new Date('2024-09-15')
      },
      {
        description: 'Retirada Particular - Pagamento a terceiros #2',
        amount: 95000,
        dueDate: new Date('2024-09-20'),
        paidAt: new Date('2024-09-20')
      },
      {
        description: 'Retirada Particular - Pagamento a terceiros #3',
        amount: 180000,
        dueDate: new Date('2024-09-25'),
        paidAt: new Date('2024-09-25')
      }
    ];

    for (const mov of movimentacoes) {
      // Verificar se já existe uma movimentação similar
      const existing = await prisma.cashFlow.findFirst({
        where: {
          description: mov.description,
          amount: mov.amount
        }
      });

      if (!existing) {
        const created = await prisma.cashFlow.create({
          data: {
            type: 'EXPENSE',
            categoryId: category.id,
            description: mov.description,
            amount: mov.amount,
            dueDate: mov.dueDate,
            paidAt: mov.paidAt,
            status: 'PAID',
            paymentMethod: 'BANK_TRANSFER',
            notes: 'Retirada particular para pagamento de terceiros',
            isRecurring: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`✅ Movimentação criada: ${mov.description} - R$ ${mov.amount.toLocaleString('pt-BR')}`);
      } else {
        console.log(`ℹ️ Movimentação já existe: ${mov.description}`);
      }
    }

    // Calcular total
    const total = movimentacoes.reduce((sum, mov) => sum + mov.amount, 0);
    console.log(`\n💰 Total de Retiradas Particulares: R$ ${total.toLocaleString('pt-BR')}`);
    console.log('   - 2 pagamentos de R$ 95.000,00');
    console.log('   - 1 pagamento de R$ 180.000,00');

    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar Retirada Particular:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
addRetiradaParticular();
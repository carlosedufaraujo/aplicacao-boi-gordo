const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addQuataCapitalParcelas() {
  try {
    console.log('🔄 Iniciando adição das parcelas Quatá Capital no cash flow...');

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

    // Definir as três parcelas
    const parcelas = [
      {
        description: 'Parcela 1: Quatá Capital',
        amount: 1666665.00,
        dueDate: new Date('2025-04-06') // 06/04/2025
      },
      {
        description: 'Parcela 2: Quatá Capital',
        amount: 1666665.00,
        dueDate: new Date('2025-11-03') // 03/11/2025
      },
      {
        description: 'Parcela 3: Quatá Capital',
        amount: 1666665.00,
        dueDate: new Date('2026-09-03') // 03/09/2026
      }
    ];

    let totalCriado = 0;
    let totalExistente = 0;

    for (const parcela of parcelas) {
      // Verificar se já existe uma movimentação similar
      const existing = await prisma.cashFlow.findFirst({
        where: {
          description: parcela.description,
          amount: parcela.amount,
          dueDate: parcela.dueDate
        }
      });

      if (!existing) {
        const created = await prisma.cashFlow.create({
          data: {
            type: 'EXPENSE',
            categoryId: category.id,
            accountId: account.id,
            description: parcela.description,
            amount: parcela.amount,
            date: parcela.dueDate,
            dueDate: parcela.dueDate,
            status: 'PENDING',
            paymentMethod: 'BANK_TRANSFER',
            notes: `Parcela de financiamento Quatá Capital com vencimento em ${parcela.dueDate.toLocaleDateString('pt-BR')}`
          }
        });
        console.log(`✅ Ordem de pagamento criada: ${parcela.description}`);
        console.log(`   Valor: R$ ${parcela.amount.toLocaleString('pt-BR')}`);
        console.log(`   Vencimento: ${parcela.dueDate.toLocaleDateString('pt-BR')}`);
        console.log(`   Status: PENDENTE\n`);
        totalCriado++;
      } else {
        console.log(`ℹ️ Ordem de pagamento já existe: ${parcela.description}`);
        totalExistente++;
      }
    }

    const valorTotal = parcelas.reduce((sum, p) => sum + p.amount, 0);
    
    console.log('\n📊 RESUMO DAS PARCELAS QUATÁ CAPITAL:');
    console.log(`✅ Parcelas criadas: ${totalCriado}`);
    console.log(`ℹ️ Parcelas já existentes: ${totalExistente}`);
    console.log(`💰 Valor de cada parcela: R$ ${parcelas[0].amount.toLocaleString('pt-BR')}`);
    console.log(`💰 Valor total das 3 parcelas: R$ ${valorTotal.toLocaleString('pt-BR')}`);
    console.log('\n📅 Cronograma de vencimentos:');
    console.log('   1ª Parcela: 06/04/2025');
    console.log('   2ª Parcela: 03/11/2025');
    console.log('   3ª Parcela: 03/09/2026');
    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar parcelas Quatá Capital:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
addQuataCapitalParcelas();
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addParcelasFinanciamento() {
  try {
    console.log('🔄 Iniciando adição das parcelas de financiamento no cash flow...');

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

    // Definir as parcelas organizadas
    const parcelas = [
      { num: 1, date: '2025-07-03', amount: 90770.73 },
      { num: 2, date: '2025-08-04', amount: 90770.73 },
      { num: 3, date: '2025-09-03', amount: 90770.73 },
      { num: 4, date: '2025-10-03', amount: 90770.73 },
      { num: 5, date: '2025-11-03', amount: 91715.84 },
      { num: 6, date: '2025-12-03', amount: 60513.86 },
      { num: 7, date: '2026-01-05', amount: 62404.42 },
      { num: 8, date: '2026-02-03', amount: 59883.90 },
      { num: 9, date: '2026-03-03', amount: 59254.07 },
      { num: 10, date: '2026-04-06', amount: 63034.85 },
      { num: 11, date: '2026-05-04', amount: 29627.08 },
      { num: 12, date: '2026-06-03', amount: 30256.98 },
      { num: 13, date: '2026-07-03', amount: 30256.98 },
      { num: 14, date: '2026-08-03', amount: 30572.01 },
      { num: 15, date: '2026-09-03', amount: 30572.01 }
    ];

    let totalCriado = 0;
    let totalExistente = 0;
    let valorTotal = 0;

    for (const parcela of parcelas) {
      const description = `Parcela ${String(parcela.num).padStart(2, '0')}: Financiamento`;
      
      // Verificar se já existe uma movimentação similar
      const existing = await prisma.cashFlow.findFirst({
        where: {
          description: description,
          amount: parcela.amount,
          dueDate: new Date(parcela.date)
        }
      });

      if (!existing) {
        const created = await prisma.cashFlow.create({
          data: {
            type: 'EXPENSE',
            categoryId: category.id,
            accountId: account.id,
            description: description,
            amount: parcela.amount,
            date: new Date(parcela.date),
            dueDate: new Date(parcela.date),
            status: 'PENDING',
            paymentMethod: 'BANK_TRANSFER',
            notes: `Parcela ${parcela.num} de 15 do financiamento`
          }
        });
        console.log(`✅ Parcela ${String(parcela.num).padStart(2, '0')} criada: ${new Date(parcela.date).toLocaleDateString('pt-BR')} - R$ ${parcela.amount.toLocaleString('pt-BR')}`);
        totalCriado++;
      } else {
        console.log(`ℹ️ Parcela ${String(parcela.num).padStart(2, '0')} já existe`);
        totalExistente++;
      }
      
      valorTotal += parcela.amount;
    }

    console.log('\n📊 === RESUMO DAS PARCELAS DE FINANCIAMENTO ===');
    console.log(`✅ Parcelas criadas: ${totalCriado}`);
    console.log(`ℹ️ Parcelas já existentes: ${totalExistente}`);
    console.log(`📅 Total de parcelas: ${parcelas.length}`);
    console.log(`💰 Valor total do financiamento: R$ ${valorTotal.toLocaleString('pt-BR')}`);
    
    console.log('\n📅 CRONOGRAMA DE PAGAMENTOS:');
    console.log('2025:');
    parcelas.filter(p => p.date.startsWith('2025')).forEach(p => {
      console.log(`  Parcela ${String(p.num).padStart(2, '0')}: ${new Date(p.date).toLocaleDateString('pt-BR')} - R$ ${p.amount.toLocaleString('pt-BR')}`);
    });
    console.log('\n2026:');
    parcelas.filter(p => p.date.startsWith('2026')).forEach(p => {
      console.log(`  Parcela ${String(p.num).padStart(2, '0')}: ${new Date(p.date).toLocaleDateString('pt-BR')} - R$ ${p.amount.toLocaleString('pt-BR')}`);
    });
    
    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar parcelas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
addParcelasFinanciamento();
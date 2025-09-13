const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function fixQuataCapitalDate() {
  try {
    console.log('🔄 Corrigindo data da Parcela 1 Quatá Capital...');

    // Buscar a parcela com a data errada
    const parcelaErrada = await prisma.cashFlow.findFirst({
      where: {
        description: 'Parcela 1: Quatá Capital',
        amount: 1666665.00,
        dueDate: new Date('2025-04-06')
      }
    });

    if (parcelaErrada) {
      // Atualizar para a data correta
      const updated = await prisma.cashFlow.update({
        where: { id: parcelaErrada.id },
        data: {
          dueDate: new Date('2026-04-03'), // 03/04/2026
          date: new Date('2026-04-03'),
          notes: 'Parcela de financiamento Quatá Capital com vencimento em 03/04/2026'
        }
      });
      
      console.log('✅ Data corrigida com sucesso!');
      console.log(`   Parcela: ${updated.description}`);
      console.log(`   Data anterior: 06/04/2025`);
      console.log(`   Nova data: 03/04/2026`);
      console.log(`   Valor: R$ ${updated.amount.toLocaleString('pt-BR')}`);
    } else {
      console.log('⚠️ Parcela não encontrada com a data 06/04/2025');
      console.log('   Tentando criar nova parcela com a data correta...');
      
      // Buscar categoria Financiamento
      const category = await prisma.category.findFirst({
        where: { name: 'Financiamento' }
      });

      // Buscar conta ativa
      const account = await prisma.payerAccount.findFirst({
        where: { isActive: true }
      });

      if (category && account) {
        // Verificar se já existe com a data correta
        const existingCorrect = await prisma.cashFlow.findFirst({
          where: {
            description: 'Parcela 1: Quatá Capital',
            amount: 1666665.00,
            dueDate: new Date('2026-04-03')
          }
        });

        if (!existingCorrect) {
          const created = await prisma.cashFlow.create({
            data: {
              type: 'EXPENSE',
              categoryId: category.id,
              accountId: account.id,
              description: 'Parcela 1: Quatá Capital',
              amount: 1666665.00,
              date: new Date('2026-04-03'),
              dueDate: new Date('2026-04-03'),
              status: 'PENDING',
              paymentMethod: 'BANK_TRANSFER',
              notes: 'Parcela de financiamento Quatá Capital com vencimento em 03/04/2026'
            }
          });
          console.log('✅ Parcela criada com a data correta!');
          console.log(`   Descrição: ${created.description}`);
          console.log(`   Vencimento: 03/04/2026`);
          console.log(`   Valor: R$ ${created.amount.toLocaleString('pt-BR')}`);
        } else {
          console.log('ℹ️ Parcela já existe com a data correta (03/04/2026)');
        }
      }
    }

    console.log('\n📅 CRONOGRAMA ATUALIZADO DAS PARCELAS QUATÁ CAPITAL:');
    console.log('   1ª Parcela: 03/04/2026 ✅ (CORRIGIDO)');
    console.log('   2ª Parcela: 03/11/2025');
    console.log('   3ª Parcela: 03/09/2026');
    console.log('\n✅ Processo concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir data da parcela:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
fixQuataCapitalDate();
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function updateParcelasToEscrow() {
  try {
    console.log('🔄 Atualizando conta das parcelas para Escrow IQ Tech...');

    // Buscar a conta Escrow IQ Tech
    const escrowAccount = await prisma.payerAccount.findFirst({
      where: { 
        accountName: 'Escrow IQ Tech'
      }
    });

    if (!escrowAccount) {
      console.log('❌ Conta "Escrow IQ Tech" não encontrada!');
      console.log('Buscando contas disponíveis...');
      
      const accounts = await prisma.payerAccount.findMany();
      console.log('\nContas disponíveis:');
      accounts.forEach(acc => {
        console.log(`  - ${acc.accountName || acc.bankName || 'Sem nome'} (ID: ${acc.id})`);
      });
      return;
    }

    console.log(`✅ Conta "Escrow IQ Tech" encontrada (ID: ${escrowAccount.id})`);

    // Buscar todas as parcelas de 01 a 15
    const parcelas = [];
    for (let i = 1; i <= 15; i++) {
      const description = `Parcela ${String(i).padStart(2, '0')}: Financiamento`;
      parcelas.push(description);
    }

    // Atualizar as parcelas para a conta Escrow IQ Tech
    let updated = 0;
    let notFound = 0;

    for (const description of parcelas) {
      const result = await prisma.cashFlow.updateMany({
        where: {
          description: description
        },
        data: {
          accountId: escrowAccount.id
        }
      });

      if (result.count > 0) {
        console.log(`✅ Atualizada: ${description} → Conta: Escrow IQ Tech`);
        updated += result.count;
      } else {
        console.log(`⚠️ Não encontrada: ${description}`);
        notFound++;
      }
    }

    // Verificar o resultado
    const updatedParcelas = await prisma.cashFlow.findMany({
      where: {
        accountId: escrowAccount.id,
        description: {
          startsWith: 'Parcela'
        }
      },
      include: {
        account: true,
        category: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    console.log('\n📊 === RESUMO DA ATUALIZAÇÃO ===');
    console.log(`✅ Parcelas atualizadas: ${updated}`);
    console.log(`⚠️ Parcelas não encontradas: ${notFound}`);
    console.log(`📁 Total de parcelas na conta Escrow IQ Tech: ${updatedParcelas.length}`);
    
    if (updatedParcelas.length > 0) {
      const total = updatedParcelas.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      console.log(`💰 Valor total: R$ ${total.toLocaleString('pt-BR')}`);
      
      console.log('\n📋 Parcelas atualizadas:');
      updatedParcelas.forEach(p => {
        console.log(`  ${p.description}:`);
        console.log(`    Data: ${new Date(p.dueDate).toLocaleDateString('pt-BR')}`);
        console.log(`    Valor: R$ ${parseFloat(p.amount).toLocaleString('pt-BR')}`);
        console.log(`    Conta: ${p.account?.accountName || p.account?.bankName || 'N/A'}`);
        console.log(`    Categoria: ${p.category?.name || 'N/A'}`);
      });
    }

    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao atualizar parcelas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
updateParcelasToEscrow();
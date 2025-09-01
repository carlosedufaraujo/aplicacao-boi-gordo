const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPayerAccounts() {
  try {
    // Verificar se já existem contas pagadoras
    const existingAccounts = await prisma.payerAccount.count();
    
    if (existingAccounts > 0) {
      console.log(`✅ Já existem ${existingAccounts} contas pagadoras no banco`);
      return;
    }

    // Criar contas pagadoras
    const payerAccounts = [
      {
        bankName: 'Banco do Brasil',
        accountName: 'Conta Principal - Operações',
        agency: '3325-8',
        accountNumber: '45678-9',
        accountType: 'CHECKING',
        balance: 500000.00,
        isActive: true
      },
      {
        bankName: 'Sicredi',
        accountName: 'Conta Investimento - Reserva',
        agency: '0842',
        accountNumber: '89012-3',
        accountType: 'INVESTMENT',
        balance: 1000000.00,
        isActive: true
      }
    ];

    // Inserir contas no banco
    for (const account of payerAccounts) {
      const created = await prisma.payerAccount.create({ data: account });
      console.log(`✅ Conta ${account.accountName} criada`);
      console.log(`   💰 Banco: ${account.bankName}`);
      console.log(`   💵 Saldo inicial: R$ ${account.balance.toLocaleString('pt-BR')}`);
      console.log(`   📍 Agência: ${account.agency} | Conta: ${account.accountNumber}`);
      console.log('');
    }

    console.log('\n📊 Resumo:');
    console.log(`✅ ${payerAccounts.length} contas pagadoras criadas`);
    console.log(`💰 Saldo total: R$ ${payerAccounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString('pt-BR')}`);

  } catch (error) {
    console.error('❌ Erro ao criar contas pagadoras:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPayerAccounts();
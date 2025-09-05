const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limparTodasContas() {
  console.log('=== REMOÇÃO COMPLETA DE CONTAS PAGADORAS ===\n');
  
  try {
    // Buscar todas as contas
    const contas = await prisma.payerAccount.findMany();
    console.log(`Total de contas encontradas: ${contas.length}`);
    
    if (contas.length === 0) {
      console.log('Não há contas para remover.');
      return;
    }
    
    console.log('\nContas a serem removidas:');
    contas.forEach(conta => {
      console.log(`- ${conta.accountName} (${conta.bankName}) - ID: ${conta.id}`);
    });
    
    // Primeiro deletar cash_flows vinculados
    console.log('\n1. Removendo cash_flows vinculados...');
    const cashFlowsDeleted = await prisma.cashFlow.deleteMany({
      where: {
        accountId: {
          in: contas.map(c => c.id)
        }
      }
    });
    console.log(`   ✓ ${cashFlowsDeleted.count} cash_flows removidos`);
    
    // Remover vínculos de expenses
    console.log('\n2. Desvinculando despesas...');
    const expensesUpdated = await prisma.expense.updateMany({
      where: {
        payerAccountId: {
          in: contas.map(c => c.id)
        }
      },
      data: {
        payerAccountId: null
      }
    });
    console.log(`   ✓ ${expensesUpdated.count} despesas desvinculadas`);
    
    // Remover vínculos de revenues
    console.log('\n3. Desvinculando receitas...');
    const revenuesUpdated = await prisma.revenue.updateMany({
      where: {
        payerAccountId: {
          in: contas.map(c => c.id)
        }
      },
      data: {
        payerAccountId: null
      }
    });
    console.log(`   ✓ ${revenuesUpdated.count} receitas desvinculadas`);
    
    // Para cattle_purchases, criar conta temporária se necessário
    const comprasComConta = await prisma.cattlePurchase.count({
      where: {
        payerAccountId: {
          in: contas.map(c => c.id)
        }
      }
    });
    
    if (comprasComConta > 0) {
      console.log('\n4. Criando conta temporária para compras de gado...');
      
      // Verificar se já existe conta temporária
      let contaTemp = await prisma.payerAccount.findFirst({
        where: {
          accountName: 'CONTA TEMPORÁRIA - DELETAR'
        }
      });
      
      if (!contaTemp) {
        contaTemp = await prisma.payerAccount.create({
          data: {
            accountName: 'CONTA TEMPORÁRIA - DELETAR',
            bankName: 'TEMPORÁRIO',
            accountType: 'CHECKING',
            balance: 0,
            initialBalance: 0,
            isActive: false
          }
        });
      }
      
      console.log(`   ✓ Conta temporária: ${contaTemp.id}`);
      
      // Atualizar compras para usar conta temporária
      const comprasUpdated = await prisma.cattlePurchase.updateMany({
        where: {
          payerAccountId: {
            in: contas.filter(c => c.id !== contaTemp.id).map(c => c.id)
          }
        },
        data: {
          payerAccountId: contaTemp.id
        }
      });
      console.log(`   ✓ ${comprasUpdated.count} compras movidas para conta temporária`);
    }
    
    // Agora deletar as contas originais
    console.log('\n5. Deletando contas pagadoras...');
    const contasParaDeletar = contas.filter(c => !c.accountName.includes('TEMPORÁRIA'));
    
    let deletadas = 0;
    for (const conta of contasParaDeletar) {
      try {
        await prisma.payerAccount.delete({
          where: { id: conta.id }
        });
        console.log(`   ✓ ${conta.accountName} deletada`);
        deletadas++;
      } catch (err) {
        console.log(`   ✗ Erro ao deletar ${conta.accountName}: ${err.message}`);
      }
    }
    
    console.log(`\n✅ CONCLUÍDO! ${deletadas} contas removidas com sucesso.`);
    
    // Verificar se ficou conta temporária
    const contaTempRestante = await prisma.payerAccount.findFirst({
      where: {
        accountName: 'CONTA TEMPORÁRIA - DELETAR'
      }
    });
    
    if (contaTempRestante) {
      console.log('\n⚠️  ATENÇÃO:');
      console.log('Existe uma conta temporária no sistema.');
      console.log('1. Cadastre as contas pagadoras corretas');
      console.log('2. Atualize as compras de gado para usar a conta correta');
      console.log('3. Delete a conta temporária quando não for mais necessária');
    }
    
  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

limparTodasContas();

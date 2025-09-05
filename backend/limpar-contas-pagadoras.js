const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limparContasPagadoras() {
  console.log('=== LIMPEZA COMPLETA DE CONTAS PAGADORAS ===\n');
  
  try {
    // Verificar contas existentes
    const contas = await prisma.payerAccount.findMany();
    console.log(`Total de contas pagadoras: ${contas.length}`);
    
    if (contas.length === 0) {
      console.log('Não há contas para remover.');
      return;
    }
    
    console.log('\nContas encontradas:');
    contas.forEach(conta => {
      console.log(`- ${conta.accountName} (${conta.bankName})`);
    });
    
    // Verificar compras com conta pagadora
    const comprasComConta = await prisma.cattlePurchase.count({
      where: {
        payerAccountId: {
          in: contas.map(c => c.id)
        }
      }
    });
    
    console.log(`\nCompras de gado vinculadas: ${comprasComConta}`);
    
    if (comprasComConta > 0) {
      console.log('\n⚠️  AVISO: Existem compras vinculadas às contas.');
      console.log('As compras precisam ter uma conta pagadora obrigatoriamente.');
      console.log('Criando uma conta padrão temporária...');
      
      // Criar conta padrão temporária
      const contaPadrao = await prisma.payerAccount.create({
        data: {
          accountName: 'CONTA TEMPORÁRIA - DELETAR',
          bankName: 'TEMPORÁRIO',
          accountType: 'CHECKING',
          balance: 0,
          initialBalance: 0,
          isActive: false
        }
      });
      
      console.log('Conta temporária criada:', contaPadrao.id);
      
      // Atualizar todas as compras para usar a conta temporária
      const comprasAtualizadas = await prisma.cattlePurchase.updateMany({
        where: {
          payerAccountId: {
            in: contas.map(c => c.id)
          }
        },
        data: {
          payerAccountId: contaPadrao.id
        }
      });
      
      console.log(`${comprasAtualizadas.count} compras atualizadas para conta temporária`);
    }
    
    // Remover vínculos de expenses
    const expensesAtualizadas = await prisma.expense.updateMany({
      where: {
        payerAccountId: {
          in: contas.map(c => c.id)
        }
      },
      data: {
        payerAccountId: null
      }
    });
    console.log(`\n${expensesAtualizadas.count} despesas desvinculadas`);
    
    // Remover vínculos de revenues
    const revenuesAtualizadas = await prisma.revenue.updateMany({
      where: {
        payerAccountId: {
          in: contas.map(c => c.id)
        }
      },
      data: {
        payerAccountId: null
      }
    });
    console.log(`${revenuesAtualizadas.count} receitas desvinculadas`);
    
    // Deletar as contas originais
    const contasDeletadas = await prisma.payerAccount.deleteMany({
      where: {
        id: {
          in: contas.filter(c => !c.accountName.includes('TEMPORÁRIA')).map(c => c.id)
        }
      }
    });
    
    console.log(`\n✅ ${contasDeletadas.count} contas pagadoras removidas com sucesso!`);
    console.log('\n📌 IMPORTANTE:');
    console.log('1. Cadastre as contas pagadoras corretas manualmente');
    console.log('2. Se houver uma "CONTA TEMPORÁRIA", atualize as compras para a conta correta');
    console.log('3. Depois delete a conta temporária');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

limparContasPagadoras();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllFinancialData() {
  try {
    console.log('=== ANÁLISE COMPLETA DO SISTEMA FINANCEIRO ===\n');
    
    // 1. Verificar TODAS as despesas (incluindo as criadas via integração)
    console.log('💰 TODAS AS DESPESAS NO SISTEMA:');
    console.log('=================================');
    const allExpenses = await prisma.expense.findMany({
      include: {
        costCenter: true,
        purchase: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (allExpenses.length === 0) {
      console.log('❌ Nenhuma despesa encontrada\n');
    } else {
      console.log(`Total de despesas: ${allExpenses.length}\n`);
      
      allExpenses.forEach((exp, index) => {
        console.log(`${index + 1}. ${exp.description}`);
        console.log(`   Categoria: ${exp.category}`);
        console.log(`   Valor: R$ ${exp.totalAmount.toFixed(2)}`);
        console.log(`   Centro de Custo: ${exp.costCenter ? `[${exp.costCenter.code}] ${exp.costCenter.name}` : '❌ SEM CENTRO DE CUSTO'}`);
        console.log(`   Compra Relacionada: ${exp.purchase ? `Lote ${exp.purchase.lotNumber}` : 'Não'}`);
        console.log(`   Status: ${exp.isPaid ? '✅ Pago' : '⏳ Pendente'}`);
        console.log(`   Data: ${exp.dueDate.toLocaleDateString('pt-BR')}`);
        console.log('');
      });
    }
    
    // 2. Verificar compras de gado e suas despesas automáticas
    console.log('\n🐂 COMPRAS DE GADO E DESPESAS RELACIONADAS:');
    console.log('=============================================');
    const purchases = await prisma.cattlePurchase.findMany({
      include: {
        expenses: {
          include: {
            costCenter: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (purchases.length === 0) {
      console.log('❌ Nenhuma compra de gado encontrada\n');
    } else {
      purchases.forEach(purchase => {
        console.log(`\nLote: ${purchase.lotNumber}`);
        console.log(`Valor da Compra: R$ ${purchase.purchaseValue.toFixed(2)}`);
        console.log(`Despesas Relacionadas: ${purchase.expenses.length}`);
        
        if (purchase.expenses.length > 0) {
          purchase.expenses.forEach(exp => {
            console.log(`  • ${exp.description}: R$ ${exp.totalAmount.toFixed(2)}`);
            console.log(`    Centro: ${exp.costCenter ? `[${exp.costCenter.code}] ${exp.costCenter.name}` : 'SEM CENTRO'}`);
          });
        }
      });
    }
    
    // 3. Verificar se há centros de custo criados automaticamente para lotes
    console.log('\n\n📊 CENTROS DE CUSTO DE LOTES:');
    console.log('==============================');
    const lotCenters = await prisma.costCenter.findMany({
      where: {
        OR: [
          { code: { contains: 'LOT' } },
          { name: { contains: 'Lote' } }
        ]
      },
      include: {
        _count: {
          select: {
            expenses: true,
            revenues: true
          }
        }
      }
    });
    
    if (lotCenters.length === 0) {
      console.log('❌ Nenhum centro de custo de lote encontrado\n');
    } else {
      lotCenters.forEach(center => {
        console.log(`[${center.code}] ${center.name}`);
        console.log(`  Despesas: ${center._count.expenses}`);
        console.log(`  Receitas: ${center._count.revenues}`);
      });
    }
    
    // 4. Verificar integrações financeiras
    console.log('\n\n🔗 TABELAS DE INTEGRAÇÃO:');
    console.log('==========================');
    
    // Verificar se existem tabelas de integração
    const expenseAllocations = await prisma.expenseAllocation.count();
    const revenueAllocations = await prisma.revenueAllocation.count();
    
    console.log(`Alocações de Despesas: ${expenseAllocations}`);
    console.log(`Alocações de Receitas: ${revenueAllocations}`);
    
    // 5. Ativar centros de custo que estão inativos
    console.log('\n\n🔧 ATIVANDO CENTROS DE CUSTO:');
    console.log('==============================');
    const inactiveCenters = await prisma.costCenter.findMany({
      where: { isActive: false }
    });
    
    if (inactiveCenters.length > 0) {
      console.log(`Encontrados ${inactiveCenters.length} centros inativos. Ativando...`);
      
      await prisma.costCenter.updateMany({
        where: { isActive: false },
        data: { isActive: true }
      });
      
      console.log('✅ Todos os centros foram ativados!');
    } else {
      console.log('✅ Todos os centros já estão ativos');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllFinancialData();
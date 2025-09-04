#!/usr/bin/env node

/**
 * Script para verificar a persistência dos dados do Centro Financeiro
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFinancialPersistence() {
  console.log('🔍 Verificando persistência dos dados do Centro Financeiro\n');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar Despesas (Expenses)
    console.log('\n📊 DESPESAS (Expenses)');
    console.log('-'.repeat(40));
    
    const expenses = await prisma.expense.findMany({
      include: {
        purchase: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ Total de despesas persistidas: ${expenses.length}`);
    
    if (expenses.length > 0) {
      console.log('\n📝 Últimas 5 despesas:');
      expenses.slice(0, 5).forEach((exp, idx) => {
        console.log(`\n  ${idx + 1}. ${exp.description}`);
        console.log(`     ID: ${exp.id}`);
        console.log(`     Valor: R$ ${exp.totalAmount.toFixed(2)}`);
        console.log(`     Categoria: ${exp.category}`);
        console.log(`     Status: ${exp.isPaid ? 'Paga' : 'Pendente'}`);
        console.log(`     Impacta Caixa: ${exp.impactsCashFlow ? 'Sim' : 'Não'}`);
        console.log(`     Data: ${exp.dueDate.toLocaleDateString('pt-BR')}`);
        if (exp.purchase) {
          console.log(`     Lote associado: ${exp.purchase.lotCode}`);
        }
      });
      
      // Estatísticas por categoria
      console.log('\n📈 Despesas por categoria:');
      const categories = {};
      expenses.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + 1;
      });
      Object.entries(categories).forEach(([cat, count]) => {
        console.log(`     ${cat}: ${count} despesa(s)`);
      });
    }

    // 2. Verificar Receitas (Revenues)
    console.log('\n\n📊 RECEITAS (Revenues)');
    console.log('-'.repeat(40));
    
    const revenues = await prisma.revenue.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ Total de receitas persistidas: ${revenues.length}`);
    
    if (revenues.length > 0) {
      console.log('\n📝 Últimas 5 receitas:');
      revenues.slice(0, 5).forEach((rev, idx) => {
        console.log(`\n  ${idx + 1}. ${rev.description}`);
        console.log(`     Valor: R$ ${rev.totalAmount.toFixed(2)}`);
        console.log(`     Status: ${rev.isReceived ? 'Recebida' : 'Pendente'}`);
        console.log(`     Data: ${rev.dueDate.toLocaleDateString('pt-BR')}`);
      });
    }

    // 3. Verificar Compras de Gado (CattlePurchases)
    console.log('\n\n📊 COMPRAS DE GADO (CattlePurchases)');
    console.log('-'.repeat(40));
    
    const purchases = await prisma.cattlePurchase.findMany({
      include: {
        expenses: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ Total de compras persistidas: ${purchases.length}`);
    
    if (purchases.length > 0) {
      console.log('\n📝 Compras com integração financeira:');
      purchases.forEach((purchase, idx) => {
        console.log(`\n  ${idx + 1}. Lote: ${purchase.lotCode}`);
        console.log(`     Valor: R$ ${purchase.purchaseValue.toFixed(2)}`);
        console.log(`     Frete: R$ ${purchase.freightCost?.toFixed(2) || '0.00'}`);
        console.log(`     Comissão: R$ ${purchase.commission?.toFixed(2) || '0.00'}`);
        console.log(`     Despesas criadas: ${purchase.expenses.length}`);
        console.log(`     Status integração: ${purchase.expenses.length > 0 ? '✅ Integrado' : '⚠️ Não integrado'}`);
      });
    }

    // 4. Verificar Análise Integrada (DRE)
    console.log('\n\n📊 DRE STATEMENTS');
    console.log('-'.repeat(40));
    
    const dreStatements = await prisma.dREStatement.findMany({
      orderBy: {
        referenceMonth: 'desc'
      },
      take: 5
    });
    
    console.log(`✅ Total de DREs persistidos: ${dreStatements.length}`);
    
    if (dreStatements.length > 0) {
      console.log('\n📝 Últimos DREs:');
      dreStatements.forEach((dre, idx) => {
        console.log(`\n  ${idx + 1}. Mês: ${dre.referenceMonth.toLocaleDateString('pt-BR')}`);
        console.log(`     Receita Bruta: R$ ${dre.grossRevenue.toFixed(2)}`);
        console.log(`     Custos: R$ ${dre.totalCosts.toFixed(2)}`);
        console.log(`     Lucro Bruto: R$ ${dre.grossProfit.toFixed(2)}`);
        console.log(`     Lucro Líquido: R$ ${dre.netIncome.toFixed(2)}`);
      });
    }

    // 5. Resumo Geral
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 RESUMO DA PERSISTÊNCIA');
    console.log('='.repeat(60));
    
    const totalExpenseValue = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
    const totalRevenueValue = revenues.reduce((sum, rev) => sum + rev.totalAmount, 0);
    const paidExpenses = expenses.filter(exp => exp.isPaid).length;
    const receivedRevenues = revenues.filter(rev => rev.isReceived).length;
    
    console.log(`\n💰 Totais:`);
    console.log(`   Despesas: R$ ${totalExpenseValue.toFixed(2)} (${expenses.length} registros)`);
    console.log(`   Receitas: R$ ${totalRevenueValue.toFixed(2)} (${revenues.length} registros)`);
    console.log(`   Saldo: R$ ${(totalRevenueValue - totalExpenseValue).toFixed(2)}`);
    
    console.log(`\n📈 Status:`);
    console.log(`   Despesas pagas: ${paidExpenses}/${expenses.length}`);
    console.log(`   Receitas recebidas: ${receivedRevenues}/${revenues.length}`);
    
    console.log(`\n✅ Integração:`);
    const integratedPurchases = purchases.filter(p => p.expenses.length > 0).length;
    console.log(`   Compras integradas: ${integratedPurchases}/${purchases.length}`);
    
    // Verificar consistência
    console.log(`\n🔍 Verificação de Consistência:`);
    
    // Verificar se todas as despesas têm categoria válida
    const invalidCategories = expenses.filter(exp => !exp.category || exp.category === '');
    if (invalidCategories.length > 0) {
      console.log(`   ⚠️ ${invalidCategories.length} despesa(s) sem categoria`);
    } else {
      console.log(`   ✅ Todas as despesas têm categoria`);
    }
    
    // Verificar se há despesas órfãs (sem vínculo)
    const orphanExpenses = expenses.filter(exp => !exp.purchaseId && !exp.penId);
    if (orphanExpenses.length > 0) {
      console.log(`   ℹ️ ${orphanExpenses.length} despesa(s) sem vínculo com compra ou curral`);
    }
    
    // Verificar mortalidades registradas
    const mortalityExpenses = expenses.filter(exp => exp.category === 'deaths');
    if (mortalityExpenses.length > 0) {
      const totalMortalityLoss = mortalityExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
      console.log(`   🔴 Mortalidades: ${mortalityExpenses.length} registro(s), perda total: R$ ${totalMortalityLoss.toFixed(2)}`);
    }
    
    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro ao verificar persistência:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar verificação
checkFinancialPersistence();
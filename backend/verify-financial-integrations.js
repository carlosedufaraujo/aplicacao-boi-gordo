const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function verifyFinancialIntegrations() {
  try {
    console.log('🔍 Verificando integrações do sistema financeiro...\n');
    
    // 1. Verificar transações no Cash Flow
    console.log('📊 === CASH FLOW ===');
    const cashFlows = await prisma.cashFlow.findMany({
      include: {
        category: true,
        account: true
      },
      orderBy: { dueDate: 'asc' }
    });
    
    console.log(`Total de transações: ${cashFlows.length}`);
    
    // Agrupar por status
    const byStatus = cashFlows.reduce((acc, cf) => {
      acc[cf.status] = (acc[cf.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nPor status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Verificar transações futuras pendentes
    const futureTransactions = cashFlows.filter(cf => 
      cf.status === 'PENDING' && new Date(cf.dueDate) > new Date()
    );
    
    console.log(`\n📅 Transações futuras pendentes: ${futureTransactions.length}`);
    if (futureTransactions.length > 0) {
      console.log('Próximas 5 transações:');
      futureTransactions.slice(0, 5).forEach(t => {
        console.log(`  - ${t.description}: R$ ${t.amount.toLocaleString('pt-BR')} - ${new Date(t.dueDate).toLocaleDateString('pt-BR')}`);
      });
    }
    
    // 2. Verificar eventos no Calendário
    console.log('\n📅 === CALENDÁRIO ===');
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: { type: 'FINANCE' }
    });
    
    console.log(`Total de eventos financeiros: ${calendarEvents.length}`);
    
    // Verificar sincronização
    const eventsWithRelatedId = calendarEvents.filter(e => e.relatedId);
    console.log(`Eventos vinculados a transações: ${eventsWithRelatedId.length}`);
    
    // Verificar se todas as transações têm eventos
    const cashFlowIds = new Set(cashFlows.map(cf => cf.id));
    const eventRelatedIds = new Set(eventsWithRelatedId.map(e => e.relatedId));
    const missingEvents = [...cashFlowIds].filter(id => !eventRelatedIds.has(id));
    
    if (missingEvents.length > 0) {
      console.log(`⚠️  ${missingEvents.length} transações sem eventos no calendário`);
    } else {
      console.log('✅ Todas as transações têm eventos no calendário');
    }
    
    // 3. Verificar categorias
    console.log('\n🏷️  === CATEGORIAS ===');
    const categories = await prisma.category.findMany({
      where: { isActive: true }
    });
    
    console.log(`Total de categorias ativas: ${categories.length}`);
    
    // Categorias com transações
    const categoriesWithTransactions = new Map();
    cashFlows.forEach(cf => {
      if (cf.categoryId) {
        const cat = categories.find(c => c.id === cf.categoryId);
        if (cat) {
          const current = categoriesWithTransactions.get(cat.name) || { count: 0, total: 0 };
          categoriesWithTransactions.set(cat.name, {
            count: current.count + 1,
            total: current.total + parseFloat(cf.amount)
          });
        }
      }
    });
    
    console.log('\nCategorias mais utilizadas:');
    const sortedCategories = [...categoriesWithTransactions.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10);
    
    sortedCategories.forEach(([name, data]) => {
      console.log(`  ${name}: ${data.count} transações - R$ ${data.total.toLocaleString('pt-BR')}`);
    });
    
    // 4. Verificar contas
    console.log('\n💳 === CONTAS ===');
    const accounts = await prisma.payerAccount.findMany({
      where: { isActive: true }
    });
    
    console.log(`Total de contas ativas: ${accounts.length}`);
    accounts.forEach(acc => {
      console.log(`  ${acc.name} (${acc.type}): R$ ${parseFloat(acc.balance).toLocaleString('pt-BR')}`);
    });
    
    // 5. Resumo financeiro
    console.log('\n💰 === RESUMO FINANCEIRO ===');
    const totalReceitas = cashFlows
      .filter(cf => cf.type === 'INCOME' && cf.status === 'RECEIVED')
      .reduce((sum, cf) => sum + parseFloat(cf.amount), 0);
    
    const totalDespesasPagas = cashFlows
      .filter(cf => cf.type === 'EXPENSE' && cf.status === 'PAID')
      .reduce((sum, cf) => sum + parseFloat(cf.amount), 0);
    
    const totalDespesasPendentes = cashFlows
      .filter(cf => cf.type === 'EXPENSE' && cf.status === 'PENDING')
      .reduce((sum, cf) => sum + parseFloat(cf.amount), 0);
    
    console.log(`Receitas recebidas: R$ ${totalReceitas.toLocaleString('pt-BR')}`);
    console.log(`Despesas pagas: R$ ${totalDespesasPagas.toLocaleString('pt-BR')}`);
    console.log(`Despesas pendentes: R$ ${totalDespesasPendentes.toLocaleString('pt-BR')}`);
    console.log(`Saldo operacional: R$ ${(totalReceitas - totalDespesasPagas).toLocaleString('pt-BR')}`);
    
    // 6. Verificar integridade dos dados
    console.log('\n🔒 === INTEGRIDADE DOS DADOS ===');
    
    // Verificar transações sem categoria
    const withoutCategory = cashFlows.filter(cf => !cf.categoryId);
    console.log(`Transações sem categoria: ${withoutCategory.length}`);
    
    // Verificar transações sem conta
    const withoutAccount = cashFlows.filter(cf => !cf.accountId);
    console.log(`Transações sem conta: ${withoutAccount.length}`);
    
    // Verificar datas inconsistentes
    const inconsistentDates = cashFlows.filter(cf => 
      cf.paymentDate && new Date(cf.paymentDate) < new Date(cf.dueDate)
    );
    console.log(`Transações com datas inconsistentes: ${inconsistentDates.length}`);
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar verificação
verifyFinancialIntegrations();
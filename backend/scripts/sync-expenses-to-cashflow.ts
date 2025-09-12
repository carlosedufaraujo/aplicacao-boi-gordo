import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncExpensesToCashFlow() {
  console.log('🔄 Sincronizando despesas com CashFlow...');
  
  try {
    // 1. Verificar despesas que não têm CashFlow correspondente
    console.log('\n🔍 Verificando despesas sem CashFlow...');
    
    const expensesWithoutCashFlow = await prisma.expense.findMany({
      where: {
        impactsCashFlow: true // Todas as despesas que devem impactar o CashFlow (pagas ou não)
      }
    });
    
    console.log(`📊 Encontradas ${expensesWithoutCashFlow.length} despesas que impactam CashFlow`);
    
    let created = 0;
    let skipped = 0;
    
    for (const expense of expensesWithoutCashFlow) {
      // Verificar se já existe CashFlow para esta despesa
      const existingCashFlow = await prisma.cashFlow.findFirst({
        where: {
          OR: [
            { reference: `EXP-${expense.id}` },
            { 
              AND: [
                { description: expense.description },
                { amount: expense.totalAmount },
                { type: 'EXPENSE' }
              ]
            }
          ]
        }
      });
      
      if (existingCashFlow) {
        console.log(`⏭️ CashFlow já existe para: ${expense.description}`);
        skipped++;
        continue;
      }
      
      // Mapear categoria da despesa para categoria do CashFlow
      const categoryMapping: Record<string, string> = {
        '1': 'cat-exp-01',   // Compra de Gado
        '2': 'cat-exp-02',   // Frete de Gado
        '3': 'cat-exp-03',   // Comissão de Compra
        '4': 'cat-exp-04',   // Ração
        '5': 'cat-exp-05',   // Suplementos
        '6': 'cat-exp-06',   // Sal Mineral
        '7': 'cat-exp-07',   // Silagem
        '8': 'cat-exp-08',   // Vacinas
        '9': 'cat-exp-09',   // Medicamentos
        '10': 'cat-exp-10',  // Veterinário
        '11': 'cat-exp-11',  // Exames Laboratoriais
        '12': 'cat-exp-12',  // Manutenção de Currais
        '13': 'cat-exp-13',  // Manutenção de Cercas
        '14': 'cat-exp-14',  // Construções
        '15': 'cat-exp-15',  // Equipamentos
        '16': 'cat-exp-16',  // Combustível
        '17': 'cat-exp-17',  // Energia Elétrica
        '18': 'cat-exp-18',  // Água
        '19': 'cat-exp-19',  // Telefone/Internet
        '20': 'cat-exp-20',  // Salários
        '21': 'cat-exp-21',  // Encargos Trabalhistas
        '22': 'cat-exp-22',  // Benefícios
        '23': 'cat-exp-23',  // Treinamento
        '24': 'cat-exp-24',  // Material de Escritório
        '25': 'cat-exp-25',  // Contabilidade
        '26': 'cat-exp-26',  // Impostos e Taxas
        '27': 'cat-exp-27',  // Seguros
        '28': 'cat-exp-28',  // Despesas Bancárias
        '29': 'cat-exp-29',  // Juros e Multas
        '30': 'cat-exp-30',  // Outras Despesas
        
        // Categorias textuais antigas
        'animal_purchase': 'cat-exp-01',
        'commission': 'cat-exp-03',
        'freight': 'cat-exp-02',
        'feed': 'cat-exp-04',
        'deaths': 'cat-exp-30',
        'health_costs': 'cat-exp-08',
        'operational_costs': 'cat-exp-30'
      };
      
      const cashFlowCategoryId = categoryMapping[expense.category] || 'cat-exp-30';
      
      // Criar CashFlow para a despesa
      await prisma.cashFlow.create({
        data: {
          type: 'EXPENSE',
          categoryId: cashFlowCategoryId,
          accountId: expense.payerAccountId || 'default-account', // Usar conta padrão se não especificada
          description: expense.description,
          amount: expense.totalAmount,
          date: expense.paymentDate || expense.dueDate,
          dueDate: expense.dueDate,
          status: expense.isPaid ? 'PAID' : 'PENDING',
          paymentMethod: 'TRANSFER', // Método padrão
          reference: `EXP-${expense.id}`,
          notes: `Sincronizado automaticamente da despesa ${expense.id}`
        }
      });
      
      console.log(`✅ CashFlow criado para: ${expense.description} (${cashFlowCategoryId})`);
      created++;
    }
    
    console.log(`\n📈 Resultado da sincronização:`);
    console.log(`✅ CashFlows criados: ${created}`);
    console.log(`⏭️ CashFlows já existentes: ${skipped}`);
    console.log(`📊 Total processado: ${expensesWithoutCashFlow.length}`);
    
    // Verificar resultado
    console.log('\n🔍 Verificando resultado...');
    const cashFlowsCategory30 = await prisma.cashFlow.findMany({
      where: { categoryId: 'cat-exp-30' }
    });
    
    console.log(`💰 CashFlows com categoria cat-exp-30: ${cashFlowsCategory30.length}`);
    for (const cf of cashFlowsCategory30) {
      console.log(`   - ${cf.description}: R$ ${cf.amount.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncExpensesToCashFlow()
  .then(() => {
    console.log('\n🎉 Sincronização concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na sincronização:', error);
    process.exit(1);
  });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleData() {
  console.log('🎯 Criando dados de exemplo para análise integrada...');

  try {
    // Limpar dados existentes para setembro de 2025
    console.log('🧹 Limpando dados existentes...');
    const currentMonth = new Date('2025-09-01T00:00:00Z');
    
    await prisma.integratedAnalysisItem.deleteMany({
      where: {
        analysis: {
          referenceMonth: currentMonth
        }
      }
    });
    
    await prisma.integratedFinancialAnalysis.deleteMany({
      where: {
        referenceMonth: currentMonth
      }
    });
    
    await prisma.financialTransaction.deleteMany({
      where: {
        referenceDate: currentMonth
      }
    });
    
    console.log('✅ Dados existentes removidos');
    // 1. Verificar se existe usuário admin
    let adminUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'admin@boicontrol.com' },
          { role: 'ADMIN' },
          { isMaster: true }
        ]
      }
    });

    if (!adminUser) {
      console.log('⚠️ Criando usuário admin...');
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@boicontrol.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123 hashed
          name: 'Administrador',
          role: 'ADMIN',
          isMaster: true,
          isActive: true
        }
      });
    }
    console.log('✅ Usuário admin:', adminUser.email);

    // 2. Criar dados de transações financeiras para setembro de 2025
    const referenceDate = currentMonth;

    console.log('💰 Criando transações financeiras para setembro/2025...');

    // Receitas (vendas de gado)
    const revenues = [
      {
        description: 'Venda de lote 15 cabeças - Frigorífico JBS',
        amount: 45000.00,
        category: 'CATTLE_SALES',
        impactsCash: true,
        cashFlowType: 'OPERATING',
        cashFlowDate: new Date('2025-09-05T00:00:00Z')
      },
      {
        description: 'Venda de lote 10 cabeças - Frigorífico Marfrig',
        amount: 32000.00,
        category: 'CATTLE_SALES',
        impactsCash: true,
        cashFlowType: 'OPERATING',
        cashFlowDate: new Date('2025-09-12T00:00:00Z')
      },
      {
        description: 'Venda de lote 20 cabeças - Frigorífico Minerva',
        amount: 68000.00,
        category: 'CATTLE_SALES',
        impactsCash: true,
        cashFlowType: 'OPERATING',
        cashFlowDate: new Date('2025-09-18T00:00:00Z')
      }
    ];

    // Custos e despesas
    const expenses = [
      {
        description: 'Compra de 25 bezerros para engorda',
        amount: -35000.00,
        category: 'CATTLE_ACQUISITION',
        impactsCash: true,
        cashFlowType: 'OPERATING',
        cashFlowDate: new Date('2025-09-03T00:00:00Z')
      },
      {
        description: 'Ração e suplementos',
        amount: -8500.00,
        category: 'FEED_COSTS',
        impactsCash: true,
        cashFlowType: 'OPERATING',
        cashFlowDate: new Date('2025-09-07T00:00:00Z')
      },
      {
        description: 'Medicamentos e vacinas',
        amount: -3200.00,
        category: 'VETERINARY_COSTS',
        impactsCash: true,
        cashFlowType: 'OPERATING',
        cashFlowDate: new Date('2025-09-10T00:00:00Z')
      },
      {
        description: 'Salários e encargos dos vaqueiros',
        amount: -4800.00,
        category: 'LABOR_COSTS',
        impactsCash: true,
        cashFlowType: 'OPERATING',
        cashFlowDate: new Date('2025-09-30T00:00:00Z')
      },
      {
        description: 'Despesas administrativas',
        amount: -2500.00,
        category: 'ADMINISTRATIVE',
        impactsCash: true,
        cashFlowType: 'OPERATING',
        cashFlowDate: new Date('2025-09-25T00:00:00Z')
      }
    ];

    // Custos não-caixa (não afetam o fluxo de caixa)
    const nonCashExpenses = [
      {
        description: 'Depreciação de equipamentos',
        amount: -1500.00,
        category: 'DEPRECIATION',
        impactsCash: false,
        cashFlowType: null,
        cashFlowDate: null
      },
      {
        description: 'Mortalidade de 2 cabeças (custo médio)',
        amount: -6000.00,
        category: 'MORTALITY',
        impactsCash: false,
        cashFlowType: null,
        cashFlowDate: null,
        notes: 'Perda de 2 cabeças - Método: Custo médio ponderado (R$ 3.000,00 cada)'
      },
      {
        description: 'Ajuste de valor justo dos ativos biológicos',
        amount: 2500.00,
        category: 'BIOLOGICAL_ADJUSTMENT',
        impactsCash: false,
        cashFlowType: null,
        cashFlowDate: null
      }
    ];

    // Investimentos
    const investments = [
      {
        description: 'Reforma de cercas e porteiras',
        amount: -12000.00,
        category: 'INFRASTRUCTURE',
        impactsCash: true,
        cashFlowType: 'INVESTING',
        cashFlowDate: new Date('2025-09-20T00:00:00Z')
      },
      {
        description: 'Compra de trator usado',
        amount: -25000.00,
        category: 'EQUIPMENT',
        impactsCash: true,
        cashFlowType: 'INVESTING',
        cashFlowDate: new Date('2025-09-15T00:00:00Z')
      }
    ];

    // Criar todas as transações
    const allTransactions = [...revenues, ...expenses, ...nonCashExpenses, ...investments];

    for (const transaction of allTransactions) {
      await prisma.financialTransaction.create({
        data: {
          referenceDate: referenceDate,
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
          impactsCash: transaction.impactsCash,
          cashFlowDate: transaction.cashFlowDate,
          cashFlowType: transaction.cashFlowType,
          notes: transaction.notes || null,
          userId: adminUser.id
        }
      });
    }

    console.log(`✅ ${allTransactions.length} transações financeiras criadas`);

    // 3. Gerar análise integrada automática
    console.log('📊 Gerando análise integrada...');
    
    // Calcular totais
    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = [...expenses, ...nonCashExpenses].reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const totalCashExpenses = expenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const totalInvestments = investments.reduce((sum, i) => sum + Math.abs(i.amount), 0);
    const netIncome = totalRevenue - totalExpenses;
    const netCashFlow = totalRevenue - totalCashExpenses - totalInvestments;
    
    const analysis = await prisma.integratedFinancialAnalysis.create({
      data: {
        referenceMonth: currentMonth,
        referenceYear: 2025,
        totalRevenue: totalRevenue,
        totalExpenses: totalExpenses,
        netIncome: netIncome,
        cashReceipts: totalRevenue,
        cashPayments: totalCashExpenses + totalInvestments,
        netCashFlow: netCashFlow,
        nonCashItems: 4000, // Depreciação + Mortalidade - Ajuste biológico
        depreciation: 1500,
        biologicalAssetChange: 2500,
        reconciliationDifference: netIncome - netCashFlow,
        status: 'APPROVED',
        userId: adminUser.id
      }
    });

    console.log('✅ Análise integrada criada:', {
      id: analysis.id,
      receita: `R$ ${totalRevenue.toFixed(2)}`,
      despesas: `R$ ${totalExpenses.toFixed(2)}`,
      resultado_liquido: `R$ ${netIncome.toFixed(2)}`,
      fluxo_caixa_liquido: `R$ ${netCashFlow.toFixed(2)}`,
      diferenca_reconciliacao: `R$ ${(netIncome - netCashFlow).toFixed(2)}`
    });

    // 4. Criar itens detalhados da análise
    console.log('📋 Criando itens detalhados da análise...');

    const analysisItems = [
      {
        category: 'CATTLE_SALES',
        subcategory: 'vendas_frigorificos',
        description: 'Vendas de gado',
        amount: totalRevenue,
        impactsCash: true,
        cashFlowType: 'OPERATING'
      },
      {
        category: 'CATTLE_ACQUISITION',
        subcategory: 'compra_bezerros',
        description: 'Compra de gado',
        amount: expenses.filter(e => e.category === 'CATTLE_ACQUISITION').reduce((sum, e) => sum + Math.abs(e.amount), 0),
        impactsCash: true,
        cashFlowType: 'OPERATING'
      },
      {
        category: 'FEED_COSTS',
        subcategory: 'racao_suplementos',
        description: 'Custos com alimentação',
        amount: 8500,
        impactsCash: true,
        cashFlowType: 'OPERATING'
      },
      {
        category: 'MORTALITY',
        subcategory: 'perda_animais',
        description: 'Perdas por mortalidade',
        amount: 6000,
        impactsCash: false,
        cashFlowType: null
      },
      {
        category: 'DEPRECIATION',
        subcategory: 'equipamentos_infraestrutura',
        description: 'Depreciação',
        amount: 1500,
        impactsCash: false,
        cashFlowType: null
      }
    ];

    for (const item of analysisItems) {
      await prisma.integratedAnalysisItem.create({
        data: {
          analysisId: analysis.id,
          category: item.category,
          subcategory: item.subcategory,
          description: item.description,
          amount: item.amount,
          impactsCash: item.impactsCash,
          cashFlowType: item.cashFlowType
        }
      });
    }

    console.log(`✅ ${analysisItems.length} itens da análise criados`);

    // 5. Criar configuração padrão
    console.log('⚙️ Criando configuração padrão...');
    
    await prisma.financialAnalysisConfig.create({
      data: {
        depreciationRates: {
          equipments: 0.10, // 10% ao ano
          infrastructure: 0.04, // 4% ao ano
          vehicles: 0.20, // 20% ao ano
          buildings: 0.02 // 2% ao ano
        },
        biologicalCostMethod: 'WEIGHTED_AVERAGE',
        autoReconciliation: true,
        reconciliationTolerance: 0.01,
        fiscalYearStart: 1,
        userId: adminUser.id
      }
    });

    console.log('✅ Configuração padrão criada');

    console.log('');
    console.log('🎉 DADOS DE EXEMPLO CRIADOS COM SUCESSO!');
    console.log('');
    console.log('📊 Resumo da Análise Integrada - Setembro 2025:');
    console.log(`   • Receita Total: R$ ${totalRevenue.toFixed(2)}`);
    console.log(`   • Despesas Total: R$ ${totalExpenses.toFixed(2)}`);
    console.log(`   • Resultado Líquido (DRE): R$ ${netIncome.toFixed(2)}`);
    console.log(`   • Fluxo de Caixa Líquido: R$ ${netCashFlow.toFixed(2)}`);
    console.log(`   • Diferença de Reconciliação: R$ ${(netIncome - netCashFlow).toFixed(2)}`);
    console.log('');
    console.log('🚀 Agora você pode testar as APIs em:');
    console.log('   • POST /api/v1/integrated-analysis/generate');
    console.log('   • GET /api/v1/integrated-analysis/period/2025/9');
    console.log('   • GET /api/v1/integrated-analysis/dashboard/2025');

  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
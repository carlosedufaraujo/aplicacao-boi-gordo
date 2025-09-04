const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateDRE() {
  try {
    console.log('=== INVESTIGAÇÃO DOS DREs ===\n');
    
    // 1. Buscar todos os DREs existentes
    const allDres = await prisma.dREStatement.findMany({
      include: {
        cycle: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`1. TOTAL DE DREs NO BANCO: ${allDres.length}\n`);

    if (allDres.length > 0) {
      console.log('=== TODOS OS DREs ===');
      allDres.forEach((dre, index) => {
        console.log(`DRE ${index + 1}:`);
        console.log(`  - ID: ${dre.id}`);
        console.log(`  - Data de Referência: ${dre.referenceMonth.toISOString().split('T')[0]}`);
        console.log(`  - Ciclo ID: ${dre.cycleId || 'Sem ciclo'}`);
        console.log(`  - Status: ${dre.status}`);
        console.log(`  - Deduções: R$ ${dre.deductions.toFixed(2)}`);
        console.log(`  - Criado em: ${dre.createdAt.toISOString()}\n`);
      });
    }
    
    // 2. Buscar todos os DREs de setembro 2024
    const dres = await prisma.dREStatement.findMany({
      where: {
        referenceMonth: {
          gte: new Date('2024-09-01'),
          lt: new Date('2024-10-01')
        }
      },
      include: {
        cycle: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`2. TOTAL DE DREs PARA SETEMBRO 2024: ${dres.length}\n`);

    if (dres.length > 0) {
      console.log('=== DETALHES DOS DREs ===');
      dres.forEach((dre, index) => {
        console.log(`DRE ${index + 1}:`);
        console.log(`  - ID: ${dre.id}`);
        console.log(`  - Data de Referência: ${dre.referenceMonth.toISOString().split('T')[0]}`);
        console.log(`  - Ciclo ID: ${dre.cycleId || 'Sem ciclo'}`);
        console.log(`  - Ciclo Nome: ${dre.cycle?.name || 'N/A'}`);
        console.log(`  - Status: ${dre.status}`);
        console.log(`  - Receita Bruta: R$ ${dre.grossRevenue.toFixed(2)}`);
        console.log(`  - Deduções: R$ ${dre.deductions.toFixed(2)}`);
        console.log(`  - Receita Líquida: R$ ${dre.netRevenue.toFixed(2)}`);
        console.log(`  - Custos Totais: R$ ${dre.totalCosts.toFixed(2)}`);
        console.log(`  - Lucro Bruto: R$ ${dre.grossProfit.toFixed(2)}`);
        console.log(`  - Lucro Líquido: R$ ${dre.netProfit.toFixed(2)}`);
        console.log(`  - Criado em: ${dre.createdAt.toISOString()}`);
        console.log(`  - Atualizado em: ${dre.updatedAt.toISOString()}\n`);
      });
    }

    // 2. Verificar DREs sem cycleId
    const dresWithoutCycle = dres.filter(dre => !dre.cycleId);
    console.log(`2. DREs SEM CYCLE ID: ${dresWithoutCycle.length}\n`);

    if (dresWithoutCycle.length > 0) {
      console.log('=== DREs SEM CYCLE ID ===');
      dresWithoutCycle.forEach((dre, index) => {
        console.log(`DRE sem ciclo ${index + 1}: ${dre.id} (criado em ${dre.createdAt.toISOString()})`);
      });
      console.log();
    }

    // 3. Verificar DREs com cycleIds diferentes
    const cycleIds = [...new Set(dres.map(dre => dre.cycleId).filter(Boolean))];
    console.log(`3. CYCLE IDs DIFERENTES ENCONTRADOS: ${cycleIds.length}`);
    if (cycleIds.length > 0) {
      console.log(`   Cycle IDs: ${cycleIds.join(', ')}\n`);
    }

    // 4. Buscar dados de mortalidade para setembro 2024
    console.log('=== ANÁLISE DE MORTALIDADE ===');
    
    const mortalityRecords = await prisma.mortalityRecord.findMany({
      where: {
        deathDate: {
          gte: new Date('2024-09-01'),
          lt: new Date('2024-10-01')
        }
      },
      include: {
        cattlePurchase: {
          select: {
            lotCode: true,
            cycleId: true
          }
        }
      }
    });

    console.log(`4. REGISTROS DE MORTALIDADE EM SETEMBRO: ${mortalityRecords.length}`);
    
    if (mortalityRecords.length > 0) {
      const totalMortality = mortalityRecords.reduce((sum, record) => sum + record.quantity, 0);
      const totalLoss = mortalityRecords.reduce((sum, record) => sum + (record.estimatedLoss || 0), 0);
      
      console.log(`   Total de animais mortos: ${totalMortality}`);
      console.log(`   Perda estimada total: R$ ${totalLoss.toFixed(2)}`);
      
      mortalityRecords.forEach((record, index) => {
        console.log(`   Registro ${index + 1}:`);
        console.log(`     - Lote: ${record.cattlePurchase.lotCode}`);
        console.log(`     - Cycle ID: ${record.cattlePurchase.cycleId || 'Sem ciclo'}`);
        console.log(`     - Quantidade: ${record.quantity} animais`);
        console.log(`     - Data: ${record.deathDate.toISOString().split('T')[0]}`);
        console.log(`     - Perda estimada: R$ ${(record.estimatedLoss || 0).toFixed(2)}`);
        console.log(`     - Causa: ${record.cause}`);
      });
      console.log();
    }

    // 5. Verificar análises de mortalidade
    const mortalityAnalyses = await prisma.mortality_analyses.findMany({
      where: {
        mortality_date: {
          gte: new Date('2024-09-01'),
          lt: new Date('2024-10-01')
        }
      },
      include: {
        cattle_purchases: {
          select: {
            lotCode: true,
            cycleId: true
          }
        }
      }
    });

    console.log(`5. ANÁLISES DE MORTALIDADE EM SETEMBRO: ${mortalityAnalyses.length}`);
    
    if (mortalityAnalyses.length > 0) {
      const totalAnalyses = mortalityAnalyses.reduce((sum, analysis) => sum + analysis.quantity, 0);
      const totalLossAnalyses = mortalityAnalyses.reduce((sum, analysis) => sum + analysis.total_loss, 0);
      
      console.log(`   Total de animais nas análises: ${totalAnalyses}`);
      console.log(`   Perda total nas análises: R$ ${totalLossAnalyses.toFixed(2)}`);
    }

    // 6. Verificar ciclos existentes
    const cycles = await prisma.cycle.findMany({
      where: {
        OR: [
          {
            startDate: {
              lte: new Date('2024-09-30')
            },
            endDate: {
              gte: new Date('2024-09-01')
            }
          },
          {
            startDate: {
              lte: new Date('2024-09-30')
            },
            endDate: null
          }
        ]
      }
    });

    console.log(`\n6. CICLOS ATIVOS EM SETEMBRO 2024: ${cycles.length}`);
    cycles.forEach((cycle, index) => {
      console.log(`   Ciclo ${index + 1}:`);
      console.log(`     - ID: ${cycle.id}`);
      console.log(`     - Nome: ${cycle.name}`);
      console.log(`     - Status: ${cycle.status}`);
      console.log(`     - Início: ${cycle.startDate.toISOString().split('T')[0]}`);
      console.log(`     - Fim: ${cycle.endDate ? cycle.endDate.toISOString().split('T')[0] : 'Em aberto'}`);
    });

    // 7. Simular criação de DRE para setembro 2024
    console.log('\n=== SIMULAÇÃO DE CRIAÇÃO DE DRE ===');
    
    // Criar alguns dados de fluxo de caixa para setembro
    try {
      console.log('Criando dados de fluxo de caixa para setembro...');
      
      // Criar uma categoria financeira se não existir
      let category = await prisma.financialCategory.findFirst({
        where: { name: 'Vendas' }
      });
      
      if (!category) {
        category = await prisma.financialCategory.create({
          data: {
            name: 'Vendas',
            type: 'INCOME'
          }
        });
      }

      // Criar uma conta se não existir
      let account = await prisma.payerAccount.findFirst({
        where: { accountName: 'Conta Teste' }
      });
      
      if (!account) {
        account = await prisma.payerAccount.create({
          data: {
            bankName: 'Banco Teste',
            accountName: 'Conta Teste',
            accountType: 'CHECKING'
          }
        });
      }

      // Buscar o ciclo ativo
      const activeCycle = await prisma.cycle.findFirst({
        where: { status: 'ACTIVE' }
      });

      // Criar algumas entradas de fluxo de caixa
      const cashFlow1 = await prisma.cashFlow.create({
        data: {
          type: 'INCOME',
          categoryId: category.id,
          accountId: account.id,
          description: 'Venda de gado',
          amount: 100000,
          date: new Date('2024-09-15'),
          status: 'RECEIVED',
          cycleId: activeCycle?.id
        }
      });

      // Criar um registro de mortalidade para setembro
      console.log('Criando registro de mortalidade...');
      
      // Buscar uma compra de gado existente ou criar uma
      let purchase = await prisma.cattlePurchase.findFirst();
      
      if (!purchase) {
        // Buscar um vendedor
        let vendor = await prisma.partner.findFirst({
          where: { type: 'VENDOR' }
        });
        
        if (!vendor) {
          vendor = await prisma.partner.create({
            data: {
              name: 'Vendedor Teste',
              type: 'VENDOR'
            }
          });
        }

        purchase = await prisma.cattlePurchase.create({
          data: {
            lotCode: 'TEST-2024-09-001',
            vendorId: vendor.id,
            payerAccountId: account.id,
            purchaseDate: new Date('2024-09-01'),
            initialQuantity: 100,
            currentQuantity: 95,
            purchaseWeight: 45000,
            pricePerArroba: 180,
            purchaseValue: 50000,
            totalCost: 50000,
            cycleId: activeCycle?.id
          }
        });
      }

      // Buscar um curral ou criar um
      let pen = await prisma.pen.findFirst();
      
      if (!pen) {
        pen = await prisma.pen.create({
          data: {
            penNumber: 'PEN-001',
            capacity: 100,
            type: 'FATTENING'
          }
        });
      }

      // Criar registro de mortalidade
      await prisma.mortalityRecord.create({
        data: {
          cattlePurchaseId: purchase.id,
          penId: pen.id,
          quantity: 5,
          deathDate: new Date('2024-09-10'),
          cause: 'Doença respiratória',
          estimatedLoss: 15000
        }
      });

      console.log('Dados de teste criados com sucesso!');

    } catch (error) {
      console.error('Erro ao criar dados de teste:', error);
    }

    // 8. Testar geração de DRE a partir do fluxo de caixa
    console.log('\n=== TESTANDO GERAÇÃO DE DRE ===');
    
    try {
      // Importar o serviço DRE
      const dreServicePath = require.resolve('./src/services/dre.service.ts');
      delete require.cache[dreServicePath];
      
      // Como é TypeScript, vamos simular a lógica aqui
      const referenceMonth = new Date('2024-09-01');
      const endDate = new Date('2024-09-30');
      
      // Buscar fluxo de caixa
      const cashFlows = await prisma.cashFlow.findMany({
        where: {
          date: {
            gte: referenceMonth,
            lte: endDate,
          },
          status: {
            in: ['PAID', 'RECEIVED'],
          },
        },
        include: {
          category: true,
        },
      });

      console.log(`Fluxo de caixa encontrado: ${cashFlows.length} registros`);

      // Buscar despesas de mortalidade
      const mortalityExpenses = await prisma.expense.findMany({
        where: {
          category: 'deaths',
          dueDate: {
            gte: referenceMonth,
            lte: endDate,
          },
        },
      });

      console.log(`Despesas de mortalidade: ${mortalityExpenses.length} registros`);

      // Tentar criar DRE com ciclo
      console.log('\n--- TENTANDO CRIAR DRE COM CICLO ---');
      const activeCycle = await prisma.cycle.findFirst({
        where: { status: 'ACTIVE' }
      });

      const dreData1 = {
        referenceMonth,
        cycleId: activeCycle?.id,
        grossRevenue: 100000,
        deductions: 15000, // mortalidade
        animalCost: 50000,
        feedCost: 0,
        healthCost: 0,
        laborCost: 0,
        otherCosts: 0,
        adminExpenses: 0,
        salesExpenses: 0,
        financialExpenses: 0,
        otherExpenses: 0,
      };

      // Calcular campos derivados
      const netRevenue = dreData1.grossRevenue - dreData1.deductions;
      const totalCosts = dreData1.animalCost + dreData1.feedCost + dreData1.healthCost + dreData1.laborCost + dreData1.otherCosts;
      const grossProfit = netRevenue - totalCosts;
      const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
      const totalExpenses = dreData1.adminExpenses + dreData1.salesExpenses + dreData1.financialExpenses + dreData1.otherExpenses;
      const operationalProfit = grossProfit - totalExpenses;
      const operationalMargin = netRevenue > 0 ? (operationalProfit / netRevenue) * 100 : 0;
      const netProfit = operationalProfit;
      const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

      const dre1 = await prisma.dREStatement.create({
        data: {
          ...dreData1,
          netRevenue,
          totalCosts,
          grossProfit,
          grossMargin,
          totalExpenses,
          operationalProfit,
          operationalMargin,
          netProfit,
          netMargin,
        }
      });

      console.log(`DRE criado com sucesso - ID: ${dre1.id} (com ciclo)`);

      // Tentar criar DRE sem ciclo
      console.log('\n--- TENTANDO CRIAR DRE SEM CICLO ---');
      
      const dreData2 = {
        referenceMonth,
        cycleId: null,
        grossRevenue: 100000,
        deductions: 0, // sem mortalidade
        animalCost: 50000,
        feedCost: 0,
        healthCost: 0,
        laborCost: 0,
        otherCosts: 0,
        adminExpenses: 0,
        salesExpenses: 0,
        financialExpenses: 0,
        otherExpenses: 0,
      };

      const netRevenue2 = dreData2.grossRevenue - dreData2.deductions;
      const totalCosts2 = dreData2.animalCost + dreData2.feedCost + dreData2.healthCost + dreData2.laborCost + dreData2.otherCosts;
      const grossProfit2 = netRevenue2 - totalCosts2;
      const grossMargin2 = netRevenue2 > 0 ? (grossProfit2 / netRevenue2) * 100 : 0;
      const totalExpenses2 = dreData2.adminExpenses + dreData2.salesExpenses + dreData2.financialExpenses + dreData2.otherExpenses;
      const operationalProfit2 = grossProfit2 - totalExpenses2;
      const operationalMargin2 = netRevenue2 > 0 ? (operationalProfit2 / netRevenue2) * 100 : 0;
      const netProfit2 = operationalProfit2;
      const netMargin2 = netRevenue2 > 0 ? (netProfit2 / netRevenue2) * 100 : 0;

      const dre2 = await prisma.dREStatement.create({
        data: {
          ...dreData2,
          netRevenue: netRevenue2,
          totalCosts: totalCosts2,
          grossProfit: grossProfit2,
          grossMargin: grossMargin2,
          totalExpenses: totalExpenses2,
          operationalProfit: operationalProfit2,
          operationalMargin: operationalMargin2,
          netProfit: netProfit2,
          netMargin: netMargin2,
        }
      });

      console.log(`DRE criado com sucesso - ID: ${dre2.id} (sem ciclo)`);

      // Verificar problema de unique constraint
      console.log('\n--- VERIFICANDO CONSTRAINT UNIQUE ---');
      
      // A constraint é: @@unique([referenceMonth, cycleId])
      // Isso significa que não pode haver dois DREs com o mesmo mês e mesmo ciclo
      // MAS pode haver um DRE com ciclo e outro sem ciclo para o mesmo mês
      
      console.log('Constraint unique permite:');
      console.log('- Um DRE com cycleId = "abc" para setembro');
      console.log('- Um DRE com cycleId = null para setembro');
      console.log('- Mas NÃO dois DREs com cycleId = "abc" para setembro');

    } catch (error) {
      console.error('Erro ao testar geração de DRE:', error);
      if (error.code === 'P2002') {
        console.log('ERRO DE CONSTRAINT UNIQUE detectado!');
        console.log('Detalhes:', error.meta);
      }
    }

    // 9. Verificar DREs criados agora
    console.log('\n=== DREs APÓS OS TESTES ===');
    const finalDres = await prisma.dREStatement.findMany({
      where: {
        referenceMonth: {
          gte: new Date('2024-09-01'),
          lt: new Date('2024-10-01')
        }
      },
      include: {
        cycle: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Total de DREs para setembro após teste: ${finalDres.length}`);
    finalDres.forEach((dre, index) => {
      console.log(`DRE ${index + 1}:`);
      console.log(`  - ID: ${dre.id}`);
      console.log(`  - Ciclo ID: ${dre.cycleId || 'SEM CICLO'}`);
      console.log(`  - Ciclo Nome: ${dre.cycle?.name || 'N/A'}`);
      console.log(`  - Deduções: R$ ${dre.deductions.toFixed(2)}`);
      console.log(`  - Status: ${dre.status}`);
      console.log(`  - Criado em: ${dre.createdAt.toISOString()}`);
    });

  } catch (error) {
    console.error('Erro na investigação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateDRE();
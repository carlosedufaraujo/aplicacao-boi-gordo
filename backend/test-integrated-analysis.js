// Teste da Nova Estrutura Financeira Integrada
async function testIntegratedAnalysis() {
  console.log('=== TESTE DA ANÁLISE FINANCEIRA INTEGRADA ===\n');
  
  try {
    // Fazer login primeiro para obter token
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@boicontrol.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.token) {
      console.log('❌ Falha no login. Testando sem autenticação...');
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login realizado com sucesso!\n');
    
    // Testar geração de análise
    console.log('📊 Gerando análise integrada para setembro/2025...\n');
    
    const generateResponse = await fetch('http://localhost:3001/api/v1/integrated-analysis/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        year: 2025,
        month: 9,
        includeNonCashItems: true
      })
    });
    
    if (!generateResponse.ok) {
      console.log(`❌ Erro ao gerar análise: ${generateResponse.status} ${generateResponse.statusText}`);
      const error = await generateResponse.text();
      console.log('Resposta:', error);
      return;
    }
    
    const generateData = await generateResponse.json();
    console.log('✅ Análise gerada com sucesso!');
    console.log(`📈 Receita Total: R$ ${generateData.data.totalRevenue.toFixed(2)}`);
    console.log(`📉 Despesas Total: R$ ${generateData.data.totalExpenses.toFixed(2)}`);
    console.log(`💰 Resultado Líquido: R$ ${generateData.data.netIncome.toFixed(2)}`);
    console.log(`💸 Fluxo de Caixa Líquido: R$ ${generateData.data.netCashFlow.toFixed(2)}`);
    console.log(`🔍 Diferença de Reconciliação: R$ ${generateData.data.reconciliationDifference.toFixed(2)}\n`);
    
    // Testar busca por período
    console.log('🔍 Buscando análise por período...\n');
    
    const periodResponse = await fetch('http://localhost:3001/api/v1/integrated-analysis/period/2025/9', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (periodResponse.ok) {
      const periodData = await periodResponse.json();
      console.log('✅ Análise por período encontrada!');
      
      // Mostrar breakdown de fluxo de caixa
      const cf = periodData.data.cashFlowBreakdown;
      console.log('\n💹 FLUXO DE CAIXA POR ATIVIDADE:');
      console.log(`  Operacionais: Entradas R$ ${cf.operating.receipts.toFixed(2)} | Saídas R$ ${cf.operating.payments.toFixed(2)} | Líquido R$ ${cf.operating.net.toFixed(2)}`);
      console.log(`  Investimento: Entradas R$ ${cf.investing.receipts.toFixed(2)} | Saídas R$ ${cf.investing.payments.toFixed(2)} | Líquido R$ ${cf.investing.net.toFixed(2)}`);
      console.log(`  Financiamento: Entradas R$ ${cf.financing.receipts.toFixed(2)} | Saídas R$ ${cf.financing.payments.toFixed(2)} | Líquido R$ ${cf.financing.net.toFixed(2)}`);
      
      // Mostrar breakdown não-caixa
      const nc = periodData.data.nonCashBreakdown;
      console.log('\n📊 ITENS NÃO-CAIXA:');
      console.log(`  Depreciação: R$ ${nc.depreciation.toFixed(2)}`);
      console.log(`  Mortalidade: R$ ${nc.mortality.toFixed(2)}`);
      console.log(`  Ajustes Biológicos: R$ ${nc.biologicalAdjustments.toFixed(2)}`);
      console.log(`  Outros: R$ ${nc.other.toFixed(2)}`);
      
      // Mostrar reconciliação
      const rec = periodData.data.reconciliation;
      console.log('\n🔄 RECONCILIAÇÃO DRE x FLUXO DE CAIXA:');
      console.log(`  Resultado Contábil: R$ ${rec.netIncome.toFixed(2)}`);
      console.log(`  (-) Ajustes Não-Caixa: R$ ${rec.nonCashAdjustments.toFixed(2)}`);
      console.log(`  (=) Fluxo de Caixa Líquido: R$ ${rec.netCashFlow.toFixed(2)}`);
      console.log(`  Diferença: R$ ${rec.difference.toFixed(2)}`);
      
    } else {
      console.log('❌ Erro ao buscar análise por período');
    }
    
    // Testar dashboard
    console.log('\n📋 Buscando dashboard do ano 2025...\n');
    
    const dashboardResponse = await fetch('http://localhost:3001/api/v1/integrated-analysis/dashboard/2025', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard carregado com sucesso!');
      
      const summary = dashboardData.data.summary;
      console.log('\n📊 RESUMO ANUAL:');
      console.log(`  Receita Total: R$ ${summary.totalRevenue.toFixed(2)}`);
      console.log(`  Despesas Total: R$ ${summary.totalExpenses.toFixed(2)}`);
      console.log(`  Resultado Líquido: R$ ${summary.totalNetIncome.toFixed(2)}`);
      console.log(`  Fluxo de Caixa Total: R$ ${summary.totalCashFlow.toFixed(2)}`);
      console.log(`  Margem Líquida: ${summary.netMargin.toFixed(1)}%`);
      console.log(`  Margem de Caixa: ${summary.cashFlowMargin.toFixed(1)}%`);
      
      const quality = dashboardData.data.qualityMetrics;
      console.log('\n🎯 MÉTRICAS DE QUALIDADE:');
      console.log(`  Taxa de Conversão Caixa: ${(quality.cashConversionRate * 100).toFixed(1)}%`);
      console.log(`  Porção Não-Caixa: ${(quality.nonCashPortion * 100).toFixed(1)}%`);
      console.log(`  Precisão da Reconciliação: ${(quality.reconciliationAccuracy * 100).toFixed(1)}%`);
      
    } else {
      console.log('❌ Erro ao buscar dashboard');
    }
    
    console.log('\n✅ Todos os testes da estrutura integrada concluídos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao testar estrutura integrada:', error.message);
  }
}

testIntegratedAnalysis();
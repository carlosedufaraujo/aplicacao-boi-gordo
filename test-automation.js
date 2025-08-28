#!/usr/bin/env node

/**
 * 🧪 TESTE AUTOMATIZADO COMPLETO - SISTEMA MIGRADO
 * Testa todas as funcionalidades rapidamente
 */

import puppeteer from 'puppeteer';

const FRONTEND_URL = 'http://localhost:5174';
const TESTS = [];

// Função para adicionar resultado de teste
function addTest(name, success, error = null, data = null) {
  TESTS.push({
    name,
    success,
    error: error?.message || error,
    data,
    timestamp: new Date().toISOString()
  });
}

// Função para aguardar elemento
async function waitForSelector(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

// Função para verificar erros no console
function setupConsoleListener(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

async function runTests() {
  console.log('🚀 Iniciando testes automatizados...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  const consoleErrors = setupConsoleListener(page);

  try {
    // ========================================
    // TESTE 1: CARREGAMENTO INICIAL
    // ========================================
    console.log('📱 Teste 1: Carregamento inicial...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2', timeout: 10000 });
    
    const title = await page.title();
    addTest('Carregamento inicial', title.includes('BoviControl') || title.length > 0, null, { title });
    
    // ========================================
    // TESTE 2: DASHBOARD
    // ========================================
    console.log('📊 Teste 2: Dashboard...');
    const dashboardExists = await waitForSelector(page, '[data-testid="dashboard"], .dashboard, h1, .page-title');
    addTest('Dashboard carregou', dashboardExists);
    
    // Verificar se há gráficos
    const chartsExist = await page.$$eval('canvas, svg, .recharts-wrapper', els => els.length > 0).catch(() => false);
    addTest('Gráficos presentes', chartsExist);
    
    // ========================================
    // TESTE 3: NAVEGAÇÃO - COMPRAS
    // ========================================
    console.log('🛒 Teste 3: Pipeline de Compras...');
    try {
      // Tentar clicar em link de compras
      const comprasLink = await page.$('a[href*="compras"], a[href*="pipeline"], a[href*="purchase"]');
      if (comprasLink) {
        await comprasLink.click();
        await page.waitForTimeout(2000);
        
        const comprasLoaded = await waitForSelector(page, '.pipeline, .purchase, .kanban, .card');
        addTest('Pipeline Compras acessível', comprasLoaded);
      } else {
        addTest('Pipeline Compras acessível', false, 'Link não encontrado');
      }
    } catch (error) {
      addTest('Pipeline Compras acessível', false, error);
    }
    
    // ========================================
    // TESTE 4: NAVEGAÇÃO - VENDAS
    // ========================================
    console.log('💰 Teste 4: Pipeline de Vendas...');
    try {
      const vendasLink = await page.$('a[href*="vendas"], a[href*="sales"]');
      if (vendasLink) {
        await vendasLink.click();
        await page.waitForTimeout(2000);
        
        const vendasLoaded = await waitForSelector(page, '.sales, .pipeline, .kanban, .card');
        addTest('Pipeline Vendas acessível', vendasLoaded);
      } else {
        addTest('Pipeline Vendas acessível', false, 'Link não encontrado');
      }
    } catch (error) {
      addTest('Pipeline Vendas acessível', false, error);
    }
    
    // ========================================
    // TESTE 5: NAVEGAÇÃO - CADASTROS
    // ========================================
    console.log('📋 Teste 5: Cadastros...');
    try {
      const cadastrosLink = await page.$('a[href*="cadastros"], a[href*="registrations"]');
      if (cadastrosLink) {
        await cadastrosLink.click();
        await page.waitForTimeout(2000);
        
        const cadastrosLoaded = await waitForSelector(page, '.registrations, .cadastros, .card, .tab');
        addTest('Cadastros acessível', cadastrosLoaded);
      } else {
        addTest('Cadastros acessível', false, 'Link não encontrado');
      }
    } catch (error) {
      addTest('Cadastros acessível', false, error);
    }
    
    // ========================================
    // TESTE 6: NAVEGAÇÃO - DRE
    // ========================================
    console.log('📈 Teste 6: DRE...');
    try {
      const dreLink = await page.$('a[href*="dre"], a[href*="financial"]');
      if (dreLink) {
        await dreLink.click();
        await page.waitForTimeout(2000);
        
        const dreLoaded = await waitForSelector(page, '.dre, .financial, .chart, .table');
        addTest('DRE acessível', dreLoaded);
      } else {
        addTest('DRE acessível', false, 'Link não encontrado');
      }
    } catch (error) {
      addTest('DRE acessível', false, error);
    }
    
    // ========================================
    // TESTE 7: ERROS DE CONSOLE
    // ========================================
    console.log('🔍 Teste 7: Erros de Console...');
    await page.waitForTimeout(3000); // Aguardar mais erros aparecerem
    
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Error') || 
      error.includes('TypeError') || 
      error.includes('ReferenceError') ||
      error.includes('Failed to fetch')
    );
    
    addTest('Console sem erros críticos', criticalErrors.length === 0, null, { 
      totalErrors: consoleErrors.length,
      criticalErrors: criticalErrors.length,
      errors: criticalErrors.slice(0, 5) // Primeiros 5 erros
    });
    
    // ========================================
    // TESTE 8: ELEMENTOS ESSENCIAIS
    // ========================================
    console.log('🎯 Teste 8: Elementos essenciais...');
    
    // Verificar se há botões
    const buttonsCount = await page.$$eval('button', buttons => buttons.length);
    addTest('Botões presentes', buttonsCount > 0, null, { count: buttonsCount });
    
    // Verificar se há cards
    const cardsCount = await page.$$eval('.card, [class*="card"]', cards => cards.length);
    addTest('Cards presentes', cardsCount > 0, null, { count: cardsCount });
    
    // Verificar se há navegação
    const navExists = await waitForSelector(page, 'nav, .nav, .sidebar, .menu');
    addTest('Navegação presente', navExists);
    
  } catch (error) {
    addTest('Teste geral', false, error);
  } finally {
    await browser.close();
  }
  
  // ========================================
  // RELATÓRIO FINAL
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE TESTES - SISTEMA MIGRADO');
  console.log('='.repeat(60));
  
  const successCount = TESTS.filter(t => t.success).length;
  const totalCount = TESTS.length;
  const successRate = ((successCount / totalCount) * 100).toFixed(1);
  
  console.log(`\n✅ Sucessos: ${successCount}/${totalCount} (${successRate}%)`);
  console.log(`❌ Falhas: ${totalCount - successCount}/${totalCount}\n`);
  
  TESTS.forEach((test, index) => {
    const icon = test.success ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${test.name}`);
    
    if (!test.success && test.error) {
      console.log(`   ⚠️  ${test.error}`);
    }
    
    if (test.data) {
      console.log(`   📊 ${JSON.stringify(test.data)}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (successRate >= 80) {
    console.log('🎉 SISTEMA FUNCIONANDO BEM! (>80% sucesso)');
  } else if (successRate >= 60) {
    console.log('⚠️  SISTEMA COM PROBLEMAS MENORES (60-80% sucesso)');
  } else {
    console.log('🚨 SISTEMA COM PROBLEMAS CRÍTICOS (<60% sucesso)');
  }
  
  console.log('='.repeat(60));
}

// Executar testes
runTests().catch(console.error);

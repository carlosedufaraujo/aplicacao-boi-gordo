#!/usr/bin/env node

/**
 * 🧪 TESTE INTELIGENTE - SISTEMA MIGRADO
 * Testa navegação por botões (não links)
 */

import puppeteer from 'puppeteer';

const FRONTEND_URL = 'http://localhost:5174';
const TESTS = [];

function addTest(name, success, error = null, data = null) {
  TESTS.push({ name, success, error: error?.message || error, data, timestamp: new Date().toISOString() });
}

async function runSmartTests() {
  console.log('🧠 Iniciando testes inteligentes...\n');
  
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1280, height: 720 } });
  const page = await browser.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    // TESTE 1: Carregamento
    console.log('📱 Teste 1: Carregamento...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2', timeout: 15000 });
    const title = await page.title();
    addTest('Sistema carrega', title.includes('BoviControl'), null, { title });
    
    // Aguardar sidebar carregar
    await page.waitForTimeout(3000);
    
    // TESTE 2: Sidebar existe
    console.log('🔧 Teste 2: Sidebar...');
    const sidebarExists = await page.$('.sidebar, [data-sidebar], nav') !== null;
    addTest('Sidebar presente', sidebarExists);
    
    // TESTE 3: Botões de navegação
    console.log('🎯 Teste 3: Botões de navegação...');
    const navButtons = await page.$$('button[role="menuitem"], button:has-text("Compras"), button:has-text("Vendas"), button:has-text("Cadastros"), button:has-text("DRE")');
    addTest('Botões navegação encontrados', navButtons.length > 0, null, { count: navButtons.length });
    
    // TESTE 4: Testar clique em Compras
    console.log('🛒 Teste 4: Navegação Compras...');
    try {
      const comprasBtn = await page.$('button:has-text("Compras")') || await page.$('*:has-text("Compras")');
      if (comprasBtn) {
        await comprasBtn.click();
        await page.waitForTimeout(2000);
        
        // Verificar se mudou de página
        const pipelineContent = await page.$('.pipeline, .purchase, .kanban, h1:has-text("Compras"), h1:has-text("Pipeline")') !== null;
        addTest('Navegação Compras funciona', pipelineContent);
      } else {
        addTest('Navegação Compras funciona', false, 'Botão não encontrado');
      }
    } catch (error) {
      addTest('Navegação Compras funciona', false, error);
    }
    
    // TESTE 5: Testar clique em Vendas
    console.log('💰 Teste 5: Navegação Vendas...');
    try {
      const vendasBtn = await page.$('button:has-text("Vendas")') || await page.$('*:has-text("Vendas")');
      if (vendasBtn) {
        await vendasBtn.click();
        await page.waitForTimeout(2000);
        
        const salesContent = await page.$('.sales, .pipeline, h1:has-text("Vendas"), h1:has-text("Sales")') !== null;
        addTest('Navegação Vendas funciona', salesContent);
      } else {
        addTest('Navegação Vendas funciona', false, 'Botão não encontrado');
      }
    } catch (error) {
      addTest('Navegação Vendas funciona', false, error);
    }
    
    // TESTE 6: Testar clique em Cadastros
    console.log('📋 Teste 6: Navegação Cadastros...');
    try {
      const cadastrosBtn = await page.$('button:has-text("Cadastros")') || await page.$('*:has-text("Cadastros")');
      if (cadastrosBtn) {
        await cadastrosBtn.click();
        await page.waitForTimeout(2000);
        
        const registrationsContent = await page.$('.registrations, .cadastros, h1:has-text("Cadastros")') !== null;
        addTest('Navegação Cadastros funciona', registrationsContent);
      } else {
        addTest('Navegação Cadastros funciona', false, 'Botão não encontrado');
      }
    } catch (error) {
      addTest('Navegação Cadastros funciona', false, error);
    }
    
    // TESTE 7: Voltar ao Dashboard
    console.log('📊 Teste 7: Voltar Dashboard...');
    try {
      const dashboardBtn = await page.$('button:has-text("Dashboard")') || await page.$('*:has-text("Dashboard")');
      if (dashboardBtn) {
        await dashboardBtn.click();
        await page.waitForTimeout(2000);
        
        const dashboardContent = await page.$('.dashboard, h1:has-text("Dashboard"), canvas, svg') !== null;
        addTest('Volta ao Dashboard funciona', dashboardContent);
      } else {
        addTest('Volta ao Dashboard funciona', false, 'Botão não encontrado');
      }
    } catch (error) {
      addTest('Volta ao Dashboard funciona', false, error);
    }
    
    // TESTE 8: Verificar erros críticos
    console.log('🔍 Teste 8: Erros críticos...');
    await page.waitForTimeout(2000);
    
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('TypeError') || 
      error.includes('ReferenceError') ||
      error.includes('Failed to fetch') ||
      error.includes('Network Error')
    );
    
    addTest('Sem erros críticos', criticalErrors.length === 0, null, { 
      totalErrors: consoleErrors.length,
      criticalErrors: criticalErrors.length,
      errors: criticalErrors.slice(0, 3)
    });
    
  } catch (error) {
    addTest('Teste geral', false, error);
  } finally {
    await browser.close();
  }
  
  // RELATÓRIO
  console.log('\n' + '='.repeat(60));
  console.log('🧠 RELATÓRIO INTELIGENTE - SISTEMA MIGRADO');
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
    console.log('🎉 SISTEMA FUNCIONANDO MUITO BEM! (>80% sucesso)');
    console.log('✅ Migração API-First foi um SUCESSO!');
  } else if (successRate >= 60) {
    console.log('⚠️  SISTEMA FUNCIONANDO COM PROBLEMAS MENORES (60-80% sucesso)');
    console.log('🔧 Alguns ajustes necessários, mas migração OK!');
  } else {
    console.log('🚨 SISTEMA COM PROBLEMAS CRÍTICOS (<60% sucesso)');
    console.log('🛠️  Migração precisa de correções importantes!');
  }
  
  console.log('='.repeat(60));
}

runSmartTests().catch(console.error);

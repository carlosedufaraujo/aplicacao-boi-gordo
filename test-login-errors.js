#!/usr/bin/env node

/**
 * 🔍 ANÁLISE DE ERROS DE CONSOLE - LOGIN
 * Captura todos os erros desde o carregamento inicial
 */

import puppeteer from 'puppeteer';

const FRONTEND_URL = 'http://localhost:5174';
const EMAIL = 'carlosedufaraujo@outlook.com';
const PASSWORD = '368308450';

async function analyzeLoginErrors() {
  console.log('🔍 Iniciando análise de erros de console...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1280, height: 720 },
    devtools: true // Abrir DevTools automaticamente
  });
  
  const page = await browser.newPage();
  
  // Arrays para capturar diferentes tipos de logs
  const consoleErrors = [];
  const consoleWarnings = [];
  const networkErrors = [];
  const allLogs = [];
  
  // Capturar TODOS os logs de console
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    
    allLogs.push(logEntry);
    
    if (msg.type() === 'error') {
      consoleErrors.push(logEntry);
      console.log(`❌ ERRO: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(logEntry);
      console.log(`⚠️  WARNING: ${msg.text()}`);
    } else if (msg.type() === 'log' && msg.text().includes('Error')) {
      consoleErrors.push(logEntry);
      console.log(`🔴 LOG ERROR: ${msg.text()}`);
    }
  });
  
  // Capturar erros de rede
  page.on('requestfailed', request => {
    const errorEntry = {
      url: request.url(),
      error: request.failure().errorText,
      timestamp: new Date().toISOString()
    };
    networkErrors.push(errorEntry);
    console.log(`🌐 NETWORK ERROR: ${request.url()} - ${request.failure().errorText}`);
  });
  
  // Capturar responses com erro
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`🔴 HTTP ERROR: ${response.status()} - ${response.url()}`);
    }
  });

  try {
    console.log('📱 Navegando para a página inicial...');
    await page.goto(FRONTEND_URL, { 
      waitUntil: 'networkidle2', 
      timeout: 20000 
    });
    
    // Aguardar um pouco para capturar erros iniciais
    console.log('⏳ Aguardando erros iniciais...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔐 Procurando campos de login...');
    
    // Tentar encontrar campos de login
    const emailField = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordField = await page.$('input[type="password"], input[name="password"]');
    
    if (emailField && passwordField) {
      console.log('✅ Campos de login encontrados, fazendo login...');
      
      await emailField.type(EMAIL);
      await passwordField.type(PASSWORD);
      
      // Procurar botão de login
      const loginButton = await page.$('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');
      if (loginButton) {
        await loginButton.click();
        console.log('🔐 Clique no botão de login executado');
        
        // Aguardar após login
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } else {
      console.log('❌ Campos de login não encontrados - pode já estar logado');
    }
    
    // Aguardar mais um pouco para capturar todos os erros
    console.log('⏳ Aguardando mais erros...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.log(`❌ ERRO NO TESTE: ${error.message}`);
  }
  
  // RELATÓRIO DETALHADO
  console.log('\n' + '='.repeat(80));
  console.log('🔍 RELATÓRIO DETALHADO DE ERROS - SISTEMA BOVICONTROL');
  console.log('='.repeat(80));
  
  console.log(`\n📊 RESUMO:`);
  console.log(`   Erros de Console: ${consoleErrors.length}`);
  console.log(`   Warnings: ${consoleWarnings.length}`);
  console.log(`   Erros de Rede: ${networkErrors.length}`);
  console.log(`   Total de Logs: ${allLogs.length}`);
  
  if (consoleErrors.length > 0) {
    console.log(`\n❌ ERROS DE CONSOLE (${consoleErrors.length}):`);
    consoleErrors.forEach((error, index) => {
      console.log(`\n${index + 1}. [${error.timestamp}]`);
      console.log(`   ${error.text}`);
    });
  }
  
  if (consoleWarnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${consoleWarnings.length}):`);
    consoleWarnings.forEach((warning, index) => {
      console.log(`\n${index + 1}. [${warning.timestamp}]`);
      console.log(`   ${warning.text}`);
    });
  }
  
  if (networkErrors.length > 0) {
    console.log(`\n🌐 ERROS DE REDE (${networkErrors.length}):`);
    networkErrors.forEach((error, index) => {
      console.log(`\n${index + 1}. [${error.timestamp}]`);
      console.log(`   URL: ${error.url}`);
      console.log(`   Erro: ${error.error}`);
    });
  }
  
  console.log(`\n📋 TODOS OS LOGS (primeiros 20):`);
  allLogs.slice(0, 20).forEach((log, index) => {
    const icon = log.type === 'error' ? '❌' : log.type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${log.type.toUpperCase()}] ${log.text}`);
  });
  
  console.log('\n' + '='.repeat(80));
  
  if (consoleErrors.length === 0) {
    console.log('🎉 NENHUM ERRO CRÍTICO ENCONTRADO! Sistema funcionando bem!');
  } else if (consoleErrors.length <= 3) {
    console.log('⚠️  POUCOS ERROS ENCONTRADOS. Sistema funcionando com pequenos problemas.');
  } else {
    console.log('🚨 MUITOS ERROS ENCONTRADOS. Sistema precisa de correções!');
  }
  
  console.log('\n🔧 MANTENHA O NAVEGADOR ABERTO PARA INVESTIGAÇÃO MANUAL...');
  console.log('   - Pressione F12 para ver Console');
  console.log('   - Navegue pelo sistema para mais testes');
  console.log('   - Pressione Ctrl+C aqui quando terminar');
  
  // Manter navegador aberto para investigação manual
  await new Promise(resolve => {
    process.on('SIGINT', () => {
      console.log('\n👋 Fechando navegador...');
      browser.close().then(resolve);
    });
  });
}

analyzeLoginErrors().catch(console.error);

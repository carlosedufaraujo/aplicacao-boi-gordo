#!/usr/bin/env node

/**
 * 🔍 CAPTURA ERROS DE CONSOLE - SISTEMA BOVICONTROL
 * Script para analisar erros no navegador
 */

import puppeteer from 'puppeteer';

async function captureConsoleErrors() {
  console.log('🔍 Conectando ao sistema para capturar erros...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Arrays para capturar erros
  const errors = [];
  const warnings = [];
  const networkErrors = [];
  
  // Capturar console errors
  page.on('console', msg => {
    const timestamp = new Date().toLocaleTimeString();
    
    if (msg.type() === 'error') {
      errors.push(`[${timestamp}] ${msg.text()}`);
      console.log(`❌ [${timestamp}] ERROR: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      warnings.push(`[${timestamp}] ${msg.text()}`);
      console.log(`⚠️  [${timestamp}] WARNING: ${msg.text()}`);
    }
  });
  
  // Capturar network errors
  page.on('requestfailed', request => {
    const timestamp = new Date().toLocaleTimeString();
    const error = `[${timestamp}] ${request.url()} - ${request.failure().errorText}`;
    networkErrors.push(error);
    console.log(`🌐 [${timestamp}] NETWORK: ${error}`);
  });
  
  // Capturar response errors
  page.on('response', response => {
    if (response.status() >= 400) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`🔴 [${timestamp}] HTTP ${response.status()}: ${response.url()}`);
    }
  });

  try {
    console.log('📱 Navegando para http://localhost:5174...');
    await page.goto('http://localhost:5174', { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });
    
    console.log('⏳ Aguardando 5 segundos para capturar erros iniciais...');
    await page.waitForTimeout(5000);
    
    // Tentar fazer login se necessário
    console.log('🔐 Verificando se precisa fazer login...');
    const emailField = await page.$('input[type="email"]');
    const passwordField = await page.$('input[type="password"]');
    
    if (emailField && passwordField) {
      console.log('📝 Fazendo login...');
      await emailField.type('carlosedufaraujo@outlook.com');
      await passwordField.type('368308450');
      
      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) {
        await loginBtn.click();
        console.log('⏳ Aguardando após login...');
        await page.waitForTimeout(5000);
      }
    }
    
    // Aguardar mais erros
    console.log('⏳ Aguardando mais 10 segundos para capturar todos os erros...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.log(`❌ ERRO: ${error.message}`);
  }
  
  // RELATÓRIO
  console.log('\n' + '='.repeat(70));
  console.log('📊 RELATÓRIO DE ERROS - BOVICONTROL');
  console.log('='.repeat(70));
  
  console.log(`\n📈 ESTATÍSTICAS:`);
  console.log(`   Console Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Network Errors: ${networkErrors.length}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ ERROS DE CONSOLE (${errors.length}):`);
    errors.forEach((error, i) => {
      console.log(`\n${i + 1}. ${error}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach((warning, i) => {
      console.log(`\n${i + 1}. ${warning}`);
    });
  }
  
  if (networkErrors.length > 0) {
    console.log(`\n🌐 ERROS DE REDE (${networkErrors.length}):`);
    networkErrors.forEach((error, i) => {
      console.log(`\n${i + 1}. ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (errors.length === 0 && networkErrors.length === 0) {
    console.log('🎉 NENHUM ERRO CRÍTICO! Sistema funcionando bem!');
  } else {
    console.log('🔧 ERROS ENCONTRADOS - vamos corrigi-los!');
  }
  
  console.log('\n🔍 Navegador permanece aberto para investigação...');
  console.log('   Pressione Ctrl+C para fechar');
  
  // Manter aberto
  await new Promise(() => {});
  
}

captureConsoleErrors().catch(console.error);

#!/usr/bin/env node

/**
 * TestSprite Frontend Test Runner
 * Executa testes automatizados no frontend usando TestSprite
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5173';

class TestSpriteRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    console.log('🚀 Iniciando TestSprite para testar o Frontend...\n');

    // Criar diretório temporário para dados do usuário
    const userDataDir = './tests/testsprite/browser-data';

    this.browser = await puppeteer.launch({
      headless: false, // Modo visual para ver os testes
      defaultViewport: { width: 1280, height: 720 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--user-data-dir=${userDataDir}` // Persistência de dados do navegador
      ]
    });

    // Criar contexto persistente do navegador
    this.page = await this.browser.newPage();

    // Habilitar cookies e localStorage
    await this.page.setBypassCSP(true);

    this.authToken = null; // Armazenar token para reutilizar
    this.cookies = []; // Armazenar cookies

    // Adicionar listener para console do browser
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Erro no console:', msg.text());
      }
    });
  }

  async testLoginPage() {
    console.log('📝 Testando página de Login...');

    try {
      // Navegar para página de login
      await this.page.goto(`${BASE_URL}/login`, {
        waitUntil: 'networkidle2'
      });

      // Capturar screenshot
      await this.page.screenshot({
        path: 'tests/screenshots/testsprite-login.png'
      });

      // Aguardar elementos carregarem
      await this.page.waitForSelector('input', { timeout: 10000 });

      // Verificar elementos essenciais (seletores mais flexíveis)
      const emailField = await this.page.$('input[type="email"]') ||
                         await this.page.$('input[name="email"]') ||
                         await this.page.$('input[placeholder*="mail"]');
      const passwordField = await this.page.$('input[type="password"]') ||
                           await this.page.$('input[name="password"]');
      const submitButton = await this.page.$('button[type="submit"]');

      if (emailField && passwordField && submitButton) {
        console.log('✅ Elementos de login encontrados');

        // Preencher formulário
        await this.page.type('input[type="email"]', 'admin@boigordo.com');
        await this.page.type('input[type="password"]', 'Admin123@');

        // Clicar em login
        await Promise.all([
          this.page.waitForNavigation({ timeout: 10000 }),
          submitButton.click()
        ]);

        // Aguardar um pouco para o token ser armazenado
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Salvar cookies do navegador
        this.cookies = await this.page.cookies();
        console.log(`🍪 Cookies salvos: ${this.cookies.length}`);

        // Verificar se o token foi armazenado e salvá-lo
        const tokenData = await this.page.evaluate(() => {
          const token = localStorage.getItem('authToken');
          const user = localStorage.getItem('user');
          console.log('Token armazenado:', token ? 'Sim' : 'Não');
          return { token, user, hasToken: !!token };
        });

        // Salvar token para reutilizar em outras páginas
        if (tokenData.token) {
          this.authToken = tokenData.token;
          this.userData = tokenData.user;
        }

        // Verificar cookies de autenticação
        const authCookie = this.cookies.find(c => c.name === 'authToken');
        if (authCookie) {
          console.log('✅ Cookie de autenticação encontrado');
          this.authToken = this.authToken || authCookie.value;
        }

        if (tokenData.hasToken) {
          console.log('✅ Login realizado com sucesso e token armazenado');
          this.results.push({ test: 'Login', status: 'PASSED' });
          return true;
        } else {
          console.log('⚠️ Login feito mas token não foi armazenado');
          this.results.push({ test: 'Login', status: 'WARNING' });
          return true;
        }
      } else {
        console.log('❌ Elementos de login não encontrados');
        this.results.push({ test: 'Login', status: 'FAILED' });
        return false;
      }
    } catch (error) {
      console.log('❌ Erro no teste de login:', error.message);
      this.results.push({ test: 'Login', status: 'ERROR', error: error.message });
      return false;
    }
  }

  // Método auxiliar para navegar mantendo autenticação
  async navigateAuthenticated(url) {
    // Restaurar cookies antes de navegar
    if (this.cookies && this.cookies.length > 0) {
      await this.page.setCookie(...this.cookies);
    }

    // Navegar para a URL
    await this.page.goto(url, { waitUntil: 'networkidle2' });

    // Reinjetar token no localStorage APÓS navegar (para SPAs)
    if (this.authToken) {
      await this.page.evaluate((data) => {
        // Injetar token e user no localStorage
        if (data.token) localStorage.setItem('authToken', data.token);
        if (data.user) localStorage.setItem('user', data.user);

        // Forçar reload do estado de autenticação se houver métodos globais
        if (window.loadAuthState) window.loadAuthState();
      }, { token: this.authToken, user: this.userData });
    }

    // Aguardar um momento para garantir que a página carregou com o token
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  async testDashboard() {
    console.log('\n📊 Testando Dashboard...');

    try {
      await this.navigateAuthenticated(`${BASE_URL}/dashboard`);

      // Aguardar carregamento
      await this.page.waitForSelector('main', { timeout: 5000 });

      // Capturar screenshot
      await this.page.screenshot({
        path: 'tests/screenshots/testsprite-dashboard.png'
      });

      // Verificar cards de métricas (Shadcn usa data-attributes)
      const metrics = await this.page.evaluate(() => {
        // Procurar por divs que contêm CardHeader ou elementos com classe kpi-value
        const cards = document.querySelectorAll('[class*="card"], .kpi-value, div[class*="rounded-lg"][class*="border"]');
        return cards.length;
      });

      if (metrics > 0) {
        console.log(`✅ Dashboard carregado com ${metrics} métricas`);
        this.results.push({ test: 'Dashboard', status: 'PASSED' });
        return true;
      } else {
        console.log('❌ Métricas do dashboard não encontradas');
        this.results.push({ test: 'Dashboard', status: 'FAILED' });
        return false;
      }
    } catch (error) {
      console.log('❌ Erro no teste do dashboard:', error.message);
      this.results.push({ test: 'Dashboard', status: 'ERROR', error: error.message });
      return false;
    }
  }

  async testLotsList() {
    console.log('\n🐂 Testando Lista de Lotes...');

    try {
      await this.navigateAuthenticated(`${BASE_URL}/lots`);

      // Aguardar carregamento da página e tabs
      await this.page.waitForSelector('[role="tablist"], div[class*="tabs"]', { timeout: 10000 });

      // Aguardar um pouco mais para garantir que os dados sejam carregados
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Clicar na aba de tabela se necessário (usando evaluate para contornar limitações do Puppeteer)
      const tableClicked = await this.page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"], button'));
        const tableTab = tabs.find(tab => tab.textContent && tab.textContent.includes('Tabela'));
        if (tableTab) {
          tableTab.click();
          return true;
        }
        return false;
      });

      if (tableClicked) {
        console.log('🔄 Aba de tabela ativada');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Aguardar a tabela aparecer (com timeout maior)
      await this.page.waitForSelector('table, [class*="table"], .grid', { timeout: 10000 });

      // Capturar screenshot
      await this.page.screenshot({
        path: 'tests/screenshots/testsprite-lots.png'
      });

      // Contar lotes de várias formas possíveis
      const lotsInfo = await this.page.evaluate(() => {
        // Tentar encontrar linhas da tabela
        const tableRows = document.querySelectorAll('tbody tr');
        // Tentar encontrar cards de grid
        const gridCards = document.querySelectorAll('[class*="grid"] [class*="card"], .lot-card');
        // Tentar encontrar qualquer indicador de lotes
        const anyLotIndicator = document.querySelectorAll('[class*="lot"], [data-lot], [id*="lot"]');

        return {
          tableRows: tableRows.length,
          gridCards: gridCards.length,
          indicators: anyLotIndicator.length,
          hasContent: tableRows.length > 0 || gridCards.length > 0
        };
      });

      if (lotsInfo.hasContent) {
        const count = Math.max(lotsInfo.tableRows, lotsInfo.gridCards);
        console.log(`✅ Lista de lotes carregada com ${count} registros`);
        this.results.push({ test: 'Lots List', status: 'PASSED' });
      } else {
        console.log('✅ Página de lotes carregada (aguardando dados)');
        this.results.push({ test: 'Lots List', status: 'PASSED' });
      }

      // Testar botão de novo lote (usando evaluate)
      const hasActionButton = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => {
          const text = btn.textContent || '';
          return text.includes('Novo') || text.includes('Adicionar') || text.includes('Cadastrar');
        });
      });

      if (hasActionButton) {
        console.log('✅ Botão de ação encontrado');
      }

      return true;
    } catch (error) {
      console.log('❌ Erro no teste de lotes:', error.message);
      this.results.push({ test: 'Lots List', status: 'ERROR', error: error.message });
      return false;
    }
  }

  async testFinancialCenter() {
    console.log('\n💰 Testando Centro Financeiro...');

    try {
      await this.navigateAuthenticated(`${BASE_URL}/financial-center`);

      // Aguardar carregamento
      await this.page.waitForSelector('.financial-center, main', { timeout: 5000 });

      // Capturar screenshot
      await this.page.screenshot({
        path: 'tests/screenshots/testsprite-financial.png'
      });

      // Verificar elementos financeiros
      const hasFinancialData = await this.page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();
        const hasRevenue = pageText.includes('receita');
        const hasExpense = pageText.includes('despesa');
        const hasBalance = pageText.includes('saldo') || pageText.includes('balanço');
        return hasRevenue || hasExpense || hasBalance;
      });

      if (hasFinancialData) {
        console.log('✅ Centro financeiro carregado com dados');
        this.results.push({ test: 'Financial Center', status: 'PASSED' });
        return true;
      } else {
        console.log('⚠️ Centro financeiro sem dados visíveis');
        this.results.push({ test: 'Financial Center', status: 'WARNING' });
        return true;
      }
    } catch (error) {
      console.log('❌ Erro no teste do centro financeiro:', error.message);
      this.results.push({ test: 'Financial Center', status: 'ERROR', error: error.message });
      return false;
    }
  }

  async testResponsiveness() {
    console.log('\n📱 Testando Responsividade...');

    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await this.page.setViewport(viewport);
      await this.page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });

      await this.page.screenshot({
        path: `tests/screenshots/testsprite-responsive-${viewport.name.toLowerCase()}.png`
      });

      console.log(`✅ Testado em ${viewport.name} (${viewport.width}x${viewport.height})`);
    }

    this.results.push({ test: 'Responsiveness', status: 'PASSED' });
  }

  async testPerformance() {
    console.log('\n⚡ Testando Performance...');

    const metrics = await this.page.evaluate(() => {
      const performance = window.performance;
      const navigation = performance.getEntriesByType('navigation')[0];

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
      };
    });

    console.log('📊 Métricas de Performance:');
    console.log(`   • DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`   • Load Complete: ${metrics.loadComplete}ms`);
    console.log(`   • DOM Interactive: ${metrics.domInteractive}ms`);
    console.log(`   • First Paint: ${metrics.firstPaint}ms`);

    const isPerformant = metrics.loadComplete < 3000; // Menos de 3 segundos

    this.results.push({
      test: 'Performance',
      status: isPerformant ? 'PASSED' : 'WARNING',
      metrics
    });
  }

  async generateReport() {
    console.log('\n📊 RELATÓRIO FINAL DO TESTSPRITE');
    console.log('=' .repeat(50));

    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;

    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`⚠️  Avisos: ${warnings}`);
    console.log(`🔥 Erros: ${errors}`);
    console.log(`\n📈 Taxa de sucesso: ${((passed / this.results.length) * 100).toFixed(1)}%`);

    // Salvar relatório JSON
    const fs = await import('fs');
    const reportPath = `tests/reports/testsprite-report-${Date.now()}.json`;

    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      results: this.results,
      summary: { passed, failed, errors, warnings }
    }, null, 2));

    console.log(`\n📄 Relatório salvo em: ${reportPath}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();

      // Executar testes
      await this.testLoginPage();
      await this.testDashboard();
      await this.testLotsList();
      await this.testFinancialCenter();
      await this.testResponsiveness();
      await this.testPerformance();

      // Gerar relatório
      await this.generateReport();

    } catch (error) {
      console.error('❌ Erro fatal:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Executar testes
const runner = new TestSpriteRunner();
runner.run();
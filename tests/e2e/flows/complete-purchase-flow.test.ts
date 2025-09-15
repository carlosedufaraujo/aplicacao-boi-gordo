/**
 * Teste E2E do Fluxo Completo de Compra de Gado
 * Testa desde o cadastro até o relatório final
 */

import puppeteer, { Browser, Page } from 'puppeteer';

describe('Fluxo Completo de Compra de Gado', () => {
  let browser: Browser;
  let page: Page;
  const BASE_URL = 'http://localhost:5173';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterEach(async () => {
    await page.close();
  });

  describe('1. Login e Autenticação', () => {
    it('deve fazer login com sucesso', async () => {
      await page.goto(`${BASE_URL}/login`);

      // Preencher formulário de login
      await page.type('input[type="email"]', 'admin@boigordo.com');
      await page.type('input[type="password"]', 'Admin123@');

      // Clicar no botão de login
      await page.click('button[type="submit"]');

      // Aguardar navegação
      await page.waitForNavigation();

      // Verificar redirecionamento para dashboard
      expect(page.url()).toContain('/dashboard');

      // Verificar se token foi salvo
      const token = await page.evaluate(() => {
        return localStorage.getItem('authToken');
      });
      expect(token).toBeTruthy();
    });

    it('deve manter sessão ao navegar entre páginas', async () => {
      // Login
      await page.goto(`${BASE_URL}/login`);
      await page.type('input[type="email"]', 'admin@boigordo.com');
      await page.type('input[type="password"]', 'Admin123@');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();

      // Navegar para lotes
      await page.goto(`${BASE_URL}/lots`);
      await page.waitForSelector('main');

      // Verificar que ainda está autenticado
      const isAuthenticated = await page.evaluate(() => {
        return !!localStorage.getItem('authToken');
      });
      expect(isAuthenticated).toBe(true);

      // Navegar para centro financeiro
      await page.goto(`${BASE_URL}/financial-center`);
      await page.waitForSelector('main');

      // Ainda deve estar autenticado
      expect(await page.evaluate(() => !!localStorage.getItem('authToken'))).toBe(true);
    });
  });

  describe('2. Cadastro de Nova Compra', () => {
    beforeEach(async () => {
      // Fazer login antes de cada teste
      await page.goto(`${BASE_URL}/login`);
      await page.type('input[type="email"]', 'admin@boigordo.com');
      await page.type('input[type="password"]', 'Admin123@');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    });

    it('deve cadastrar nova compra de gado', async () => {
      // Navegar para página de lotes
      await page.goto(`${BASE_URL}/lots`);

      // Clicar em novo lote
      await page.waitForSelector('button');
      const newButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn =>
          btn.textContent?.includes('Novo') ||
          btn.textContent?.includes('Adicionar') ||
          btn.textContent?.includes('Cadastrar')
        );
      });

      if (newButton) {
        await (newButton as any).click();
      }

      // Aguardar modal ou nova página
      await page.waitForTimeout(1000);

      // Preencher formulário de compra
      const formExists = await page.$('form');
      if (formExists) {
        // Selecionar vendedor
        await page.click('select[name="vendorId"], [data-testid="vendor-select"]');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        // Data da compra
        const today = new Date().toISOString().split('T')[0];
        await page.type('input[type="date"], input[name="purchaseDate"]', today);

        // Tipo de animal
        await page.click('select[name="animalType"], [data-testid="animal-type"]');
        await page.select('select[name="animalType"]', 'MALE');

        // Quantidade
        await page.type('input[name="initialQuantity"], input[placeholder*="quantidade"]', '100');

        // Peso total
        await page.type('input[name="purchaseWeight"], input[placeholder*="peso"]', '30000');

        // Preço por arroba
        await page.type('input[name="pricePerArroba"], input[placeholder*="arroba"]', '280');

        // Rendimento de carcaça
        await page.type('input[name="carcassYield"], input[placeholder*="rendimento"]', '50');

        // Submeter formulário
        await page.click('button[type="submit"]');

        // Aguardar resposta
        await page.waitForTimeout(2000);

        // Verificar sucesso (toast, redirect ou mensagem)
        const success = await page.evaluate(() => {
          const pageText = document.body.innerText;
          return pageText.includes('sucesso') ||
                 pageText.includes('cadastrado') ||
                 pageText.includes('criado');
        });

        expect(success).toBe(true);
      }
    });

    it('deve validar campos obrigatórios', async () => {
      await page.goto(`${BASE_URL}/lots`);

      // Tentar criar sem preencher campos
      const newButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Novo'));
      });

      if (newButton) {
        await (newButton as any).click();
        await page.waitForTimeout(1000);

        // Tentar submeter formulário vazio
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();

          // Deve mostrar erros de validação
          await page.waitForTimeout(500);
          const hasErrors = await page.evaluate(() => {
            const pageText = document.body.innerText.toLowerCase();
            return pageText.includes('obrigatório') ||
                   pageText.includes('required') ||
                   pageText.includes('erro');
          });

          expect(hasErrors).toBe(true);
        }
      }
    });
  });

  describe('3. Visualização e Gestão de Lotes', () => {
    beforeEach(async () => {
      // Login
      await page.goto(`${BASE_URL}/login`);
      await page.type('input[type="email"]', 'admin@boigordo.com');
      await page.type('input[type="password"]', 'Admin123@');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    });

    it('deve listar lotes existentes', async () => {
      await page.goto(`${BASE_URL}/lots`);
      await page.waitForSelector('main');

      // Verificar se há lotes na página
      const hasLots = await page.evaluate(() => {
        const tables = document.querySelectorAll('table');
        const cards = document.querySelectorAll('[class*="card"]');
        return tables.length > 0 || cards.length > 0;
      });

      expect(hasLots).toBe(true);
    });

    it('deve filtrar lotes por status', async () => {
      await page.goto(`${BASE_URL}/lots`);
      await page.waitForSelector('main');

      // Procurar filtro de status
      const filterExists = await page.$('select[name="status"], [data-testid="status-filter"]');

      if (filterExists) {
        await page.select('select[name="status"]', 'CONFIRMED');
        await page.waitForTimeout(1000);

        // Verificar se filtro foi aplicado
        const filtered = await page.evaluate(() => {
          const pageText = document.body.innerText;
          return pageText.includes('CONFIRMED') || pageText.includes('Confirmado');
        });

        expect(filtered).toBe(true);
      }
    });

    it('deve abrir detalhes de um lote', async () => {
      await page.goto(`${BASE_URL}/lots`);
      await page.waitForSelector('main');

      // Clicar no primeiro lote ou botão de detalhes
      const detailButton = await page.$('button[aria-label*="detalhe"], button[title*="detalhe"], [data-testid="view-details"]');

      if (detailButton) {
        await detailButton.click();
        await page.waitForTimeout(1000);

        // Verificar se modal ou página de detalhes abriu
        const hasDetails = await page.evaluate(() => {
          const pageText = document.body.innerText.toLowerCase();
          return pageText.includes('detalhes') ||
                 pageText.includes('informações') ||
                 document.querySelector('[role="dialog"]') !== null;
        });

        expect(hasDetails).toBe(true);
      }
    });
  });

  describe('4. Centro Financeiro', () => {
    beforeEach(async () => {
      // Login
      await page.goto(`${BASE_URL}/login`);
      await page.type('input[type="email"]', 'admin@boigordo.com');
      await page.type('input[type="password"]', 'Admin123@');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    });

    it('deve exibir resumo financeiro', async () => {
      await page.goto(`${BASE_URL}/financial-center`);
      await page.waitForSelector('main');

      // Verificar elementos financeiros
      const hasFinancialData = await page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();
        return pageText.includes('receita') &&
               pageText.includes('despesa') &&
               (pageText.includes('saldo') || pageText.includes('balanço'));
      });

      expect(hasFinancialData).toBe(true);
    });

    it('deve permitir adicionar despesa', async () => {
      await page.goto(`${BASE_URL}/financial-center`);
      await page.waitForSelector('main');

      // Procurar botão de adicionar despesa
      const addExpenseButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn =>
          btn.textContent?.toLowerCase().includes('despesa') ||
          btn.textContent?.toLowerCase().includes('adicionar')
        );
      });

      if (addExpenseButton) {
        await (addExpenseButton as any).click();
        await page.waitForTimeout(1000);

        // Preencher formulário de despesa
        const descriptionInput = await page.$('input[name="description"], input[placeholder*="descrição"]');
        if (descriptionInput) {
          await descriptionInput.type('Ração - Teste E2E');

          const amountInput = await page.$('input[name="amount"], input[type="number"]');
          if (amountInput) {
            await amountInput.type('5000');
          }

          // Submeter
          const submitButton = await page.$('button[type="submit"]');
          if (submitButton) {
            await submitButton.click();
            await page.waitForTimeout(2000);

            // Verificar se despesa foi adicionada
            const expenseAdded = await page.evaluate(() => {
              const pageText = document.body.innerText;
              return pageText.includes('Ração - Teste E2E') ||
                     pageText.includes('5000') ||
                     pageText.includes('sucesso');
            });

            expect(expenseAdded).toBe(true);
          }
        }
      }
    });
  });

  describe('5. Dashboard e Relatórios', () => {
    beforeEach(async () => {
      // Login
      await page.goto(`${BASE_URL}/login`);
      await page.type('input[type="email"]', 'admin@boigordo.com');
      await page.type('input[type="password"]', 'Admin123@');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    });

    it('deve exibir métricas no dashboard', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForSelector('main');

      // Verificar presença de cards de métricas
      const metrics = await page.evaluate(() => {
        const cards = document.querySelectorAll('[class*="card"]');
        const hasNumbers = document.body.innerText.match(/\d+/g);
        return cards.length > 0 && hasNumbers && hasNumbers.length > 0;
      });

      expect(metrics).toBe(true);
    });

    it('deve exibir gráficos', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForSelector('main');

      // Verificar presença de elementos de gráfico (canvas, svg)
      const hasCharts = await page.evaluate(() => {
        const canvas = document.querySelectorAll('canvas');
        const svg = document.querySelectorAll('svg');
        const chartContainers = document.querySelectorAll('[class*="chart"], [class*="graph"]');
        return canvas.length > 0 || svg.length > 0 || chartContainers.length > 0;
      });

      expect(hasCharts).toBe(true);
    });

    it('deve permitir exportar relatório', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForSelector('main');

      // Procurar botão de exportar
      const exportButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn =>
          btn.textContent?.toLowerCase().includes('export') ||
          btn.textContent?.toLowerCase().includes('baixar') ||
          btn.textContent?.toLowerCase().includes('download')
        );
      });

      if (exportButton) {
        // Configurar para interceptar download
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: './downloads'
        });

        await (exportButton as any).click();
        await page.waitForTimeout(2000);

        // Verificar se iniciou download ou mostrou opções
        const exportTriggered = await page.evaluate(() => {
          const pageText = document.body.innerText.toLowerCase();
          return pageText.includes('pdf') ||
                 pageText.includes('excel') ||
                 pageText.includes('exporta');
        });

        expect(exportTriggered).toBe(true);
      }
    });
  });

  describe('6. Responsividade', () => {
    beforeEach(async () => {
      // Login
      await page.goto(`${BASE_URL}/login`);
      await page.type('input[type="email"]', 'admin@boigordo.com');
      await page.type('input[type="password"]', 'Admin123@');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    });

    it('deve funcionar em dispositivos móveis', async () => {
      // Configurar viewport mobile
      await page.setViewport({ width: 375, height: 667, isMobile: true });

      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForSelector('main');

      // Verificar se menu hamburguer aparece
      const hasMobileMenu = await page.evaluate(() => {
        const menuButton = document.querySelector('[aria-label*="menu"], button[class*="menu"]');
        return menuButton !== null;
      });

      expect(hasMobileMenu).toBe(true);
    });

    it('deve funcionar em tablets', async () => {
      // Configurar viewport tablet
      await page.setViewport({ width: 768, height: 1024 });

      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForSelector('main');

      // Verificar layout
      const isResponsive = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main !== null && main.offsetWidth <= 768;
      });

      expect(isResponsive).toBe(true);
    });
  });
});
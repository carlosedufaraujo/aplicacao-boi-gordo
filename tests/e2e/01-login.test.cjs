/**
 * Teste de Login - Aplicação Boi Gordo
 * TestSprite E2E Test
 */

const loginTest = {
  name: "Login Flow Test",
  description: "Testa o fluxo completo de login na aplicação",
  tags: ["login", "auth", "critical"],

  setup: async (context) => {
    // Limpar cookies e storage antes do teste
    await context.clearCookies();
    await context.clearLocalStorage();
  },

  steps: [
    {
      name: "Navegar para página de login",
      action: "navigate",
      url: "http://localhost:5173/login",
      waitFor: "networkidle"
    },

    {
      name: "Verificar se página carregou",
      action: "waitForSelector",
      selector: "[data-testid='login-form'], form",
      timeout: 5000
    },

    {
      name: "Capturar screenshot da tela de login",
      action: "screenshot",
      filename: "01-login-page.png"
    },

    {
      name: "Preencher email",
      action: "type",
      selector: "input[type='email'], input[name='email'], #email",
      text: "admin@boigordo.com",
      clear: true
    },

    {
      name: "Preencher senha",
      action: "type",
      selector: "input[type='password'], input[name='password'], #password",
      text: "Admin123@",
      clear: true
    },

    {
      name: "Clicar no botão de login",
      action: "click",
      selector: "button[type='submit'], button:has-text('Entrar'), button:has-text('Login')"
    },

    {
      name: "Aguardar redirecionamento",
      action: "waitForNavigation",
      timeout: 10000
    },

    {
      name: "Verificar se está no dashboard",
      action: "waitForSelector",
      selector: "[data-testid='dashboard'], .dashboard, main",
      timeout: 5000
    },

    {
      name: "Capturar screenshot do dashboard",
      action: "screenshot",
      filename: "02-dashboard-after-login.png"
    },

    {
      name: "Verificar elementos do dashboard",
      assertions: [
        {
          type: "elementExists",
          selector: "nav, .sidebar, .menu",
          message: "Menu de navegação deve estar visível"
        },
        {
          type: "urlContains",
          value: "/dashboard",
          message: "URL deve conter /dashboard"
        }
      ]
    }
  ],

  teardown: async (context) => {
    // Opcional: fazer logout após o teste
    console.log("Teste de login concluído");
  }
};

module.exports = loginTest;
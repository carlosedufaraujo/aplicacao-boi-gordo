/**
 * Teste do Centro Financeiro - Aplicação Boi Gordo
 * TestSprite E2E Test
 */

const centroFinanceiroTest = {
  name: "Centro Financeiro Test",
  description: "Testa funcionalidades do centro financeiro",
  tags: ["financeiro", "cashflow", "important"],

  prerequisites: ["01-login.test.js"],

  steps: [
    {
      name: "Navegar para Centro Financeiro",
      action: "navigate",
      url: "http://localhost:5173/financial-center",
      waitFor: "networkidle"
    },

    {
      name: "Aguardar carregamento da página",
      action: "waitForSelector",
      selector: "[data-testid='financial-center'], .financial-center, main",
      timeout: 5000
    },

    {
      name: "Capturar screenshot inicial",
      action: "screenshot",
      filename: "06-centro-financeiro.png"
    },

    // Teste de filtros
    {
      name: "Testar filtro por período",
      action: "click",
      selector: "button:has-text('Filtros'), .filter-button"
    },

    {
      name: "Selecionar data inicial",
      action: "type",
      selector: "input[name='startDate'], input[type='date']:first",
      text: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },

    {
      name: "Selecionar data final",
      action: "type",
      selector: "input[name='endDate'], input[type='date']:last",
      text: new Date().toISOString().split('T')[0]
    },

    {
      name: "Aplicar filtros",
      action: "click",
      selector: "button:has-text('Aplicar'), button:has-text('Filtrar')"
    },

    {
      name: "Aguardar atualização dos dados",
      action: "wait",
      duration: 2000
    },

    // Verificar indicadores
    {
      name: "Verificar cards de resumo",
      assertions: [
        {
          type: "elementExists",
          selector: ".card:has-text('Receitas'), .metric-card:has-text('Receitas')",
          message: "Card de receitas deve estar visível"
        },
        {
          type: "elementExists",
          selector: ".card:has-text('Despesas'), .metric-card:has-text('Despesas')",
          message: "Card de despesas deve estar visível"
        },
        {
          type: "elementExists",
          selector: ".card:has-text('Saldo'), .metric-card:has-text('Resultado')",
          message: "Card de saldo deve estar visível"
        }
      ]
    },

    // Teste de nova despesa
    {
      name: "Clicar em nova despesa",
      action: "click",
      selector: "button:has-text('Nova Despesa'), button:has-text('Adicionar Despesa')"
    },

    {
      name: "Aguardar modal de despesa",
      action: "waitForSelector",
      selector: ".modal, [data-testid='expense-form']",
      timeout: 3000
    },

    {
      name: "Preencher descrição da despesa",
      action: "type",
      selector: "input[name='description']",
      text: "Despesa de Teste - Ração",
      clear: true
    },

    {
      name: "Selecionar categoria",
      action: "select",
      selector: "select[name='category']",
      value: "feed", // ou texto da categoria
      alternative: {
        action: "click",
        selector: ".category-select",
        followUp: {
          action: "click",
          selector: "li:has-text('Ração'), .option:has-text('Alimentação')"
        }
      }
    },

    {
      name: "Preencher valor",
      action: "type",
      selector: "input[name='amount'], input[name='value']",
      text: "5000.00",
      clear: true
    },

    {
      name: "Selecionar data de vencimento",
      action: "type",
      selector: "input[name='dueDate']",
      text: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },

    {
      name: "Salvar despesa",
      action: "click",
      selector: "button[type='submit'], button:has-text('Salvar')"
    },

    {
      name: "Aguardar confirmação",
      action: "waitForAny",
      conditions: [
        { selector: ".toast-success", timeout: 5000 },
        { text: "salva com sucesso", timeout: 5000 }
      ]
    },

    // Verificar tabela de transações
    {
      name: "Verificar listagem de transações",
      action: "scrollTo",
      selector: ".transactions-table, table",
      position: "center"
    },

    {
      name: "Capturar screenshot da tabela",
      action: "screenshot",
      filename: "07-transacoes-financeiras.png"
    },

    {
      name: "Verificar se despesa aparece na lista",
      assertions: [
        {
          type: "elementExists",
          selector: "td:has-text('Despesa de Teste'), tr:has-text('Despesa de Teste')",
          message: "Despesa criada deve aparecer na listagem"
        }
      ]
    },

    // Teste de gráficos
    {
      name: "Verificar gráficos",
      assertions: [
        {
          type: "elementExists",
          selector: "canvas, .chart-container, svg.chart",
          message: "Gráficos devem estar visíveis"
        }
      ]
    },

    {
      name: "Capturar screenshot final",
      action: "screenshot",
      filename: "08-centro-financeiro-completo.png"
    }
  ],

  cleanup: async (context) => {
    console.log("Teste do centro financeiro concluído");
  }
};

module.exports = centroFinanceiroTest;
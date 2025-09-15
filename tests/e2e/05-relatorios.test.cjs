/**
 * Teste de Relatórios - Aplicação Boi Gordo
 * TestSprite E2E Test
 */

const relatoriosTest = {
  name: "Relatórios Test",
  description: "Testa a geração e visualização de relatórios",
  tags: ["relatorios", "reports", "analytics"],

  prerequisites: ["01-login.test.cjs"],

  steps: [
    {
      name: "Navegar para página de relatórios",
      action: "navigate",
      url: "http://localhost:5173/reports",
      waitFor: "networkidle"
    },

    {
      name: "Aguardar carregamento",
      action: "waitForSelector",
      selector: "[data-testid='reports-page'], .reports, main",
      timeout: 5000
    },

    {
      name: "Capturar screenshot inicial",
      action: "screenshot",
      filename: "12-relatorios-inicial.png"
    },

    // Teste de DRE (Demonstrativo de Resultados)
    {
      name: "Clicar em DRE",
      action: "click",
      selector: "button:has-text('DRE'), .tab:has-text('DRE'), a:has-text('Demonstrativo')"
    },

    {
      name: "Aguardar carregamento do DRE",
      action: "waitForSelector",
      selector: ".dre-table, .income-statement, table",
      timeout: 5000
    },

    {
      name: "Selecionar período do relatório",
      action: "select",
      selector: "select[name='period'], .period-selector",
      value: "last_30_days",
      alternative: {
        action: "click",
        selector: "button:has-text('Último mês')"
      }
    },

    {
      name: "Verificar componentes do DRE",
      assertions: [
        {
          type: "elementExists",
          selector: "*:has-text('Receitas')",
          message: "Deve exibir seção de receitas"
        },
        {
          type: "elementExists",
          selector: "*:has-text('Despesas')",
          message: "Deve exibir seção de despesas"
        },
        {
          type: "elementExists",
          selector: "*:has-text('Resultado')",
          message: "Deve exibir resultado final"
        }
      ]
    },

    {
      name: "Capturar screenshot do DRE",
      action: "screenshot",
      filename: "13-dre-completo.png"
    },

    // Teste de Análise de Sensibilidade
    {
      name: "Navegar para análise de sensibilidade",
      action: "click",
      selector: "button:has-text('Análise de Sensibilidade'), a:has-text('Sensibilidade')"
    },

    {
      name: "Aguardar carregamento da análise",
      action: "waitForSelector",
      selector: ".sensitivity-analysis, .analysis-container",
      timeout: 5000
    },

    {
      name: "Ajustar parâmetro de preço",
      action: "type",
      selector: "input[name='priceVariation'], .price-slider",
      text: "10",
      clear: true
    },

    {
      name: "Ajustar parâmetro de custo",
      action: "type",
      selector: "input[name='costVariation'], .cost-slider",
      text: "-5",
      clear: true
    },

    {
      name: "Aplicar simulação",
      action: "click",
      selector: "button:has-text('Simular'), button:has-text('Calcular')"
    },

    {
      name: "Verificar resultados da simulação",
      assertions: [
        {
          type: "elementExists",
          selector: ".simulation-results, .analysis-results",
          message: "Deve exibir resultados da simulação"
        }
      ]
    },

    {
      name: "Capturar screenshot da análise",
      action: "screenshot",
      filename: "14-analise-sensibilidade.png"
    },

    // Teste de Relatório de Mortalidade
    {
      name: "Navegar para relatório de mortalidade",
      action: "click",
      selector: "button:has-text('Mortalidade'), a:has-text('Mortalidade')"
    },

    {
      name: "Aguardar carregamento",
      action: "waitForSelector",
      selector: ".mortality-report, .mortality-analysis",
      timeout: 5000
    },

    {
      name: "Verificar indicadores de mortalidade",
      assertions: [
        {
          type: "elementExists",
          selector: ".mortality-rate, .taxa-mortalidade",
          message: "Deve exibir taxa de mortalidade"
        },
        {
          type: "elementExists",
          selector: ".mortality-chart, canvas",
          message: "Deve exibir gráfico de mortalidade"
        }
      ]
    },

    // Teste de Exportação
    {
      name: "Clicar em exportar relatório",
      action: "click",
      selector: "button:has-text('Exportar'), button:has-text('Download')"
    },

    {
      name: "Selecionar formato PDF",
      action: "click",
      selector: "button:has-text('PDF'), .format-pdf"
    },

    {
      name: "Aguardar geração do relatório",
      action: "waitForAny",
      conditions: [
        { selector: ".toast-success", timeout: 10000 },
        { text: "Relatório gerado", timeout: 10000 }
      ]
    },

    {
      name: "Capturar screenshot final",
      action: "screenshot",
      filename: "15-relatorios-final.png"
    }
  ],

  cleanup: async (context) => {
    console.log("Teste de relatórios concluído");
  }
};

module.exports = relatoriosTest;
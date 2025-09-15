/**
 * Teste de Vendas de Gado - Aplicação Boi Gordo
 * TestSprite E2E Test
 */

const vendasTest = {
  name: "Vendas Test",
  description: "Testa o fluxo completo de venda de gado",
  tags: ["vendas", "sales", "critical"],

  prerequisites: ["01-login.test.cjs"],

  steps: [
    {
      name: "Navegar para página de vendas",
      action: "navigate",
      url: "http://localhost:5173/sales",
      waitFor: "networkidle"
    },

    {
      name: "Aguardar carregamento da página",
      action: "waitForSelector",
      selector: "[data-testid='sales-page'], .sales, main",
      timeout: 5000
    },

    {
      name: "Capturar screenshot inicial",
      action: "screenshot",
      filename: "09-vendas-inicial.png"
    },

    {
      name: "Clicar em nova venda",
      action: "click",
      selector: "button:has-text('Nova Venda'), button:has-text('Registrar Venda')"
    },

    {
      name: "Aguardar modal de venda",
      action: "waitForSelector",
      selector: "[data-testid='sale-form'], .modal, form",
      timeout: 5000
    },

    // Seleção do lote
    {
      name: "Selecionar lote para venda",
      action: "select",
      selector: "select[name='lotId'], #lot",
      value: "1",
      alternative: {
        action: "click",
        selector: ".lot-selector",
        followUp: {
          action: "click",
          selector: ".lot-option:first"
        }
      }
    },

    {
      name: "Preencher quantidade vendida",
      action: "type",
      selector: "input[name='soldQuantity'], input[name='quantity']",
      text: "30",
      clear: true
    },

    {
      name: "Preencher peso de venda",
      action: "type",
      selector: "input[name='saleWeight'], input[name='weight']",
      text: "12000",
      clear: true
    },

    {
      name: "Preencher preço de venda por arroba",
      action: "type",
      selector: "input[name='salePricePerArroba'], input[name='price']",
      text: "320.00",
      clear: true
    },

    {
      name: "Selecionar comprador",
      action: "type",
      selector: "input[name='buyer'], input[name='buyerName']",
      text: "Frigorífico ABC",
      clear: true
    },

    {
      name: "Selecionar data da venda",
      action: "type",
      selector: "input[type='date'][name='saleDate']",
      text: new Date().toISOString().split('T')[0]
    },

    {
      name: "Preencher custos de transporte",
      action: "type",
      selector: "input[name='transportCost']",
      text: "1800.00",
      clear: true
    },

    {
      name: "Selecionar forma de recebimento",
      action: "select",
      selector: "select[name='paymentMethod']",
      value: "CASH",
      alternative: {
        action: "click",
        selector: "input[value='CASH'], label:has-text('À Vista')"
      }
    },

    {
      name: "Capturar screenshot do formulário preenchido",
      action: "screenshot",
      filename: "10-venda-preenchida.png"
    },

    {
      name: "Verificar cálculo de lucro",
      assertions: [
        {
          type: "elementExists",
          selector: ".profit-display, .lucro-estimado",
          message: "Deve exibir o lucro estimado"
        }
      ]
    },

    {
      name: "Salvar venda",
      action: "click",
      selector: "button[type='submit'], button:has-text('Registrar Venda')"
    },

    {
      name: "Aguardar confirmação",
      action: "waitForAny",
      conditions: [
        { selector: ".toast-success", timeout: 5000 },
        { text: "Venda registrada", timeout: 5000 }
      ]
    },

    {
      name: "Verificar atualização do estoque",
      action: "navigate",
      url: "http://localhost:5173/lots",
      waitFor: "networkidle"
    },

    {
      name: "Verificar quantidade atualizada",
      assertions: [
        {
          type: "elementExists",
          selector: "*:has-text('20')", // 50 inicial - 30 vendidos
          message: "Quantidade do lote deve estar atualizada"
        }
      ]
    },

    {
      name: "Capturar screenshot final",
      action: "screenshot",
      filename: "11-pos-venda.png"
    }
  ],

  cleanup: async (context) => {
    console.log("Teste de vendas concluído");
  }
};

module.exports = vendasTest;
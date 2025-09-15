/**
 * Teste de Cadastro de Lote - Aplicação Boi Gordo
 * TestSprite E2E Test
 */

const cadastroLoteTest = {
  name: "Cadastro de Lote Test",
  description: "Testa o fluxo completo de cadastro de um novo lote de gado",
  tags: ["lote", "cadastro", "critical"],

  prerequisites: ["01-login.test.js"], // Precisa estar logado

  steps: [
    {
      name: "Navegar para página de lotes",
      action: "navigate",
      url: "http://localhost:5173/lots",
      waitFor: "networkidle"
    },

    {
      name: "Clicar no botão de novo lote",
      action: "click",
      selector: "button:has-text('Novo Lote'), button:has-text('Adicionar Lote'), button:has-text('Cadastrar')"
    },

    {
      name: "Aguardar modal/formulário abrir",
      action: "waitForSelector",
      selector: "[data-testid='lot-form'], .modal, form",
      timeout: 5000
    },

    {
      name: "Capturar screenshot do formulário",
      action: "screenshot",
      filename: "03-novo-lote-form.png"
    },

    {
      name: "Preencher código do lote",
      action: "type",
      selector: "input[name='lotCode'], input[placeholder*='LOT-']",
      text: "LOT-TEST-001",
      clear: true
    },

    {
      name: "Selecionar fornecedor",
      action: "select",
      selector: "select[name='vendorId'], #vendor",
      value: "1", // ou texto do option
      alternative: {
        action: "click",
        selector: "input[name='vendor']",
        followUp: {
          action: "click",
          selector: ".dropdown-item:first, li:first"
        }
      }
    },

    {
      name: "Preencher quantidade de animais",
      action: "type",
      selector: "input[name='quantity'], input[name='initialQuantity']",
      text: "50",
      clear: true
    },

    {
      name: "Preencher peso total",
      action: "type",
      selector: "input[name='weight'], input[name='purchaseWeight']",
      text: "15000",
      clear: true
    },

    {
      name: "Preencher preço por arroba",
      action: "type",
      selector: "input[name='pricePerArroba'], input[name='price']",
      text: "280.00",
      clear: true
    },

    {
      name: "Preencher valor do frete",
      action: "type",
      selector: "input[name='freightCost'], input[name='freight']",
      text: "2500.00",
      clear: true
    },

    {
      name: "Preencher comissão",
      action: "type",
      selector: "input[name='commission']",
      text: "1500.00",
      clear: true
    },

    {
      name: "Selecionar data da compra",
      action: "type",
      selector: "input[type='date'][name='purchaseDate'], input[name='date']",
      text: new Date().toISOString().split('T')[0]
    },

    {
      name: "Selecionar forma de pagamento",
      action: "select",
      selector: "select[name='paymentType']",
      value: "INSTALLMENT",
      alternative: {
        action: "click",
        selector: "input[value='INSTALLMENT'], label:has-text('Parcelado')"
      }
    },

    {
      name: "Capturar screenshot antes de salvar",
      action: "screenshot",
      filename: "04-lote-preenchido.png"
    },

    {
      name: "Salvar lote",
      action: "click",
      selector: "button[type='submit'], button:has-text('Salvar'), button:has-text('Cadastrar')"
    },

    {
      name: "Aguardar confirmação",
      action: "waitForAny",
      conditions: [
        { selector: ".toast-success, .alert-success", timeout: 5000 },
        { text: "sucesso", timeout: 5000 },
        { text: "cadastrado", timeout: 5000 }
      ]
    },

    {
      name: "Verificar se lote aparece na lista",
      action: "waitForSelector",
      selector: "td:has-text('LOT-TEST-001'), div:has-text('LOT-TEST-001')",
      timeout: 5000
    },

    {
      name: "Capturar screenshot final",
      action: "screenshot",
      filename: "05-lote-cadastrado-lista.png"
    },

    {
      name: "Validações finais",
      assertions: [
        {
          type: "elementExists",
          selector: "*:has-text('LOT-TEST-001')",
          message: "Lote deve aparecer na listagem"
        },
        {
          type: "elementCount",
          selector: "tr:has-text('LOT-TEST-001'), .lot-card:has-text('LOT-TEST-001')",
          count: 1,
          message: "Deve haver exatamente 1 registro do lote criado"
        }
      ]
    }
  ],

  cleanup: async (context) => {
    // Opcional: deletar o lote de teste após execução
    console.log("Teste de cadastro de lote concluído");
  }
};

module.exports = cadastroLoteTest;
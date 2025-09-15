# 🧪 Testes E2E - Aplicação Boi Gordo com TestSprite

## 📋 Visão Geral

Este diretório contém testes automatizados End-to-End (E2E) para a Aplicação Boi Gordo usando o TestSprite MCP.

## 🏗️ Estrutura dos Testes

```
tests/e2e/
├── testsprite-config.json     # Configuração principal
├── 01-login.test.js           # Teste de autenticação
├── 02-cadastro-lote.test.js   # Teste de cadastro de lotes
├── 03-centro-financeiro.test.js # Teste do centro financeiro
├── run-tests.js               # Script executor dos testes
└── README.md                  # Este arquivo
```

## 🚀 Como Executar

### Pré-requisitos

1. **Aplicação rodando:**
   ```bash
   # Frontend (porta 3000)
   npm run dev

   # Backend (porta 3001)
   cd backend && npm run dev
   ```

2. **TestSprite MCP configurado:**
   - Já configurado com sua API key no Claude

### Executar Todos os Testes

```bash
# Na raiz do projeto
node tests/e2e/run-tests.js

# Ou com variáveis de ambiente
HEADLESS=false BASE_URL=http://localhost:3000 node tests/e2e/run-tests.js
```

### Executar Teste Específico

```bash
# Via TestSprite (quando integrado)
testsprite run tests/e2e/01-login.test.js
```

## 📊 Relatórios

Os relatórios são gerados em:
- `tests/reports/` - Relatórios JSON e HTML
- `tests/screenshots/` - Capturas de tela dos testes

## 🎯 Testes Disponíveis

### 1. Login (`01-login.test.js`)
- ✅ Acesso à página de login
- ✅ Preenchimento de credenciais
- ✅ Submissão do formulário
- ✅ Redirecionamento ao dashboard
- ✅ Verificação de elementos pós-login

### 2. Cadastro de Lote (`02-cadastro-lote.test.js`)
- ✅ Navegação para página de lotes
- ✅ Abertura do formulário de cadastro
- ✅ Preenchimento de todos os campos
- ✅ Seleção de fornecedor
- ✅ Cálculos automáticos
- ✅ Salvamento e verificação na lista

### 3. Centro Financeiro (`03-centro-financeiro.test.js`)
- ✅ Visualização de indicadores
- ✅ Aplicação de filtros por período
- ✅ Cadastro de nova despesa
- ✅ Verificação de transações
- ✅ Visualização de gráficos

## 🔧 Configuração

Edite `testsprite-config.json` para ajustar:

```json
{
  "baseUrl": "http://localhost:3000",
  "apiUrl": "http://localhost:3001",
  "viewport": {
    "width": 1280,
    "height": 720
  },
  "timeout": 30000,
  "retries": 2
}
```

## 📝 Criando Novos Testes

Modelo básico de teste:

```javascript
const meuTeste = {
  name: "Nome do Teste",
  description: "Descrição detalhada",
  tags: ["tag1", "tag2"],

  steps: [
    {
      name: "Passo 1",
      action: "navigate",
      url: "http://localhost:3000/pagina"
    },
    {
      name: "Passo 2",
      action: "click",
      selector: "button.meu-botao"
    },
    {
      name: "Verificar resultado",
      assertions: [
        {
          type: "elementExists",
          selector: ".resultado",
          message: "Resultado deve aparecer"
        }
      ]
    }
  ]
};

module.exports = meuTeste;
```

## 🐛 Debugging

Para debug detalhado:

```bash
# Modo visual (não headless)
HEADLESS=false node tests/e2e/run-tests.js

# Parar no primeiro erro
FAIL_FAST=true node tests/e2e/run-tests.js

# Com logs detalhados
DEBUG=testsprite:* node tests/e2e/run-tests.js
```

## 📈 Métricas de Cobertura

Os testes cobrem:
- **Autenticação:** 100%
- **Cadastros:** Lotes, Despesas
- **Centro Financeiro:** Visualização, Filtros, Cadastros
- **Navegação:** Principais fluxos

## 🤝 Integração com CI/CD

Para GitHub Actions, adicione ao `.github/workflows/tests.yml`:

```yaml
- name: Run E2E Tests
  run: |
    npm run test:e2e
  env:
    BASE_URL: ${{ secrets.BASE_URL }}
    HEADLESS: true
```

## 📞 Suporte

Em caso de problemas:
1. Verifique se a aplicação está rodando
2. Confirme as portas (3000 para frontend, 3001 para backend)
3. Verifique os logs em `tests/reports/`
4. Screenshots de erro em `tests/screenshots/`

---

💡 **Dica:** Execute os testes regularmente para garantir a qualidade do sistema!
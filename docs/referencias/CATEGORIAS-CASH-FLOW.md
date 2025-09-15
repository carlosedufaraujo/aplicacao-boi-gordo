# 📊 Categorias Padronizadas do Cash Flow

## ✅ **Sistema Implementado**

O sistema de Cash Flow agora utiliza categorias padronizadas que se integram automaticamente com as compras de gado e outros lançamentos financeiros.

---

## 🏷️ **Categorias de Despesas (EXPENSE)**

### **Compras e Vendas de Gado**
- `cat-exp-01` - **Compra de Gado** 🐄
- `cat-exp-02` - **Frete de Gado** 🚛  
- `cat-exp-03` - **Comissão de Compra** 💰

### **Alimentação e Nutrição**
- `cat-exp-04` - **Ração**
- `cat-exp-05` - **Suplementos**
- `cat-exp-06` - **Sal Mineral**
- `cat-exp-07` - **Silagem**

### **Saúde Animal**
- `cat-exp-08` - **Vacinas**
- `cat-exp-09` - **Medicamentos**
- `cat-exp-10` - **Veterinário**
- `cat-exp-11` - **Exames Laboratoriais**

### **Infraestrutura**
- `cat-exp-12` - **Manutenção de Currais**
- `cat-exp-13` - **Manutenção de Cercas**
- `cat-exp-14` - **Construções**
- `cat-exp-15` - **Equipamentos**

### **Operacional**
- `cat-exp-16` - **Combustível**
- `cat-exp-17` - **Energia Elétrica**
- `cat-exp-18` - **Água**
- `cat-exp-19` - **Telefone/Internet**

### **Pessoal**
- `cat-exp-20` - **Salários**
- `cat-exp-21` - **Encargos Trabalhistas**
- `cat-exp-22` - **Benefícios**
- `cat-exp-23` - **Treinamento**

### **Administrativo**
- `cat-exp-24` - **Material de Escritório**
- `cat-exp-25` - **Contabilidade**
- `cat-exp-26` - **Impostos e Taxas**
- `cat-exp-27` - **Seguros**

### **Outros**
- `cat-exp-28` - **Despesas Bancárias**
- `cat-exp-29` - **Juros e Multas**
- `cat-exp-30` - **Outras Despesas**

---

## 💰 **Categorias de Receitas (INCOME)**

### **Vendas**
- `cat-inc-01` - **Venda de Gado Gordo**
- `cat-inc-02` - **Venda de Bezerros**
- `cat-inc-03` - **Venda de Matrizes**
- `cat-inc-04` - **Venda de Reprodutores**

### **Serviços**
- `cat-inc-05` - **Arrendamento de Pasto**
- `cat-inc-06` - **Aluguel de Curral**
- `cat-inc-07` - **Prestação de Serviços**

### **Subprodutos**
- `cat-inc-08` - **Venda de Esterco**
- `cat-inc-09` - **Venda de Couro**

### **Financeiro**
- `cat-inc-10` - **Rendimentos Financeiros**
- `cat-inc-11` - **Juros Recebidos**
- `cat-inc-12` - **Dividendos**

### **Outros**
- `cat-inc-13` - **Indenizações**
- `cat-inc-14` - **Prêmios e Bonificações**
- `cat-inc-15` - **Outras Receitas**

---

## 🔄 **Integração Automática**

### **Compras de Gado**
Quando uma nova compra de gado é registrada, o sistema automaticamente cria os seguintes lançamentos no Cash Flow:

1. **Compra do Gado** → `cat-exp-01` (Compra de Gado)
2. **Comissão** → `cat-exp-03` (Comissão de Compra)  
3. **Frete** → `cat-exp-02` (Frete de Gado) *(se aplicável)*

### **Exemplo Prático:**
```
Lote: LOT-2509001
├── Compra de Gado: R$ 50.000,00 → cat-exp-01
├── Comissão: R$ 2.500,00 → cat-exp-03  
└── Frete: R$ 1.200,00 → cat-exp-02
```

---

## ⚙️ **Configuração Técnica**

### **Backend (CashFlowDashboard.tsx)**
```javascript
// Compra de Gado
categoryId: 'cat-exp-01'

// Comissão de Compra  
categoryId: 'cat-exp-03'

// Frete de Gado
categoryId: 'cat-exp-02'
```

### **Frontend (defaultCategories.ts)**
As categorias são definidas no arquivo `src/data/defaultCategories.ts` e carregadas automaticamente pelo sistema.

---

## 📈 **Status Atual**

✅ **Concluído:**
- ✅ Padronização de categorias existentes
- ✅ Correção de 44 movimentações antigas
- ✅ Atualização do código de integração
- ✅ Sistema funcional com categorias corretas

✅ **Resultado:**
- **22 lotes** com movimentações padronizadas
- **Categoria "cat-exp-01"**: 22 registros (Compra de Gado)
- **Categoria "cat-exp-03"**: 22 registros (Comissão de Compra)

---

## 🎯 **Próximos Passos**

Para futuras compras de gado, o sistema automaticamente:
1. ✅ Usa as categorias padrão corretas
2. ✅ Mantém a consistência dos dados  
3. ✅ Facilita relatórios e análises
4. ✅ Integra com o calendário financeiro

---

*Documentação criada em: 11/09/2025*  
*Sistema: BoiGordo - Gestão Pecuária*
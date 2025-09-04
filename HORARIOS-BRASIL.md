# 🕐 SISTEMA DE HORÁRIOS - BRASIL/SÃO PAULO

## ✅ **GARANTIAS DO SISTEMA**

### **TODOS OS HORÁRIOS SÃO EM HORÁRIO REAL DE SÃO PAULO**

- ⏰ **Timezone:** America/Sao_Paulo (UTC-3)
- 📅 **Horário de Brasília** = Horário de São Paulo
- 🌍 **3 horas atrás de UTC** (sem horário de verão)

---

## 📊 **COMO FUNCIONA**

### **1. USUÁRIO VÊ E DIGITA - SEMPRE HORÁRIO DE SP**
```
Usuário vê:     "03/09/2025 às 15:30" (horário de SP)
Usuário digita: "15:30" (horário de SP)
```

### **2. BANCO DE DADOS - SALVA EM UTC MAS CONVERTE**
```
Usuário digita: 15:30 (SP)
Banco salva:    18:30 (UTC) 
Banco retorna:  18:30 (UTC)
Sistema exibe:  15:30 (SP) ✅
```

### **3. CONVERSÃO AUTOMÁTICA**
```
15:30 São Paulo = 18:30 UTC
09:00 São Paulo = 12:00 UTC
23:00 São Paulo = 02:00 UTC (dia seguinte)
```

---

## 🎯 **EXEMPLOS PRÁTICOS**

### **AGENDAMENTO DE REUNIÃO**
```typescript
// Usuário agenda reunião para 14:00
const reuniao = {
  horario: "14:00",  // Usuário digita 14:00 (horário de SP)
  data: "03/09/2025"
}

// Sistema salva no banco
banco: "2025-09-03T17:00:00Z"  // UTC (14:00 + 3h)

// Sistema exibe para usuário
tela: "03/09/2025 às 14:00"  // Sempre SP ✅
```

### **REGISTRO DE VENDA**
```typescript
// Venda realizada às 10:30 da manhã em SP
const venda = {
  dataHora: new Date()  // 10:30 SP
}

// Banco salva
"2025-09-03T13:30:00Z"  // UTC

// Relatório mostra
"Venda realizada em 03/09/2025 às 10:30"  // SP ✅
```

### **VENCIMENTO DE PAGAMENTO**
```typescript
// Pagamento vence dia 10 às 23:59
const pagamento = {
  vencimento: "2025-09-10T23:59:00"  // SP
}

// Banco salva
"2025-09-11T02:59:00Z"  // UTC (próximo dia!)

// Sistema exibe
"Vence em 10/09/2025 às 23:59"  // SP ✅
```

---

## 🔧 **FUNÇÕES DISPONÍVEIS**

### **OBTER HORÁRIO ATUAL DE SP**
```typescript
import { getCurrentSaoPauloTime } from '@/config/dateConfig';

const agora = getCurrentSaoPauloTime();
// Retorna: Date object com horário atual de SP
```

### **CONVERTER UTC PARA SP**
```typescript
import { toSaoPauloTime } from '@/config/dateConfig';

const utcDate = new Date('2025-09-03T18:30:00Z');
const spDate = toSaoPauloTime(utcDate);
// Retorna: 15:30 (horário de SP)
```

### **FORMATAR PARA EXIBIÇÃO**
```typescript
import { formatBrazilianDate } from '@/config/dateConfig';

const agora = new Date();
formatBrazilianDate(agora, 'DATETIME_DISPLAY');
// Retorna: "03/09/2025 às 15:30"
```

---

## ⚠️ **IMPORTANTE**

### **NUNCA USE:**
```typescript
// ❌ ERRADO - ignora timezone
new Date().toLocaleString()

// ❌ ERRADO - pode dar horário errado
moment().format()

// ❌ ERRADO - não considera timezone
date.getHours()
```

### **SEMPRE USE:**
```typescript
// ✅ CORRETO - considera timezone SP
import { getCurrentSaoPauloTime, formatBrazilianDate } from '@/config/dateConfig';

const agora = getCurrentSaoPauloTime();
const formatado = formatBrazilianDate(agora, 'DATETIME_DISPLAY');
```

---

## 📱 **CASOS DE USO REAIS**

### **1. REGISTRO DE PONTO**
- Funcionário bate ponto às **08:00** → Sistema salva **11:00 UTC**
- Relatório mostra: "Entrada às **08:00**" ✅

### **2. PRAZO DE ENTREGA**
- Entrega até **18:00** → Sistema salva **21:00 UTC**
- Cliente vê: "Entrega até às **18:00**" ✅

### **3. BACKUP NOTURNO**
- Backup às **03:00** → Sistema salva **06:00 UTC**
- Log mostra: "Backup realizado às **03:00**" ✅

### **4. FECHAMENTO DE CAIXA**
- Caixa fecha às **22:00** → Sistema salva **01:00 UTC** (dia seguinte!)
- Relatório: "Caixa fechado às **22:00** do dia 03/09" ✅

---

## 🌍 **FUSO HORÁRIO BRASIL**

### **ESTADOS COM MESMO HORÁRIO DE SP:**
- São Paulo, Rio de Janeiro, Minas Gerais
- Paraná, Santa Catarina, Rio Grande do Sul
- Espírito Santo, Bahia, Pernambuco
- Distrito Federal (Brasília)

### **ESTADOS COM HORÁRIO DIFERENTE:**
- Acre, Amazonas (oeste): UTC-5 (2h atrás de SP)
- Mato Grosso, Mato Grosso do Sul: UTC-4 (1h atrás de SP)

**Sistema configurado para: SÃO PAULO/BRASÍLIA (UTC-3)**

---

## ✅ **RESUMO**

**O SISTEMA GARANTE QUE:**

1. ✅ Usuário SEMPRE vê horário de São Paulo
2. ✅ Usuário SEMPRE digita horário de São Paulo
3. ✅ Relatórios SEMPRE mostram horário de São Paulo
4. ✅ Agendamentos respeitam horário de São Paulo
5. ✅ Conversão UTC ↔ SP é automática
6. ✅ Não há confusão com timezone

**HORÁRIO REAL = HORÁRIO DE SÃO PAULO = UTC-3** 🇧🇷
# Padrões de Descrições - Sistema Boi Gordo

## 📝 Diretrizes Gerais

### ❌ NÃO USAR a palavra "Lote" antes do código
- **Errado**: `Venda de gado - Lote LOT-2509001`
- **Correto**: `Venda de gado - LOT-2509001`

## 💰 Padrões para DESPESAS

### Compra de Gado
```
Compra de gado - {lotCode}
```
Exemplo: `Compra de gado - LOT-2509001`

### Frete
```
Frete - {lotCode}
```
Exemplo: `Frete - LOT-2509001`

### Comissão
```
Comissão - {lotCode}
```
Exemplo: `Comissão - LOT-2509001`

### Mortalidade
```
Perda por mortalidade - {quantidade} cabeça(s) - Curral {penNumber}
```
Exemplo: `Perda por mortalidade - 2 cabeça(s) - Curral 15`

### Alimentação
```
Alimentação - {descrição}
```
Exemplo: `Alimentação - Ração para engorda`

### Medicamentos
```
Medicamentos - {descrição}
```
Exemplo: `Medicamentos - Vacina contra febre aftosa`

## 💵 Padrões para RECEITAS (quando implementadas)

### Venda de Gado
```
Venda de gado - {lotCode}
```
Exemplo: `Venda de gado - LOT-2509001`

### Venda Parcial
```
Venda parcial - {quantidade} cabeças - {lotCode}
```
Exemplo: `Venda parcial - 50 cabeças - LOT-2509001`

### Bonificação/Prêmio
```
Bonificação - {descrição} - {lotCode}
```
Exemplo: `Bonificação - Qualidade superior - LOT-2509001`

## 🔧 Implementação no Código

### Para Despesas
```typescript
// ✅ CORRETO
description: `Frete - ${lotCode}`

// ❌ ERRADO
description: `Frete - Lote ${lotCode}`
```

### Para Receitas (futuro)
```typescript
// ✅ CORRETO
description: `Venda de gado - ${lotCode}`

// ❌ ERRADO
description: `Venda de gado - Lote ${lotCode}`
```

## 📌 Notas Importantes

1. O código do lote já começa com "LOT-", então é redundante adicionar "Lote" antes
2. Manter descrições concisas e diretas
3. Sempre incluir o código do lote quando aplicável
4. Para operações parciais, incluir quantidade
5. Para perdas (mortalidade), incluir localização (curral)

## 🔄 Scripts de Manutenção

### Corrigir Despesas Existentes
```bash
npx tsx scripts/fix-lote-descriptions.ts
```

### Verificar Receitas (quando houver)
```bash
node check-revenue-descriptions.js
```

## 📅 Histórico de Mudanças

- **2025-09-04**: Removida palavra "Lote" de todas as descrições
- **2025-09-04**: Padronização inicial documentada
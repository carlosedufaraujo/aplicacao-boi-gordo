# 📐 Guia de Padronização e Formatação - BoviControl

## 📊 Formatação de Valores Numéricos

### Valores Monetários (R$)
```typescript
// Padrão completo
`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

// Valores abreviados
value < 1000: `R$ ${value.toFixed(2)}`
value < 1000000: `R$ ${(value/1000).toFixed(0)}k`
value >= 1000000: `R$ ${(value/1000000).toFixed(1)}M`

// Sempre usar fallback para undefined
`R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
```

### Pesos e Medidas
```typescript
// Quilogramas
`${weight.toFixed(1)} kg`  // 1 casa decimal para peso individual
`${(totalWeight/1000).toFixed(1)} ton`  // Toneladas com 1 casa decimal

// Arrobas (@) - unidade de 15kg
`${(weight/15).toFixed(1)}@`  // Sempre 1 casa decimal

// Peso médio por animal
`${(totalWeight/quantity).toFixed(1)} kg/animal`
```

### Percentuais
```typescript
// Percentuais gerais
`${value.toFixed(1)}%`  // 1 casa decimal para maioria dos casos

// Percentuais financeiros críticos
`${value.toFixed(2)}%`  // 2 casas para margem, juros, etc.

// Sempre multiplicar por 100 se o valor vem como decimal
`${(value * 100).toFixed(1)}%`
```

### Métricas de Performance
```typescript
// GMD (Ganho Médio Diário)
`${gmd.toFixed(2)} kg/dia`  // Sempre 2 casas decimais

// Taxa de conversão
`${conversion.toFixed(1)}:1`  // 1 casa decimal

// Taxa de mortalidade
`${mortality.toFixed(1)}%`  // 1 casa decimal
```

## 📅 Formatação de Datas

### Padrão Brasileiro
```typescript
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Data simples
format(date, 'dd/MM/yyyy')

// Data com hora
format(date, 'dd/MM/yyyy HH:mm')

// Data relativa
formatDistanceToNow(date, { locale: ptBR, addSuffix: true })
```

## 🎨 Dimensões Visuais (Tailwind CSS)

### Hierarquia de Texto
```css
/* Títulos principais */
.title-primary: text-2xl font-bold text-gray-900

/* Subtítulos */
.title-secondary: text-lg font-semibold text-gray-800

/* Texto normal */
.text-body: text-sm font-medium text-gray-700

/* Texto secundário */
.text-muted: text-xs text-gray-500

/* Labels e badges */
.text-label: text-xs font-medium uppercase tracking-wider
```

### Espaçamentos Padrão
```css
/* Gaps entre elementos */
Mínimo: gap-2 (8px)
Padrão: gap-4 (16px)
Grande: gap-6 (24px)

/* Padding em containers */
Mobile: p-4 (16px)
Desktop: p-6 (24px)

/* Margens entre seções */
Pequena: mb-2 (8px)
Média: mb-4 (16px)
Grande: mb-6 (24px)
```

### Cards e Containers
```css
/* Card padrão */
.card: bg-white rounded-lg shadow-sm border p-4

/* Card com hover */
.card-interactive: hover:shadow-md transition-shadow cursor-pointer

/* Container de página */
.page-container: max-w-7xl mx-auto p-6
```

### Grid e Layout
```css
/* Grid responsivo padrão */
.grid-responsive: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4

/* Grid de dashboard */
.dashboard-grid: grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6

/* Layout de tabela */
.table-container: overflow-x-auto rounded-lg border
```

## 🎯 Componentes Padrão

### KPI Cards
```tsx
<Card>
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{formattedValue}</p>
        {variation && (
          <p className="text-xs text-green-600">
            +{variation.toFixed(1)}%
          </p>
        )}
      </div>
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
  </CardContent>
</Card>
```

### Badges de Status
```tsx
// Status positivo
<Badge variant="success">{value}</Badge>

// Status de alerta
<Badge variant="warning">{value}</Badge>

// Status crítico
<Badge variant="destructive">{value}</Badge>
```

### Tabelas
```tsx
// Cabeçalho
<TableHead className="text-xs font-medium uppercase">

// Célula numérica (alinhada à direita)
<TableCell className="text-right font-mono">

// Célula de texto
<TableCell className="font-medium">
```

## 🔧 Helpers Utilitários

### Função de Formatação Monetária
```typescript
export const formatCurrency = (value?: number): string => {
  const safeValue = value || 0;
  
  if (safeValue >= 1000000) {
    return `R$ ${(safeValue / 1000000).toFixed(1)}M`;
  }
  if (safeValue >= 1000) {
    return `R$ ${(safeValue / 1000).toFixed(0)}k`;
  }
  
  return `R$ ${safeValue.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2 
  })}`;
};
```

### Função de Formatação de Peso
```typescript
export const formatWeight = (weight?: number, unit: 'kg' | 'ton' | '@' = 'kg'): string => {
  const safeWeight = weight || 0;
  
  switch (unit) {
    case 'ton':
      return `${(safeWeight / 1000).toFixed(1)} ton`;
    case '@':
      return `${(safeWeight / 15).toFixed(1)}@`;
    default:
      return `${safeWeight.toFixed(1)} kg`;
  }
};
```

### Função de Formatação de Percentual
```typescript
export const formatPercentage = (value?: number, decimals: number = 1): string => {
  return `${(value || 0).toFixed(decimals)}%`;
};
```

## 📋 Checklist de Validação

### Antes de Exibir Valores
- [ ] Verificar se o valor não é `undefined` ou `null`
- [ ] Aplicar valor padrão (geralmente 0)
- [ ] Escolher formatação apropriada para o contexto
- [ ] Verificar unidade de medida correta
- [ ] Testar com valores extremos (muito grandes/pequenos)

### Para Componentes Visuais
- [ ] Usar classes Tailwind padrão do sistema
- [ ] Manter hierarquia visual consistente
- [ ] Aplicar espaçamentos uniformes
- [ ] Garantir responsividade
- [ ] Testar em modo claro e escuro

## 🚨 Erros Comuns a Evitar

1. **Não tratar valores undefined**
   ```typescript
   // ❌ Errado
   value.toFixed(2)
   
   // ✅ Correto
   (value || 0).toFixed(2)
   ```

2. **Divisão por zero**
   ```typescript
   // ❌ Errado
   total / quantity
   
   // ✅ Correto
   total / (quantity || 1)
   ```

3. **Formatação inconsistente**
   ```typescript
   // ❌ Errado - misturar padrões
   `R$ ${value.toFixed(2)}` // em um lugar
   `${value.toLocaleString('pt-BR')} R$` // em outro
   
   // ✅ Correto - usar sempre o mesmo padrão
   `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
   ```

## 📊 Tabela de Referência Rápida

| Tipo de Valor | Formatação | Exemplo |
|--------------|------------|---------|
| Moeda | `R$ ${n.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` | R$ 1.234,56 |
| Peso (kg) | `${n.toFixed(1)} kg` | 450.5 kg |
| Peso (ton) | `${(n/1000).toFixed(1)} ton` | 2.3 ton |
| Arroba | `${(n/15).toFixed(1)}@` | 30.0@ |
| Percentual | `${n.toFixed(1)}%` | 85.5% |
| GMD | `${n.toFixed(2)} kg/dia` | 1.25 kg/dia |
| Data | `format(d, 'dd/MM/yyyy')` | 28/08/2025 |
| Inteiro | `${n.toLocaleString('pt-BR')}` | 1.234 |

---

**Última atualização**: 28/08/2025
**Versão**: 1.0.0
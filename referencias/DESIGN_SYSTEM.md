# 🎨 Design System - BoviControl

## Padrão de Implementação: Design Tokens + Classes Semânticas

### 📊 KPI Cards Pattern

```tsx
// ✅ Padrão Correto
<Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
  <CardHeader className="p-3 pb-2">
    <div className="flex items-center justify-between">
      <IconComponent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      {showBadge && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
          {badgeValue}
        </Badge>
      )}
    </div>
  </CardHeader>
  <CardContent className="p-3 pt-1">
    <div className="kpi-value">{value}</div>
    <p className="kpi-label">{label}</p>
  </CardContent>
</Card>
```

### 🎯 Layout Pattern

```tsx
// Grid Container - Responsivo
<div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
  {/* KPI Cards */}
</div>

// Charts Container - Full Width
<div>
  <Tabs defaultValue="overview" className="space-y-4">
    {/* Tabs Content */}
  </Tabs>
</div>
```

### 🎨 Classes Semânticas (src/index.css)

```css
/* KPIs */
.kpi-value {
  @apply text-lg font-bold text-card-foreground;
}

.kpi-label {
  @apply text-xs font-medium uppercase tracking-wider text-muted-foreground;
}

/* Cards */
.card-title {
  @apply text-base font-semibold leading-snug text-card-foreground;
}

.card-subtitle {
  @apply text-xs font-normal leading-relaxed text-muted-foreground;
}

/* Páginas */
.page-title {
  @apply text-xl font-bold leading-tight tracking-tight text-foreground;
}

.page-subtitle {
  @apply text-sm font-normal leading-relaxed text-muted-foreground;
}

/* Tabelas */
.table-cell-important {
  @apply text-sm font-medium text-card-foreground;
}

/* Textos Corporais */
.text-body {
  @apply text-sm font-normal leading-relaxed;
}

.text-body-sm {
  @apply text-xs font-normal leading-relaxed;
}
```

### 🌙 Design Tokens (Dark Mode)

```css
:root {
  --card-foreground: 0 0% 3.9%;
  --muted-foreground: 0 0% 45.1%;
  --foreground: 0 0% 3.9%;
}

.dark {
  --card-foreground: 0 0% 98%;
  --muted-foreground: 0 0% 63.9%;
  --foreground: 0 0% 98%;
}
```

### 📱 Responsividade

- **Mobile**: `grid-cols-2` - 2 KPIs por linha
- **Tablet**: `md:grid-cols-3` - 3 KPIs por linha
- **Desktop**: `lg:grid-cols-5` - 5 KPIs por linha

### 🎭 Hover Effects

```css
.hover:shadow-md dark:hover:shadow-lg transition-all
```

### 🏷️ Badges Pattern

```tsx
<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
  {value}
</Badge>
```

### 📊 Chart Containers

```tsx
<CardTitle className="card-title">Nome do Chart</CardTitle>
<ChartContainer config={chartConfig} className="h-[300px] w-full">
  {/* Chart Component */}
</ChartContainer>
```

## 🔄 Aplicação em Novas Páginas/Abas

1. Usar classes semânticas ao invés de Tailwind inline
2. Seguir estrutura de grid responsivo
3. Aplicar hover effects nos cards
4. Usar design tokens para cores
5. Manter consistência nos badges e títulos

## 📚 Referências

- **shadcn/ui**: https://ui.shadcn.com/
- **Radix UI**: https://www.radix-ui.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Design Tokens**: https://designtokens.org/
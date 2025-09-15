# 🎨 Guia de Estilo Padronizado - Sistema BoviControl

## 📋 Estrutura Base Padronizada

Baseado na análise da página **CompleteRegistrations**, este é o padrão oficial para desenvolvimento de componentes no sistema.

---

## 🏗️ Estrutura de Componente Padrão

### 1. **Hierarquia de Títulos**

```tsx
// Título da Página
<h1 className="text-xl font-bold">Título da Página</h1>
<p className="text-sm text-muted-foreground">
  Descrição da página
</p>

// Título de Card
<CardTitle className="text-base font-medium">Título do Card</CardTitle>

// Título de Seção
<h3 className="text-sm font-medium">Título da Seção</h3>
```

### 2. **Cards de Navegação/Métricas**

```tsx
<Card className="cursor-pointer transition-all hover:shadow-md">
  <CardHeader className="p-3 pb-2">
    <div className="flex items-center justify-between">
      <div className="p-1.5 bg-blue-100 rounded w-fit">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
        {count}
      </Badge>
    </div>
  </CardHeader>
  <CardContent className="p-3 pt-1">
    <h3 className="text-sm font-medium">{title}</h3>
    <p className="text-xs text-muted-foreground mt-0.5">
      {description}
    </p>
  </CardContent>
</Card>
```

### 3. **Cards de Itens (Lista)**

```tsx
<Card className="hover:shadow-sm transition-shadow group">
  <CardHeader className="p-3 pb-2">
    <div className="flex items-start justify-between">
      {/* Avatar e Informações Principais */}
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-medium truncate">
            {name}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground truncate">
            {description}
          </CardDescription>
        </div>
      </div>

      {/* Badge e Menu de Ações */}
      <div className="flex items-center gap-1">
        <Badge className="text-[10px] px-1.5 py-0.5">
          {status}
        </Badge>
        <DropdownMenu>
          {/* Menu de ações */}
        </DropdownMenu>
      </div>
    </div>
  </CardHeader>

  <CardContent className="p-3 pt-1 space-y-1.5">
    {/* Informações Adicionais */}
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <Icon className="h-3 w-3 flex-shrink-0" />
      <span>{info}</span>
    </div>
  </CardContent>
</Card>
```

---

## 📐 Sistema de Tipografia

### **Tamanhos de Texto (Tailwind Classes)**

| Elemento | Classe | Tamanho | Uso |
|----------|--------|---------|-----|
| Micro | `text-[10px]` | 10px | Badges, labels pequenos |
| Mini | `text-[11px]` | 11px | Informações secundárias em cards |
| Pequeno | `text-xs` | 12px | Descrições, labels, texto auxiliar |
| Base | `text-sm` | 14px | Texto padrão, formulários |
| Médio | `text-base` | 16px | Títulos de cards |
| Grande | `text-lg` | 18px | Valores destacados |
| Extra Grande | `text-xl` | 20px | Títulos de página |

### **Pesos de Fonte**

| Peso | Classe | Uso |
|------|--------|-----|
| Normal | `font-normal` | Texto regular, descrições |
| Medium | `font-medium` | Títulos de seção, labels |
| Semibold | `font-semibold` | Títulos de cards (raramente usado) |
| Bold | `font-bold` | Títulos de página, valores importantes |

### **Cores de Texto**

| Tipo | Classe | Uso |
|------|--------|-----|
| Principal | `text-gray-900 dark:text-gray-100` | Títulos, texto principal |
| Secundário | `text-muted-foreground` | Descrições, texto auxiliar |
| Sucesso | `text-emerald-600` | Status positivo, valores de receita |
| Erro | `text-red-600` | Status negativo, valores de despesa |
| Aviso | `text-amber-600` | Avisos, alertas |
| Info | `text-blue-600` | Informações, links |

---

## 🎯 Padrões de Espaçamento

### **Padding de Cards**

```tsx
// Card Header
<CardHeader className="p-3 pb-2">

// Card Content
<CardContent className="p-3 pt-1">

// Card com padding zero (para tabelas)
<CardContent className="p-0">
```

### **Gaps e Espaçamentos**

```tsx
// Gap entre elementos horizontais
<div className="flex items-center gap-2">

// Gap pequeno para elementos compactos
<div className="flex items-center gap-1">

// Gap para informações secundárias
<div className="flex items-center gap-1.5">

// Espaçamento vertical em cards
<div className="space-y-1.5">
```

---

## 🎨 Padrões de Badges e Status

### **Badges de Tipo/Status**

```tsx
// Badge padrão
<Badge className="text-[10px] px-1.5 py-0.5">
  {label}
</Badge>

// Badge com cor personalizada
<Badge className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700">
  Ativo
</Badge>
```

### **Cores de Status Padronizadas**

```tsx
// Sucesso/Ativo
'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'

// Aviso/Pendente
'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200'

// Erro/Inativo
'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200'

// Info/Neutro
'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200'

// Secundário
'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
```

---

## 📝 Padrões de Formulários

### **Estrutura de Campo de Formulário**

```tsx
<div className="space-y-2">
  <Label className="text-xs font-medium">Label do Campo *</Label>
  <Input
    className="text-sm"
    placeholder="Placeholder..."
    required
  />
  <p className="text-xs text-muted-foreground">Texto de ajuda</p>
</div>
```

### **Layout de Formulário**

```tsx
// Grid para campos lado a lado
<div className="grid grid-cols-2 gap-4">
  {/* Campos */}
</div>

// Botões de ação
<div className="flex justify-end gap-2 pt-4">
  <Button variant="outline">Cancelar</Button>
  <Button>Salvar</Button>
</div>
```

---

## 🎭 Padrões de Ícones

### **Tamanhos de Ícones**

| Contexto | Classe | Tamanho |
|----------|--------|---------|
| Micro (badges) | `h-3 w-3` | 12px |
| Pequeno (info) | `h-3.5 w-3.5` | 14px |
| Padrão | `h-4 w-4` | 16px |
| Médio | `h-5 w-5` | 20px |
| Grande | `h-6 w-6` | 24px |
| Extra Grande | `h-12 w-12` | 48px |

### **Uso de Ícones**

```tsx
// Em texto informativo
<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
  <Mail className="h-3 w-3 flex-shrink-0" />
  <span>{email}</span>
</div>

// Em botões
<Button size="sm">
  <Plus className="h-4 w-4 mr-2" />
  Novo Item
</Button>
```

---

## 🔄 Estados e Transições

### **Classes de Hover**

```tsx
// Card com hover
className="hover:shadow-sm transition-shadow"

// Botão que aparece no hover
className="opacity-0 group-hover:opacity-100 transition-opacity"

// Item de lista
className="hover:bg-muted/50"
```

### **Estados de Loading**

```tsx
<div className="flex items-center gap-2 text-muted-foreground">
  <Activity className="h-4 w-4 animate-spin" />
  <span>Carregando...</span>
</div>
```

---

## 📱 Responsividade

### **Breakpoints Padrão**

```tsx
// Grid responsivo
className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"

// Flex responsivo
className="flex flex-col sm:flex-row sm:items-center"

// Visibilidade condicional
className="hidden sm:block"
```

---

## ✅ Checklist de Padronização

Ao criar um novo componente, verifique:

- [ ] **Títulos**: `text-xl font-bold` para páginas, `text-base font-medium` para cards
- [ ] **Descrições**: `text-xs text-muted-foreground` ou `text-sm text-muted-foreground`
- [ ] **Cards**: Padding `p-3`, com `pb-2` no header e `pt-1` no content
- [ ] **Badges**: `text-[10px] px-1.5 py-0.5` com cores apropriadas
- [ ] **Ícones**: `h-4 w-4` padrão, `h-3 w-3` para elementos pequenos
- [ ] **Gaps**: `gap-2` padrão, `gap-1` ou `gap-1.5` para elementos compactos
- [ ] **Formulários**: Labels com `text-xs font-medium`, inputs com `text-sm`
- [ ] **Botões**: Sempre com ícone à esquerda e `mr-2`
- [ ] **Hover**: Adicionar transições suaves com `transition-*`
- [ ] **Responsividade**: Usar grid/flex responsivo com breakpoints sm/md/lg

---

## 🚀 Exemplo de Implementação Completa

```tsx
export const StandardizedComponent: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Título da Página</h1>
          <p className="text-sm text-muted-foreground">
            Descrição contextual da página
          </p>
        </div>

        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ação
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.id} className="cursor-pointer hover:shadow-sm transition-shadow">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-blue-600" />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  {metric.change}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-lg font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Itens */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
```

---

## 📋 Migração de Classes CSS Customizadas

### **Substituições Recomendadas**

| Classe CSS Customizada | Substituir por Tailwind |
|------------------------|-------------------------|
| `.page-title` | `text-xl font-bold` |
| `.page-subtitle` | `text-sm text-muted-foreground` |
| `.card-title` | `text-base font-medium` |
| `.kpi-label` | `text-xs font-medium uppercase tracking-wider text-muted-foreground` |
| `.kpi-value` | `text-lg font-bold` |
| `.form-label` | `text-xs font-medium` |
| `.form-input` | `text-sm` |
| `.form-helper` | `text-xs text-muted-foreground` |
| `.text-body` | `text-sm` |
| `.text-body-sm` | `text-xs` |

---

## 🎯 Benefícios da Padronização

1. **Consistência Visual**: Todos os componentes seguem o mesmo padrão
2. **Manutenibilidade**: Fácil de atualizar e manter
3. **Performance**: Elimina CSS duplicado usando apenas Tailwind
4. **Acessibilidade**: Padrões testados e otimizados
5. **Responsividade**: Comportamento previsível em todos os dispositivos

---

## 📚 Referências

- Componente Base: `/src/components/Registrations/CompleteRegistrations.tsx`
- Tailwind Config: `/tailwind.config.js`
- Arquivo CSS: `/src/index.css` (migrar gradualmente para Tailwind puro)
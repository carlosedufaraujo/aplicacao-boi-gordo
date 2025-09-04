/**
 * Normalização e padronização de categorias financeiras
 */

// Mapeamento de categorias técnicas para nomes amigáveis em português
export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  // Categorias de aquisição
  'animal_purchase': 'Compra de Animais',
  'commission': 'Comissão',
  'freight': 'Frete',
  'acquisition_other': 'Outras Aquisições',
  
  // Categorias operacionais
  'feed': 'Alimentação',
  'health_costs': 'Saúde Animal',
  'operational_costs': 'Custos Operacionais',
  'deaths': 'Mortalidade',
  'weight_loss': 'Perda de Peso',
  
  // Categorias administrativas
  'general_admin': 'Administrativo Geral',
  'marketing': 'Marketing',
  'personnel': 'Pessoal',
  'admin_other': 'Outros Administrativos',
  
  // Categorias financeiras
  'interest': 'Juros',
  'fees': 'Taxas',
  'financial_management': 'Gestão Financeira',
  'financial_other': 'Outros Financeiros',
  
  // Categorias de receita
  'cattle_sales': 'Venda de Gado',
  'product_sales': 'Venda de Produtos',
  'service_income': 'Receita de Serviços',
  'other_income': 'Outras Receitas'
};

// Mapeamento reverso (de nomes amigáveis para técnicos)
export const CATEGORY_TECHNICAL_NAMES: Record<string, string> = Object.entries(CATEGORY_DISPLAY_NAMES)
  .reduce((acc, [technical, display]) => {
    acc[display] = technical;
    return acc;
  }, {} as Record<string, string>);

// Cores para cada categoria (para gráficos)
export const CATEGORY_COLORS: Record<string, string> = {
  'animal_purchase': '#10b981', // verde
  'commission': '#f59e0b', // âmbar
  'freight': '#6366f1', // índigo
  'feed': '#84cc16', // lima
  'health_costs': '#ef4444', // vermelho
  'operational_costs': '#8b5cf6', // violeta
  'deaths': '#dc2626', // vermelho escuro
  'weight_loss': '#f97316', // laranja
  'general_admin': '#64748b', // cinza
  'marketing': '#ec4899', // rosa
  'personnel': '#3b82f6', // azul
  'interest': '#a855f7', // púrpura
  'fees': '#fbbf24', // amarelo
  'cattle_sales': '#22c55e', // verde claro
  'product_sales': '#14b8a6', // teal
  'service_income': '#06b6d4', // ciano
  'other_income': '#94a3b8' // cinza claro
};

// Ícones para cada categoria (opcional, para UI)
export const CATEGORY_ICONS: Record<string, string> = {
  'animal_purchase': '🐂',
  'commission': '💰',
  'freight': '🚚',
  'feed': '🌾',
  'health_costs': '💊',
  'operational_costs': '⚙️',
  'deaths': '☠️',
  'weight_loss': '📉',
  'general_admin': '📊',
  'marketing': '📢',
  'personnel': '👥',
  'interest': '📈',
  'fees': '💳',
  'cattle_sales': '💵',
  'product_sales': '📦',
  'service_income': '🛠️',
  'other_income': '💼'
};

/**
 * Normaliza uma categoria técnica para nome de exibição
 */
export function getCategoryDisplayName(technicalName: string): string {
  if (!technicalName) return 'Sem Categoria';
  
  // Se já for um nome de exibição, retorna ele mesmo
  if (Object.values(CATEGORY_DISPLAY_NAMES).includes(technicalName)) {
    return technicalName;
  }
  
  // Tenta encontrar no mapeamento
  const displayName = CATEGORY_DISPLAY_NAMES[technicalName];
  if (displayName) return displayName;
  
  // Se não encontrar, formata o nome técnico
  return technicalName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Converte nome de exibição para nome técnico
 */
export function getCategoryTechnicalName(displayName: string): string {
  if (!displayName) return '';
  
  // Se já for um nome técnico, retorna ele mesmo
  if (CATEGORY_DISPLAY_NAMES[displayName]) {
    return displayName;
  }
  
  // Tenta encontrar no mapeamento reverso
  const technicalName = CATEGORY_TECHNICAL_NAMES[displayName];
  if (technicalName) return technicalName;
  
  // Se não encontrar, converte para snake_case
  return displayName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '');
}

/**
 * Obtém a cor de uma categoria
 */
export function getCategoryColor(category: string): string {
  const technicalName = CATEGORY_DISPLAY_NAMES[category] 
    ? category 
    : getCategoryTechnicalName(category);
    
  return CATEGORY_COLORS[technicalName] || '#94a3b8'; // cinza claro como padrão
}

/**
 * Obtém o ícone de uma categoria
 */
export function getCategoryIcon(category: string): string {
  const technicalName = CATEGORY_DISPLAY_NAMES[category] 
    ? category 
    : getCategoryTechnicalName(category);
    
  return CATEGORY_ICONS[technicalName] || '📁';
}

/**
 * Agrupa e soma valores por categoria
 */
export function groupByCategory(items: Array<{ category: string; totalAmount: number }>): Record<string, number> {
  const grouped: Record<string, number> = {};
  
  items.forEach(item => {
    const displayName = getCategoryDisplayName(item.category);
    grouped[displayName] = (grouped[displayName] || 0) + item.totalAmount;
  });
  
  return grouped;
}

/**
 * Lista todas as categorias disponíveis
 */
export function getAllCategories(type?: 'expense' | 'income'): Array<{ value: string; label: string; color: string }> {
  let categories = Object.entries(CATEGORY_DISPLAY_NAMES);
  
  if (type === 'expense') {
    categories = categories.filter(([key]) => !key.includes('sales') && !key.includes('income'));
  } else if (type === 'income') {
    categories = categories.filter(([key]) => key.includes('sales') || key.includes('income'));
  }
  
  return categories.map(([value, label]) => ({
    value,
    label,
    color: CATEGORY_COLORS[value]
  }));
}
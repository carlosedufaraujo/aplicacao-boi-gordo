/**
 * Normalização e padronização de categorias financeiras
 */

// Mapeamento de categorias técnicas para nomes amigáveis em português
export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  // Mapeamentos automáticos principais (apenas estes três por enquanto)
  'animal_purchase': 'Aquisição de Animais',
  'freight': 'Frete',
  'commission': 'Comissão',
  
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

/**
 * Normaliza uma categoria técnica para nome de exibição
 */
export function getCategoryDisplayName(technicalName: string | undefined | null): string {
  if (!technicalName) return 'Sem Categoria';
  
  // Se já for um nome de exibição, retorna ele mesmo
  if (Object.values(CATEGORY_DISPLAY_NAMES).includes(technicalName)) {
    return technicalName;
  }
  
  // Normaliza variações conhecidas
  const normalizedInput = technicalName.toLowerCase().replace(/[\s_-]+/g, '_');
  
  // Mapeamento de variações para categorias padrão
  const variations: Record<string, string> = {
    'compra_gado': 'animal_purchase',
    'compra_animais': 'animal_purchase',
    'transporte': 'freight',
    'frete': 'freight',
    'comissao': 'commission',
    'comissão': 'commission',
  };
  
  // Verifica se é uma variação conhecida
  const standardKey = variations[normalizedInput] || normalizedInput;
  
  // Tenta encontrar no mapeamento
  const displayName = CATEGORY_DISPLAY_NAMES[standardKey];
  if (displayName) return displayName;
  
  // Tenta com o nome original também
  if (CATEGORY_DISPLAY_NAMES[technicalName]) {
    return CATEGORY_DISPLAY_NAMES[technicalName];
  }
  
  // Se não encontrar, formata o nome técnico
  return technicalName
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Obtém a cor de uma categoria
 */
export function getCategoryColor(category: string | undefined | null): string {
  if (!category) return '#94a3b8'; // cinza claro como padrão
  
  // Normaliza a categoria para buscar a cor
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
  
  return CATEGORY_COLORS[normalizedCategory] || 
         CATEGORY_COLORS[category] || 
         '#94a3b8'; // cinza claro como padrão
}

/**
 * Agrupa e soma valores por categoria, já com nomes normalizados
 */
export function groupByCategory(
  items: Array<{ category?: string | null; totalAmount: number }>
): Record<string, { total: number; color: string }> {
  const grouped: Record<string, { total: number; color: string }> = {};
  
  items.forEach(item => {
    const displayName = getCategoryDisplayName(item.category);
    if (!grouped[displayName]) {
      grouped[displayName] = {
        total: 0,
        color: getCategoryColor(item.category)
      };
    }
    grouped[displayName].total += item.totalAmount;
  });
  
  return grouped;
}
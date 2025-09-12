/**
 * Normalização e padronização de categorias financeiras
 */

// Mapeamento de categorias técnicas para nomes amigáveis em português
export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  // === CATEGORIAS PADRÃO DO SISTEMA ===
  // Compras e Vendas de Gado
  'cat-exp-01': 'Compra de Gado',
  'cat-exp-02': 'Frete de Gado',
  'cat-exp-03': 'Comissão de Compra',
  
  // Alimentação e Nutrição
  'cat-exp-04': 'Ração',
  'cat-exp-05': 'Suplementos',
  'cat-exp-06': 'Sal Mineral',
  'cat-exp-07': 'Silagem',
  
  // Saúde Animal
  'cat-exp-08': 'Vacinas',
  'cat-exp-09': 'Medicamentos',
  'cat-exp-10': 'Veterinário',
  'cat-exp-11': 'Exames Laboratoriais',
  
  // Infraestrutura
  'cat-exp-12': 'Manutenção de Currais',
  'cat-exp-13': 'Manutenção de Cercas',
  'cat-exp-14': 'Construções',
  'cat-exp-15': 'Equipamentos',
  
  // Operacional
  'cat-exp-16': 'Combustível',
  'cat-exp-17': 'Energia Elétrica',
  'cat-exp-18': 'Água',
  'cat-exp-19': 'Telefone/Internet',
  
  // Pessoal
  'cat-exp-20': 'Salários',
  'cat-exp-21': 'Encargos Trabalhistas',
  'cat-exp-22': 'Benefícios',
  'cat-exp-23': 'Treinamento',
  
  // Administrativo
  'cat-exp-24': 'Material de Escritório',
  'cat-exp-25': 'Contabilidade',
  'cat-exp-26': 'Impostos e Taxas',
  'cat-exp-27': 'Seguros',
  
  // Outros Gastos
  'cat-exp-28': 'Despesas Bancárias',
  'cat-exp-29': 'Juros e Multas',
  'cat-exp-30': 'Outras Despesas',
  
  // === RECEITAS ===
  // Vendas
  'cat-inc-01': 'Venda de Gado Gordo',
  'cat-inc-02': 'Venda de Bezerros',
  'cat-inc-03': 'Venda de Matrizes',
  'cat-inc-04': 'Venda de Reprodutores',
  
  // Serviços
  'cat-inc-05': 'Arrendamento de Pasto',
  'cat-inc-06': 'Aluguel de Curral',
  'cat-inc-07': 'Prestação de Serviços',
  
  // Subprodutos
  'cat-inc-08': 'Venda de Esterco',
  'cat-inc-09': 'Venda de Couro',
  
  // Financeiro
  'cat-inc-10': 'Rendimentos Financeiros',
  'cat-inc-11': 'Juros Recebidos',
  'cat-inc-12': 'Dividendos',
  
  // Outros
  'cat-inc-13': 'Indenizações',
  'cat-inc-14': 'Prêmios e Bonificações',
  'cat-inc-15': 'Outras Receitas',

  // === CATEGORIAS OPERACIONAIS (para compatibilidade com sistema de despesas) ===
  // Mapeamentos automáticos principais 
  'animal_purchase': 'Aquisição de Animais',
  'freight': 'Frete',
  'commission': 'Comissão',
  
  // Categorias operacionais
  'feed': 'Alimentação',
  'health_costs': 'Saúde Animal',
  'operational_costs': 'Custos Operacionais',
  'deaths': 'Mortalidade',
  'weight_loss': 'Perda de Peso',
  
  // Categorias financeiras
  'interest': 'Juros',
  'fees': 'Taxas',
  'financial_management': 'Gestão Financeira',
  'financial_other': 'Outros Financeiros',

  // === MAPEAMENTO NUMÉRICO (sistema de despesas) ===
  '1': 'Compra de Gado',
  '2': 'Frete de Gado',
  '3': 'Comissão de Compra',
  '4': 'Ração',
  '5': 'Suplementos',
  '6': 'Sal Mineral',
  '7': 'Silagem',
  '8': 'Vacinas',
  '9': 'Medicamentos',
  '10': 'Veterinário',
  '11': 'Exames Laboratoriais',
  '12': 'Manutenção de Currais',
  '13': 'Manutenção de Cercas',
  '14': 'Construções',
  '15': 'Equipamentos',
  '16': 'Combustível',
  '17': 'Energia Elétrica',
  '18': 'Água',
  '19': 'Telefone/Internet',
  '20': 'Salários',
  '21': 'Encargos Trabalhistas',
  '22': 'Benefícios',
  '23': 'Treinamento',
  '24': 'Material de Escritório',
  '25': 'Contabilidade',
  '26': 'Impostos e Taxas',
  '27': 'Seguros',
  '28': 'Despesas Bancárias',
  '29': 'Juros e Multas',
  '30': 'Outras Despesas',
  
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
 * Normaliza uma categoria para o formato padrão
 */
export function normalizeCategory(category: string | undefined | null): string {
  if (!category) return 'other';
  
  // Normaliza variações conhecidas
  const normalizedInput = category.toLowerCase().replace(/[\s_-]+/g, '_');
  
  // Mapeamento de variações para categorias padrão
  const variations: Record<string, string> = {
    'compra_gado': 'animal_purchase',
    'compra_animais': 'animal_purchase',
    'aquisição_de_animais': 'animal_purchase',
    'aquisicao_de_animais': 'animal_purchase',
    'transporte': 'freight',
    'frete': 'freight',
    'comissao': 'commission',
    'comissão': 'commission',
    'mortalidade': 'deaths',
    'mortes': 'deaths',
    'alimentacao': 'feed',
    'alimentação': 'feed',
    'racao': 'feed',
    'ração': 'feed',
    'medicamentos': 'health_costs',
    'saude': 'health_costs',
    'saúde': 'health_costs',
    'veterinario': 'health_costs',
    'veterinário': 'health_costs',
  };
  
  // Verifica se é uma variação conhecida
  const standardKey = variations[normalizedInput] || normalizedInput;
  
  // Verifica se a categoria padrão existe no mapeamento
  if (CATEGORY_DISPLAY_NAMES[standardKey]) {
    return standardKey;
  }
  
  // Retorna a categoria normalizada ou 'other' se não for reconhecida
  return standardKey || 'other';
}

/**
 * Normaliza uma categoria técnica para nome de exibição
 */
export function getCategoryDisplayName(technicalName: string | undefined | null, categories?: Array<{id: string, name: string}>): string {
  if (!technicalName) return 'Sem Categoria';
  
  // Se já for um nome de exibição, retorna ele mesmo
  if (Object.values(CATEGORY_DISPLAY_NAMES).includes(technicalName)) {
    return technicalName;
  }
  
  // Se tiver uma lista de categorias disponível, busca nela primeiro (para categorias customizadas)
  if (categories && Array.isArray(categories)) {
    const foundCategory = categories.find(cat => cat.id === technicalName);
    if (foundCategory) {
      return foundCategory.name;
    }
  }
  
  // Primeiro verifica se é um ID padrão direto (cat-exp-01, cat-inc-01, etc.)
  const directMapping = CATEGORY_DISPLAY_NAMES[technicalName];
  if (directMapping) return directMapping;
  
  // Depois tenta normalizar e buscar
  const normalizedCategory = normalizeCategory(technicalName);
  const displayName = CATEGORY_DISPLAY_NAMES[normalizedCategory];
  if (displayName) return displayName;
  
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
/**
 * Sistema de Categorização Contábil
 * Mapeia categorias operacionais para grupos contábeis do DRE
 */

export interface AccountingGroup {
  id: string;
  name: string;
  type: 'REVENUE' | 'EXPENSE';
  order: number;
  categories: string[];
  description?: string;
}

// Grupos contábeis padronizados para DRE
export const ACCOUNTING_GROUPS: AccountingGroup[] = [
  // ========== RECEITAS ==========
  {
    id: 'operational_revenue',
    name: 'Receita Operacional Bruta',
    type: 'REVENUE',
    order: 1,
    categories: [
      'cattle_sales', 'product_sales',
      // Categorias do cash-flow em português
      'Venda de Gado Gordo', 'Venda de Bezerros', 'Venda de Matrizes', 
      'Venda de Reprodutores', 'Venda de Esterco', 'Venda de Couro'
    ],
    description: 'Vendas de gado e produtos relacionados'
  },
  {
    id: 'other_revenue',
    name: 'Outras Receitas',
    type: 'REVENUE',
    order: 2,
    categories: [
      'service_income', 'other_income',
      // Categorias do cash-flow em português
      'Arrendamento de Pasto', 'Aluguel de Curral', 'Prestação de Serviços',
      'Rendimentos Financeiros', 'Juros Recebidos', 'Dividendos',
      'Indenizações', 'Prêmios e Bonificações', 'Outras Receitas'
    ],
    description: 'Receitas não operacionais'
  },
  
  // ========== CUSTOS ==========
  {
    id: 'acquisition_costs',
    name: 'Aquisição de Animais',
    type: 'EXPENSE',
    order: 3,
    categories: [
      'animal_purchase', 'cattle_purchase',
      // Categorias do cash-flow em português
      'Compra de Gado', 'Aquisição de Animais', 'Compra de Bezerros', 'Compra de Matrizes', 'Compra de Reprodutores'
    ],
    description: 'Custos diretos com compra de animais'
  },
  {
    id: 'logistics_costs',
    name: 'Custos Logísticos',
    type: 'EXPENSE',
    order: 4,
    categories: [
      'freight', 'transport', 'logistics',
      // Categorias do cash-flow em português
      'Frete de Gado', 'Frete', 'Transporte', 'Logística'
    ],
    description: 'Custos com transporte e logística'
  },
  {
    id: 'commission_costs',
    name: 'Comissões',
    type: 'EXPENSE',
    order: 5,
    categories: [
      'commission', 'broker_fee',
      // Categorias do cash-flow em português
      'Comissão de Compra', 'Comissão', 'Comissões', 'Taxa de Corretagem'
    ],
    description: 'Comissões pagas na compra de animais'
  },
  
  // ========== DESPESAS OPERACIONAIS ==========
  {
    id: 'production_expenses',
    name: 'Despesas de Produção',
    type: 'EXPENSE',
    order: 6,
    categories: [
      'feed', 'health_costs', 'operational_costs',
      // Categorias do cash-flow em português
      'Ração', 'Suplementos', 'Sal Mineral', 'Silagem',
      'Vacinas', 'Medicamentos', 'Veterinário', 'Exames Laboratoriais',
      'Manutenção de Currais', 'Manutenção de Cercas', 'Construções',
      'Equipamentos', 'Combustível', 'Energia Elétrica', 'Água'
    ],
    description: 'Custos diretos de manutenção do rebanho'
  },
  {
    id: 'operational_losses',
    name: 'Perdas Operacionais',
    type: 'EXPENSE',
    order: 7,
    categories: [
      'deaths', 'weight_loss', 'mortality',
      // Categorias do cash-flow em português
      'Perdas Operacionais (Mortalidade)', 'Mortalidade', 'Perdas', 'Morte de Animais'
    ],
    description: 'Perdas por mortalidade e quebra de peso'
  },
  
  // ========== DESPESAS ADMINISTRATIVAS ==========
  {
    id: 'admin_expenses',
    name: 'Despesas Administrativas',
    type: 'EXPENSE',
    order: 8,
    categories: [
      'general_admin', 'personnel', 'marketing', 'admin_other',
      // Categorias do cash-flow em português
      'Salários', 'Encargos Trabalhistas', 'Benefícios', 'Treinamento',
      'Material de Escritório', 'Contabilidade', 'Telefone/Internet',
      'Seguros', 'Outras Despesas', 'Retirada Particular', 'Ajustes Mercado Futuro',
      'Pagamento Sicoob'
    ],
    description: 'Custos administrativos e de pessoal'
  },
  
  // ========== DESPESAS FINANCEIRAS ==========
  {
    id: 'financial_expenses',
    name: 'Despesas Financeiras',
    type: 'EXPENSE',
    order: 9,
    categories: [
      'interest', 'fees', 'financial_management', 'financial_other',
      // Categorias do cash-flow em português
      'Despesas Bancárias', 'Juros e Multas', 'Impostos e Taxas', 'Empréstimos Risco Sacado',
      'Fee de Crédito'
    ],
    description: 'Juros, taxas e custos financeiros'
  }
];

/**
 * Mapeia uma categoria operacional para seu grupo contábil
 */
export function getAccountingGroup(category: string): AccountingGroup | undefined {
  const group = ACCOUNTING_GROUPS.find(group => 
    group.categories.includes(category)
  );
  
  console.log('🏷️ [getAccountingGroup] Mapping category:', category, '→', group?.name || 'NOT FOUND');
  
  return group;
}

/**
 * Agrupa valores por grupo contábil
 */
export function groupByAccountingCategory(
  items: Array<{ category: string; totalAmount: number }>
): Record<string, { 
  group: AccountingGroup; 
  total: number; 
  items: Array<{ category: string; amount: number }> 
}> {
  const grouped: Record<string, any> = {};
  
  items.forEach(item => {
    const group = getAccountingGroup(item.category);
    if (!group) {
      // Categoria não mapeada vai para "Outros"
      const defaultGroup = item.totalAmount > 0 ? 'other_revenue' : 'admin_expenses';
      if (!grouped[defaultGroup]) {
        const defGroup = ACCOUNTING_GROUPS.find(g => g.id === defaultGroup)!;
        grouped[defaultGroup] = {
          group: defGroup,
          total: 0,
          items: []
        };
      }
      grouped[defaultGroup].total += Math.abs(item.totalAmount);
      grouped[defaultGroup].items.push({
        category: item.category,
        amount: Math.abs(item.totalAmount)
      });
    } else {
      if (!grouped[group.id]) {
        grouped[group.id] = {
          group,
          total: 0,
          items: []
        };
      }
      grouped[group.id].total += Math.abs(item.totalAmount);
      grouped[group.id].items.push({
        category: item.category,
        amount: Math.abs(item.totalAmount)
      });
    }
  });
  
  return grouped;
}

/**
 * Calcula totais e margens do DRE
 */
export interface DRECalculation {
  // Receitas
  receitaBruta: number;
  outrasReceitas: number;
  receitaTotal: number;
  
  // Custos
  custoAquisicao: number;
  custoLogistica: number;
  custoComissao: number;
  custoTotalAquisicao: number;
  
  // Resultado Bruto
  resultadoBruto: number;
  margemBruta: number;
  
  // Despesas Operacionais
  despesasProducao: number;
  perdasOperacionais: number;
  despesasAdministrativas: number;
  totalDespesasOperacionais: number;
  
  // Resultado Operacional
  resultadoOperacional: number;
  margemOperacional: number;
  
  // Despesas Financeiras
  despesasFinanceiras: number;
  
  // Resultado Líquido
  resultadoLiquido: number;
  margemLiquida: number;
}

export function calculateDRE(
  groupedData: ReturnType<typeof groupByAccountingCategory>
): DRECalculation {
  // Receitas
  const receitaBruta = groupedData['operational_revenue']?.total || 0;
  const outrasReceitas = groupedData['other_revenue']?.total || 0;
  const receitaTotal = receitaBruta + outrasReceitas;
  
  // Custos de Aquisição
  const custoAquisicao = groupedData['acquisition_costs']?.total || 0;
  const custoLogistica = groupedData['logistics_costs']?.total || 0;
  const custoComissao = groupedData['commission_costs']?.total || 0;
  const custoTotalAquisicao = custoAquisicao + custoLogistica + custoComissao;
  
  // Resultado Bruto
  const resultadoBruto = receitaBruta - custoTotalAquisicao;
  const margemBruta = receitaBruta > 0 ? (resultadoBruto / receitaBruta) * 100 : 0;
  
  // Despesas Operacionais
  const despesasProducao = groupedData['production_expenses']?.total || 0;
  const perdasOperacionais = groupedData['operational_losses']?.total || 0;
  const despesasAdministrativas = groupedData['admin_expenses']?.total || 0;
  const totalDespesasOperacionais = despesasProducao + perdasOperacionais + despesasAdministrativas;
  
  // Resultado Operacional
  const resultadoOperacional = resultadoBruto - totalDespesasOperacionais;
  const margemOperacional = receitaBruta > 0 ? (resultadoOperacional / receitaBruta) * 100 : 0;
  
  // Despesas Financeiras
  const despesasFinanceiras = groupedData['financial_expenses']?.total || 0;
  
  // Resultado Líquido
  const resultadoLiquido = resultadoOperacional - despesasFinanceiras + outrasReceitas;
  const margemLiquida = receitaTotal > 0 ? (resultadoLiquido / receitaTotal) * 100 : 0;
  
  return {
    receitaBruta,
    outrasReceitas,
    receitaTotal,
    custoAquisicao,
    custoLogistica,
    custoComissao,
    custoTotalAquisicao,
    resultadoBruto,
    margemBruta,
    despesasProducao,
    perdasOperacionais,
    despesasAdministrativas,
    totalDespesasOperacionais,
    resultadoOperacional,
    margemOperacional,
    despesasFinanceiras,
    resultadoLiquido,
    margemLiquida
  };
}
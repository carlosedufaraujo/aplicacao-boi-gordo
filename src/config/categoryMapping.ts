// Mapeamento de categorias do sistema para o fluxo de caixa estruturado
export interface CategoryMapping {
  structuredName: string;
  section: 'OPERACIONAL' | 'FINANCIAMENTO' | 'INVESTIMENTO';
  subsection?: 'ENTRADAS' | 'SAIDAS';
  categoryNames: string[]; // Nomes das categorias do sistema que mapeiam para esta categoria estruturada
  categoryCodes?: string[]; // Códigos alternativos
}

export const categoryMappings: CategoryMapping[] = [
  // ATIVIDADES OPERACIONAIS - ENTRADAS
  {
    structuredName: 'Vendas de gado',
    section: 'OPERACIONAL',
    subsection: 'ENTRADAS',
    categoryNames: ['Venda de Gado', 'Venda de Animais', 'Venda de Boi', 'Venda'],
    categoryCodes: ['cattle_sale', 'animal_sale']
  },
  {
    structuredName: 'Outras receitas',
    section: 'OPERACIONAL',
    subsection: 'ENTRADAS',
    categoryNames: ['Outras Receitas', 'Receitas Diversas', 'Outras Entradas', 'Ajustes Mercado Futuro'],
    categoryCodes: ['other_income', 'misc_income']
  },

  // ATIVIDADES OPERACIONAIS - SAÍDAS
  {
    structuredName: 'Compra de animais',
    section: 'OPERACIONAL',
    subsection: 'SAIDAS',
    categoryNames: ['Compra de Animais', 'Compra de Gado', 'Aquisição de Animais', 'Compra'],
    categoryCodes: ['animal_purchase', 'cattle_purchase']
  },
  {
    structuredName: 'Alimentação',
    section: 'OPERACIONAL',
    subsection: 'SAIDAS',
    categoryNames: ['Alimentação', 'Ração', 'Nutrição', 'Suplementos', 'Sal Mineral'],
    categoryCodes: ['feed', 'nutrition']
  },
  {
    structuredName: 'Medicamentos e vacinas',
    section: 'OPERACIONAL',
    subsection: 'SAIDAS',
    categoryNames: ['Saúde Animal', 'Sanidade', 'Medicamentos', 'Vacinas', 'Veterinário'],
    categoryCodes: ['health_costs', 'animal_health', 'veterinary']
  },
  {
    structuredName: 'Mão de obra',
    section: 'OPERACIONAL',
    subsection: 'SAIDAS',
    categoryNames: ['Mão de Obra', 'Salários', 'Funcionários', 'Pessoal', 'Folha de Pagamento'],
    categoryCodes: ['labor', 'payroll', 'employees']
  },
  {
    structuredName: 'Energia e combustível',
    section: 'OPERACIONAL',
    subsection: 'SAIDAS',
    categoryNames: ['Energia', 'Combustível', 'Energia Elétrica', 'Diesel', 'Gasolina'],
    categoryCodes: ['energy', 'fuel', 'utilities']
  },
  {
    structuredName: 'Manutenção',
    section: 'OPERACIONAL',
    subsection: 'SAIDAS',
    categoryNames: ['Manutenção', 'Reparos', 'Conservação', 'Manutenção de Equipamentos'],
    categoryCodes: ['maintenance', 'repairs']
  },
  {
    structuredName: 'Frete',
    section: 'OPERACIONAL',
    subsection: 'SAIDAS',
    categoryNames: ['Frete', 'Transporte', 'Logística', 'Frete de Animais'],
    categoryCodes: ['freight', 'transport', 'logistics']
  },
  {
    structuredName: 'Comissão',
    section: 'OPERACIONAL',
    subsection: 'SAIDAS',
    categoryNames: ['Comissão', 'Comissões', 'Comissão de Venda', 'Comissão de Compra'],
    categoryCodes: ['commission', 'commissions']
  },
  {
    structuredName: 'Impostos e taxas',
    section: 'OPERACIONAL',
    subsection: 'SAIDAS',
    categoryNames: ['Impostos', 'Taxas', 'Tributos', 'ICMS', 'FUNRURAL'],
    categoryCodes: ['taxes', 'tax', 'tributes']
  },
  {
    structuredName: 'Outras despesas',
    section: 'OPERACIONAL',
    subsection: 'SAIDAS',
    categoryNames: ['Outras Despesas', 'Despesas Diversas', 'Despesas Gerais', 'Outros'],
    categoryCodes: ['other_expenses', 'misc_expenses', 'general_expenses']
  },

  // ATIVIDADES DE FINANCIAMENTO
  {
    structuredName: 'Empréstimos tomados',
    section: 'FINANCIAMENTO',
    categoryNames: ['Empréstimo', 'Empréstimos', 'Financiamento', 'Captação'],
    categoryCodes: ['loan', 'financing']
  },
  {
    structuredName: 'Pagamento de empréstimos',
    section: 'FINANCIAMENTO',
    categoryNames: ['Pagamento Empréstimo', 'Amortização', 'Pagamento de Financiamento'],
    categoryCodes: ['loan_payment', 'amortization']
  },
  {
    structuredName: 'Juros pagos',
    section: 'FINANCIAMENTO',
    categoryNames: ['Juros', 'Juros de Empréstimo', 'Encargos Financeiros'],
    categoryCodes: ['interest', 'financial_charges']
  },

  // ATIVIDADES DE INVESTIMENTO
  {
    structuredName: 'Compra de equipamentos',
    section: 'INVESTIMENTO',
    categoryNames: ['Equipamentos', 'Máquinas', 'Ferramentas', 'Veículos'],
    categoryCodes: ['equipment', 'machinery', 'vehicles']
  },
  {
    structuredName: 'Melhorias em instalações',
    section: 'INVESTIMENTO',
    categoryNames: ['Infraestrutura', 'Instalações', 'Construções', 'Benfeitorias', 'Reforma'],
    categoryCodes: ['infrastructure', 'facilities', 'construction']
  }
];

// Função para mapear uma categoria do sistema para uma categoria estruturada
export function mapCategoryToStructured(categoryName: string): CategoryMapping | undefined {
  const normalizedName = categoryName.toLowerCase().trim();

  return categoryMappings.find(mapping => {
    // Verifica por nome exato
    const nameMatch = mapping.categoryNames.some(name =>
      name.toLowerCase() === normalizedName
    );
    if (nameMatch) return true;

    // Verifica por código se disponível
    if (mapping.categoryCodes) {
      const codeMatch = mapping.categoryCodes.some(code =>
        code.toLowerCase() === normalizedName
      );
      if (codeMatch) return true;
    }

    // Verifica por correspondência parcial
    const partialMatch = mapping.categoryNames.some(name =>
      normalizedName.includes(name.toLowerCase()) ||
      name.toLowerCase().includes(normalizedName)
    );

    return partialMatch;
  });
}

// Função para obter todas as categorias de uma seção
export function getCategoriesBySection(section: 'OPERACIONAL' | 'FINANCIAMENTO' | 'INVESTIMENTO'): CategoryMapping[] {
  return categoryMappings.filter(m => m.section === section);
}

// Função para obter categorias por subseção
export function getCategoriesBySubsection(subsection: 'ENTRADAS' | 'SAIDAS'): CategoryMapping[] {
  return categoryMappings.filter(m => m.subsection === subsection);
}
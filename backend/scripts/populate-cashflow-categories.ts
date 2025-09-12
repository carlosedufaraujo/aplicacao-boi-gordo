import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategoryMapping {
  keywords: string[];
  categoryId: string;
  categoryName: string;
}

const expenseCategoryMappings: CategoryMapping[] = [
  // Compras e Vendas de Gado
  { keywords: ['compra', 'gado', 'boi', 'bezerro', 'novilho', 'aquisição'], categoryId: 'cat-exp-01', categoryName: 'Compra de Gado' },
  { keywords: ['frete', 'transporte', 'caminhão'], categoryId: 'cat-exp-02', categoryName: 'Frete de Gado' },
  { keywords: ['comissão', 'corretor', 'intermediação'], categoryId: 'cat-exp-03', categoryName: 'Comissão de Compra' },
  
  // Alimentação e Nutrição
  { keywords: ['ração', 'alimentação', 'nutrição'], categoryId: 'cat-exp-04', categoryName: 'Ração' },
  { keywords: ['suplemento', 'vitamina', 'mineral'], categoryId: 'cat-exp-05', categoryName: 'Suplementos' },
  { keywords: ['sal'], categoryId: 'cat-exp-06', categoryName: 'Sal Mineral' },
  { keywords: ['silagem', 'ensilagem'], categoryId: 'cat-exp-07', categoryName: 'Silagem' },
  
  // Saúde Animal
  { keywords: ['vacina', 'vacinação', 'imunização'], categoryId: 'cat-exp-08', categoryName: 'Vacinas' },
  { keywords: ['medicamento', 'remédio', 'antibiótico'], categoryId: 'cat-exp-09', categoryName: 'Medicamentos' },
  { keywords: ['veterinário', 'veterinária'], categoryId: 'cat-exp-10', categoryName: 'Veterinário' },
  { keywords: ['exame', 'laboratório', 'análise'], categoryId: 'cat-exp-11', categoryName: 'Exames Laboratoriais' },
  
  // Infraestrutura
  { keywords: ['curral', 'manutenção curral'], categoryId: 'cat-exp-12', categoryName: 'Manutenção de Currais' },
  { keywords: ['cerca', 'arame', 'mourão'], categoryId: 'cat-exp-13', categoryName: 'Manutenção de Cercas' },
  { keywords: ['construção', 'obra', 'reforma'], categoryId: 'cat-exp-14', categoryName: 'Construções' },
  { keywords: ['equipamento', 'máquina', 'ferramenta'], categoryId: 'cat-exp-15', categoryName: 'Equipamentos' },
  
  // Operacional
  { keywords: ['combustível', 'diesel', 'gasolina', 'álcool'], categoryId: 'cat-exp-16', categoryName: 'Combustível' },
  { keywords: ['energia', 'luz', 'elétrica'], categoryId: 'cat-exp-17', categoryName: 'Energia Elétrica' },
  { keywords: ['água'], categoryId: 'cat-exp-18', categoryName: 'Água' },
  { keywords: ['telefone', 'internet', 'comunicação'], categoryId: 'cat-exp-19', categoryName: 'Telefone/Internet' },
  
  // Pessoal
  { keywords: ['salário', 'pagamento', 'funcionário'], categoryId: 'cat-exp-20', categoryName: 'Salários' },
  { keywords: ['inss', 'fgts', 'encargo'], categoryId: 'cat-exp-21', categoryName: 'Encargos Trabalhistas' },
  { keywords: ['benefício', 'vale', 'auxílio'], categoryId: 'cat-exp-22', categoryName: 'Benefícios' },
  { keywords: ['treinamento', 'curso', 'capacitação'], categoryId: 'cat-exp-23', categoryName: 'Treinamento' },
  
  // Administrativo
  { keywords: ['material', 'escritório', 'papelaria'], categoryId: 'cat-exp-24', categoryName: 'Material de Escritório' },
  { keywords: ['contabilidade', 'contador', 'contábil'], categoryId: 'cat-exp-25', categoryName: 'Contabilidade' },
  { keywords: ['imposto', 'taxa', 'tributo'], categoryId: 'cat-exp-26', categoryName: 'Impostos e Taxas' },
  { keywords: ['seguro', 'apólice'], categoryId: 'cat-exp-27', categoryName: 'Seguros' },
  
  // Financeiro
  { keywords: ['banco', 'tarifa', 'bancária'], categoryId: 'cat-exp-28', categoryName: 'Despesas Bancárias' },
  { keywords: ['juros', 'multa'], categoryId: 'cat-exp-29', categoryName: 'Juros e Multas' },
];

const incomeCategoryMappings: CategoryMapping[] = [
  // Vendas
  { keywords: ['venda', 'gado gordo', 'boi gordo'], categoryId: 'cat-inc-01', categoryName: 'Venda de Gado Gordo' },
  { keywords: ['bezerro', 'desmama'], categoryId: 'cat-inc-02', categoryName: 'Venda de Bezerros' },
  { keywords: ['matriz', 'vaca'], categoryId: 'cat-inc-03', categoryName: 'Venda de Matrizes' },
  { keywords: ['reprodutor', 'touro'], categoryId: 'cat-inc-04', categoryName: 'Venda de Reprodutores' },
  
  // Serviços
  { keywords: ['arrendamento', 'aluguel pasto'], categoryId: 'cat-inc-05', categoryName: 'Arrendamento de Pasto' },
  { keywords: ['aluguel curral'], categoryId: 'cat-inc-06', categoryName: 'Aluguel de Curral' },
  { keywords: ['serviço', 'prestação'], categoryId: 'cat-inc-07', categoryName: 'Prestação de Serviços' },
  
  // Subprodutos
  { keywords: ['esterco', 'adubo'], categoryId: 'cat-inc-08', categoryName: 'Venda de Esterco' },
  { keywords: ['couro'], categoryId: 'cat-inc-09', categoryName: 'Venda de Couro' },
  
  // Financeiro
  { keywords: ['rendimento', 'aplicação'], categoryId: 'cat-inc-10', categoryName: 'Rendimentos Financeiros' },
  { keywords: ['juros recebidos'], categoryId: 'cat-inc-11', categoryName: 'Juros Recebidos' },
  { keywords: ['dividendo'], categoryId: 'cat-inc-12', categoryName: 'Dividendos' },
  
  // Outros
  { keywords: ['indenização', 'ressarcimento'], categoryId: 'cat-inc-13', categoryName: 'Indenizações' },
  { keywords: ['prêmio', 'bonificação'], categoryId: 'cat-inc-14', categoryName: 'Prêmios e Bonificações' },
];

function findBestCategory(description: string, type: 'INCOME' | 'EXPENSE'): { id: string; name: string } | null {
  const mappings = type === 'EXPENSE' ? expenseCategoryMappings : incomeCategoryMappings;
  const descLower = description.toLowerCase();
  
  // Procura a melhor correspondência
  for (const mapping of mappings) {
    for (const keyword of mapping.keywords) {
      if (descLower.includes(keyword.toLowerCase())) {
        return { id: mapping.categoryId, name: mapping.categoryName };
      }
    }
  }
  
  // Categoria padrão se não encontrar correspondência
  if (type === 'EXPENSE') {
    return { id: 'cat-exp-30', name: 'Outras Despesas' };
  } else {
    return { id: 'cat-inc-15', name: 'Outras Receitas' };
  }
}

async function populateCategories() {
  try {
    console.log('🔍 Buscando movimentações sem categoria...');
    
    // Busca todas as movimentações sem categoria mapeada
    const cashFlows = await prisma.cashFlow.findMany({
      where: {
        OR: [
          { categoryId: '' },
          { categoryId: 'uncategorized' }
        ]
      }
    });
    
    console.log(`📊 Encontradas ${cashFlows.length} movimentações sem categoria`);
    
    if (cashFlows.length === 0) {
      console.log('✅ Todas as movimentações já possuem categoria!');
      return;
    }
    
    let updatedCount = 0;
    const updates = [];
    
    for (const cashFlow of cashFlows) {
      const category = findBestCategory(cashFlow.description, cashFlow.type as 'INCOME' | 'EXPENSE');
      
      if (category) {
        updates.push(
          prisma.cashFlow.update({
            where: { id: cashFlow.id },
            data: { categoryId: category.id }
          })
        );
        
        console.log(`✓ ${cashFlow.description} → ${category.name}`);
        updatedCount++;
      }
    }
    
    // Executa todas as atualizações em batch
    if (updates.length > 0) {
      console.log('\n🔄 Atualizando banco de dados...');
      await prisma.$transaction(updates);
      console.log(`\n✅ ${updatedCount} movimentações atualizadas com sucesso!`);
    }
    
    // Mostra estatísticas
    const stats = await prisma.cashFlow.groupBy({
      by: ['categoryId', 'type'],
      _count: true,
      orderBy: {
        _count: {
          categoryId: 'desc'
        }
      }
    });
    
    console.log('\n📊 Estatísticas de categorias:');
    console.log('\nDESPESAS:');
    stats.filter(s => s.type === 'EXPENSE').forEach(stat => {
      const categoryName = [...expenseCategoryMappings, ...incomeCategoryMappings]
        .find(c => c.categoryId === stat.categoryId)?.categoryName || stat.categoryId;
      console.log(`  ${categoryName}: ${stat._count} movimentações`);
    });
    
    console.log('\nRECEITAS:');
    stats.filter(s => s.type === 'INCOME').forEach(stat => {
      const categoryName = [...expenseCategoryMappings, ...incomeCategoryMappings]
        .find(c => c.categoryId === stat.categoryId)?.categoryName || stat.categoryId;
      console.log(`  ${categoryName}: ${stat._count} movimentações`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao popular categorias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o script
populateCategories();
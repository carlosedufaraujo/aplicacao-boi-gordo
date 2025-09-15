const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Categorias padrão do sistema
const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'cat-exp-01', name: 'Compra de Gado', type: 'EXPENSE', color: '#8B4513' },
  { id: 'cat-exp-02', name: 'Frete de Gado', type: 'EXPENSE', color: '#D2691E' },
  { id: 'cat-exp-03', name: 'Comissão de Compra', type: 'EXPENSE', color: '#CD853F' },
  { id: 'cat-exp-04', name: 'Ração', type: 'EXPENSE', color: '#228B22' },
  { id: 'cat-exp-05', name: 'Suplementos', type: 'EXPENSE', color: '#32CD32' },
  { id: 'cat-exp-06', name: 'Sal Mineral', type: 'EXPENSE', color: '#00FF00' },
  { id: 'cat-exp-07', name: 'Silagem', type: 'EXPENSE', color: '#7FFF00' },
  { id: 'cat-exp-08', name: 'Vacinas', type: 'EXPENSE', color: '#FF1493' },
  { id: 'cat-exp-09', name: 'Medicamentos', type: 'EXPENSE', color: '#FF69B4' },
  { id: 'cat-exp-10', name: 'Veterinário', type: 'EXPENSE', color: '#FFB6C1' },
  { id: 'cat-exp-11', name: 'Exames Laboratoriais', type: 'EXPENSE', color: '#FFC0CB' },
  { id: 'cat-exp-12', name: 'Manutenção de Currais', type: 'EXPENSE', color: '#708090' },
  { id: 'cat-exp-13', name: 'Manutenção de Cercas', type: 'EXPENSE', color: '#778899' },
  { id: 'cat-exp-14', name: 'Construções', type: 'EXPENSE', color: '#696969' },
  { id: 'cat-exp-15', name: 'Equipamentos', type: 'EXPENSE', color: '#A9A9A9' },
  { id: 'cat-exp-16', name: 'Combustível', type: 'EXPENSE', color: '#FF4500' },
  { id: 'cat-exp-17', name: 'Energia Elétrica', type: 'EXPENSE', color: '#FFD700' },
  { id: 'cat-exp-18', name: 'Água', type: 'EXPENSE', color: '#00CED1' },
  { id: 'cat-exp-19', name: 'Telefone/Internet', type: 'EXPENSE', color: '#4169E1' },
  { id: 'cat-exp-20', name: 'Salários', type: 'EXPENSE', color: '#4B0082' },
  { id: 'cat-exp-21', name: 'Encargos Trabalhistas', type: 'EXPENSE', color: '#8B008B' },
  { id: 'cat-exp-22', name: 'Benefícios', type: 'EXPENSE', color: '#9400D3' },
  { id: 'cat-exp-23', name: 'Treinamento', type: 'EXPENSE', color: '#9932CC' },
  { id: 'cat-exp-24', name: 'Material de Escritório', type: 'EXPENSE', color: '#B22222' },
  { id: 'cat-exp-25', name: 'Contabilidade', type: 'EXPENSE', color: '#DC143C' },
  { id: 'cat-exp-26', name: 'Impostos e Taxas', type: 'EXPENSE', color: '#FF0000' },
  { id: 'cat-exp-27', name: 'Seguros', type: 'EXPENSE', color: '#8B0000' },
  { id: 'cat-exp-28', name: 'Despesas Bancárias', type: 'EXPENSE', color: '#000080' },
  { id: 'cat-exp-29', name: 'Juros e Multas', type: 'EXPENSE', color: '#191970' },
  { id: 'cat-exp-30', name: 'Outras Despesas', type: 'EXPENSE', color: '#483D8B' }
];

const DEFAULT_INCOME_CATEGORIES = [
  { id: 'cat-inc-01', name: 'Venda de Gado Gordo', type: 'INCOME', color: '#006400' },
  { id: 'cat-inc-02', name: 'Venda de Bezerros', type: 'INCOME', color: '#228B22' },
  { id: 'cat-inc-03', name: 'Venda de Matrizes', type: 'INCOME', color: '#008000' },
  { id: 'cat-inc-04', name: 'Venda de Reprodutores', type: 'INCOME', color: '#32CD32' },
  { id: 'cat-inc-05', name: 'Arrendamento de Pasto', type: 'INCOME', color: '#00FF00' },
  { id: 'cat-inc-06', name: 'Aluguel de Curral', type: 'INCOME', color: '#7FFF00' },
  { id: 'cat-inc-07', name: 'Prestação de Serviços', type: 'INCOME', color: '#ADFF2F' },
  { id: 'cat-inc-08', name: 'Venda de Esterco', type: 'INCOME', color: '#8B4513' },
  { id: 'cat-inc-09', name: 'Venda de Couro', type: 'INCOME', color: '#A0522D' },
  { id: 'cat-inc-10', name: 'Rendimentos Financeiros', type: 'INCOME', color: '#FFD700' },
  { id: 'cat-inc-11', name: 'Juros Recebidos', type: 'INCOME', color: '#FFA500' },
  { id: 'cat-inc-12', name: 'Dividendos', type: 'INCOME', color: '#FF8C00' },
  { id: 'cat-inc-13', name: 'Indenizações', type: 'INCOME', color: '#4169E1' },
  { id: 'cat-inc-14', name: 'Prêmios e Bonificações', type: 'INCOME', color: '#1E90FF' },
  { id: 'cat-inc-15', name: 'Outras Receitas', type: 'INCOME', color: '#00BFFF' }
];

async function migrateCategories() {
  console.log('🚀 Iniciando migração de categorias...\n');

  try {
    // Buscar categorias existentes
    const existingCategories = await prisma.category.findMany();
    const existingByName = new Map(existingCategories.map(c => [c.name.toLowerCase(), c]));

    console.log(`📊 Categorias existentes no banco: ${existingCategories.length}`);

    // Combinar todas as categorias padrão
    const allDefaultCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];

    let created = 0;
    let skipped = 0;
    let updated = 0;

    // Processar cada categoria padrão
    for (const category of allDefaultCategories) {
      const existing = existingByName.get(category.name.toLowerCase());

      if (existing) {
        // Atualizar se necessário (garantir que tem ID padrão e está marcada como default)
        if (!existing.isDefault || existing.id !== category.id) {
          await prisma.category.update({
            where: { id: existing.id },
            data: {
              isDefault: true,
              color: category.color,
              icon: category.icon
            }
          });
          console.log(`✅ Atualizada: ${category.name}`);
          updated++;
        } else {
          console.log(`⏭️  Pulada (já existe): ${category.name}`);
          skipped++;
        }
      } else {
        // Criar nova categoria
        await prisma.category.create({
          data: {
            id: category.id,
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon,
            isDefault: true,
            isActive: true
          }
        });
        console.log(`✨ Criada: ${category.name} (${category.type})`);
        created++;
      }
    }

    console.log('\n📈 Resumo da migração:');
    console.log(`  - Categorias criadas: ${created}`);
    console.log(`  - Categorias atualizadas: ${updated}`);
    console.log(`  - Categorias puladas: ${skipped}`);

    // Verificar categorias customizadas
    const customCategories = await prisma.category.findMany({
      where: { isDefault: false }
    });

    if (customCategories.length > 0) {
      console.log(`\n🎨 Categorias customizadas preservadas: ${customCategories.length}`);
      customCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.type})`);
      });
    }

    // Total final
    const finalCount = await prisma.category.count();
    console.log(`\n✅ Migração concluída! Total de categorias no banco: ${finalCount}`);

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateCategories();
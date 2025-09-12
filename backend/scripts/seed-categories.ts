import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  // DESPESAS
  { id: 'cat-exp-01', name: 'Compra de Gado', type: 'EXPENSE', color: '#8B4513', isDefault: true },
  { id: 'cat-exp-02', name: 'Frete de Gado', type: 'EXPENSE', color: '#D2691E', isDefault: true },
  { id: 'cat-exp-03', name: 'Comissão de Compra', type: 'EXPENSE', color: '#CD853F', isDefault: true },
  { id: 'cat-exp-04', name: 'Ração', type: 'EXPENSE', color: '#228B22', isDefault: true },
  { id: 'cat-exp-05', name: 'Suplementos', type: 'EXPENSE', color: '#32CD32', isDefault: true },
  { id: 'cat-exp-06', name: 'Sal Mineral', type: 'EXPENSE', color: '#00FF00', isDefault: true },
  { id: 'cat-exp-07', name: 'Silagem', type: 'EXPENSE', color: '#7FFF00', isDefault: true },
  { id: 'cat-exp-08', name: 'Vacinas', type: 'EXPENSE', color: '#FF1493', isDefault: true },
  { id: 'cat-exp-09', name: 'Medicamentos', type: 'EXPENSE', color: '#FF69B4', isDefault: true },
  { id: 'cat-exp-10', name: 'Veterinário', type: 'EXPENSE', color: '#FFB6C1', isDefault: true },
  { id: 'cat-exp-11', name: 'Exames Laboratoriais', type: 'EXPENSE', color: '#FFC0CB', isDefault: true },
  { id: 'cat-exp-12', name: 'Manutenção de Currais', type: 'EXPENSE', color: '#708090', isDefault: true },
  { id: 'cat-exp-13', name: 'Manutenção de Cercas', type: 'EXPENSE', color: '#778899', isDefault: true },
  { id: 'cat-exp-14', name: 'Construções', type: 'EXPENSE', color: '#696969', isDefault: true },
  { id: 'cat-exp-15', name: 'Equipamentos', type: 'EXPENSE', color: '#A9A9A9', isDefault: true },
  { id: 'cat-exp-16', name: 'Combustível', type: 'EXPENSE', color: '#FF4500', isDefault: true },
  { id: 'cat-exp-17', name: 'Energia Elétrica', type: 'EXPENSE', color: '#FFD700', isDefault: true },
  { id: 'cat-exp-18', name: 'Água', type: 'EXPENSE', color: '#00CED1', isDefault: true },
  { id: 'cat-exp-19', name: 'Telefone/Internet', type: 'EXPENSE', color: '#4169E1', isDefault: true },
  { id: 'cat-exp-20', name: 'Salários', type: 'EXPENSE', color: '#4B0082', isDefault: true },
  { id: 'cat-exp-21', name: 'Encargos Trabalhistas', type: 'EXPENSE', color: '#8B008B', isDefault: true },
  { id: 'cat-exp-22', name: 'Benefícios', type: 'EXPENSE', color: '#9400D3', isDefault: true },
  { id: 'cat-exp-23', name: 'Treinamento', type: 'EXPENSE', color: '#9932CC', isDefault: true },
  { id: 'cat-exp-24', name: 'Material de Escritório', type: 'EXPENSE', color: '#B22222', isDefault: true },
  { id: 'cat-exp-25', name: 'Contabilidade', type: 'EXPENSE', color: '#DC143C', isDefault: true },
  { id: 'cat-exp-26', name: 'Impostos e Taxas', type: 'EXPENSE', color: '#FF0000', isDefault: true },
  { id: 'cat-exp-27', name: 'Seguros', type: 'EXPENSE', color: '#8B0000', isDefault: true },
  { id: 'cat-exp-28', name: 'Despesas Bancárias', type: 'EXPENSE', color: '#000080', isDefault: true },
  { id: 'cat-exp-29', name: 'Juros e Multas', type: 'EXPENSE', color: '#191970', isDefault: true },
  { id: 'cat-exp-30', name: 'Outras Despesas', type: 'EXPENSE', color: '#483D8B', isDefault: true },
  
  // RECEITAS
  { id: 'cat-inc-01', name: 'Venda de Gado Gordo', type: 'INCOME', color: '#006400', isDefault: true },
  { id: 'cat-inc-02', name: 'Venda de Bezerros', type: 'INCOME', color: '#228B22', isDefault: true },
  { id: 'cat-inc-03', name: 'Venda de Matrizes', type: 'INCOME', color: '#008000', isDefault: true },
  { id: 'cat-inc-04', name: 'Venda de Reprodutores', type: 'INCOME', color: '#32CD32', isDefault: true },
  { id: 'cat-inc-05', name: 'Arrendamento de Pasto', type: 'INCOME', color: '#00FF00', isDefault: true },
  { id: 'cat-inc-06', name: 'Aluguel de Curral', type: 'INCOME', color: '#7FFF00', isDefault: true },
  { id: 'cat-inc-07', name: 'Prestação de Serviços', type: 'INCOME', color: '#ADFF2F', isDefault: true },
  { id: 'cat-inc-08', name: 'Venda de Esterco', type: 'INCOME', color: '#8B4513', isDefault: true },
  { id: 'cat-inc-09', name: 'Venda de Couro', type: 'INCOME', color: '#A0522D', isDefault: true },
  { id: 'cat-inc-10', name: 'Rendimentos Financeiros', type: 'INCOME', color: '#FFD700', isDefault: true },
  { id: 'cat-inc-11', name: 'Juros Recebidos', type: 'INCOME', color: '#FFA500', isDefault: true },
  { id: 'cat-inc-12', name: 'Dividendos', type: 'INCOME', color: '#FF8C00', isDefault: true },
  { id: 'cat-inc-13', name: 'Indenizações', type: 'INCOME', color: '#4169E1', isDefault: true },
  { id: 'cat-inc-14', name: 'Prêmios e Bonificações', type: 'INCOME', color: '#1E90FF', isDefault: true },
  { id: 'cat-inc-15', name: 'Outras Receitas', type: 'INCOME', color: '#00BFFF', isDefault: true },
];

async function seedCategories() {
  console.log('🌱 Iniciando seed de categorias...');
  
  try {
    // Primeiro, criar a tabela de categorias sem a foreign key
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        color TEXT,
        icon TEXT,
        "isDefault" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('✅ Tabela de categorias criada/verificada');
    
    // Inserir categorias padrão
    for (const category of defaultCategories) {
      try {
        await prisma.category.upsert({
          where: { id: category.id },
          update: {},
          create: category as any
        });
        console.log(`✅ Categoria ${category.name} criada/atualizada`);
      } catch (error) {
        console.log(`⚠️ Erro ao criar categoria ${category.name}:`, error);
      }
    }
    
    // Atualizar CashFlows órfãos para usar categoria padrão
    console.log('\n🔄 Atualizando CashFlows órfãos...');
    
    // Atualizar despesas sem categoria válida
    const expenseUpdated = await prisma.$executeRaw`
      UPDATE cash_flows 
      SET "categoryId" = 'cat-exp-30' 
      WHERE type = 'EXPENSE' 
      AND "categoryId" NOT IN (SELECT id FROM categories)
    `;
    
    console.log(`✅ ${expenseUpdated} despesas atualizadas para categoria padrão`);
    
    // Atualizar receitas sem categoria válida
    const incomeUpdated = await prisma.$executeRaw`
      UPDATE cash_flows 
      SET "categoryId" = 'cat-inc-15' 
      WHERE type = 'INCOME' 
      AND "categoryId" NOT IN (SELECT id FROM categories)
    `;
    
    console.log(`✅ ${incomeUpdated} receitas atualizadas para categoria padrão`);
    
    // Agora adicionar a foreign key se não existir
    console.log('\n🔗 Adicionando foreign key...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE cash_flows 
        ADD CONSTRAINT cash_flows_categoryId_fkey 
        FOREIGN KEY ("categoryId") 
        REFERENCES categories(id)
      `;
      console.log('✅ Foreign key adicionada com sucesso');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Foreign key já existe');
      } else {
        throw error;
      }
    }
    
    // Estatísticas finais
    const totalCategories = await prisma.category.count();
    const totalCashFlows = await prisma.cashFlow.count();
    const orphanCashFlows = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM cash_flows 
      WHERE "categoryId" NOT IN (SELECT id FROM categories)
    `;
    
    console.log('\n📊 Estatísticas:');
    console.log(`- Total de categorias: ${totalCategories}`);
    console.log(`- Total de movimentações: ${totalCashFlows}`);
    console.log(`- Movimentações órfãs: ${(orphanCashFlows as any)[0].count}`);
    
    console.log('\n✅ Seed de categorias concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories().catch(console.error);
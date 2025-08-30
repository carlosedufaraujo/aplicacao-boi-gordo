const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCostCenters() {
  try {
    // Buscar centros de custo
    const costCenters = await prisma.costCenter.findMany({
      include: {
        parent: true,
        children: true,
      },
    });

    console.log('🏢 CENTROS DE CUSTO CADASTRADOS:');
    console.log('================================');
    
    if (costCenters.length === 0) {
      console.log('❌ Nenhum centro de custo cadastrado');
      console.log('\n📝 Criando centros de custo padrão...\n');
      
      // Criar centros de custo padrão com os valores corretos do enum
      const centrosDefault = [
        { code: 'CC001', name: 'Aquisição - Compra de Gado', type: 'ACQUISITION' },
        { code: 'CC002', name: 'Engorda - Alimentação', type: 'FATTENING' },
        { code: 'CC003', name: 'Engorda - Sanidade', type: 'FATTENING' },
        { code: 'CC004', name: 'Aquisição - Transporte', type: 'ACQUISITION' },
        { code: 'CC005', name: 'Engorda - Mão de Obra', type: 'FATTENING' },
        { code: 'CC006', name: 'Aquisição - Comissões', type: 'ACQUISITION' },
        { code: 'CC007', name: 'Administrativo - Geral', type: 'ADMINISTRATIVE' },
        { code: 'CC008', name: 'Engorda - Manutenção', type: 'FATTENING' },
        { code: 'CC009', name: 'Receita - Vendas', type: 'REVENUE' },
        { code: 'CC010', name: 'Financeiro - Taxas e Juros', type: 'FINANCIAL' },
      ];

      for (const centro of centrosDefault) {
        const created = await prisma.costCenter.create({
          data: centro,
        });
        console.log(`✅ Criado: ${created.code} - ${created.name} (${created.type})`);
      }
      
      console.log('\n✨ Centros de custo padrão criados com sucesso!');
      
    } else {
      costCenters.forEach(cc => {
        console.log(`${cc.code} - ${cc.name}`);
        console.log(`  Tipo: ${cc.type}`);
        console.log(`  ID: ${cc.id}`);
        console.log(`  Ativo: ${cc.isActive}`);
        if (cc.parent) {
          console.log(`  Centro Pai: ${cc.parent.name}`);
        }
        console.log('---');
      });
    }

    // Buscar despesas recentes
    console.log('\n💰 DESPESAS RECENTES (últimas 5):');
    console.log('==================================');
    
    const expenses = await prisma.expense.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        costCenter: true,
      },
    });

    expenses.forEach(exp => {
      console.log(`${exp.description}`);
      console.log(`  Valor: R$ ${exp.totalAmount.toFixed(2)}`);
      console.log(`  Categoria: ${exp.category}`);
      console.log(`  Centro de Custo: ${exp.costCenter ? exp.costCenter.name : '❌ SEM CENTRO DE CUSTO'}`);
      console.log(`  Vencimento: ${new Date(exp.dueDate).toLocaleDateString('pt-BR')}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCostCenters();
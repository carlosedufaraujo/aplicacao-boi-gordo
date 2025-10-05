import { prisma } from '../src/config/database';

async function checkRevenues() {
  try {
    // Verificar todas as receitas
    const revenues = await prisma.revenue.findMany({
      include: {
        saleRecord: true
      }
    });

    console.log('📊 Total de receitas no banco:', revenues.length);
    console.log('\nDetalhes das receitas:');

    revenues.forEach(rev => {
      console.log(`\n- ID: ${rev.id}`);
      console.log(`  Descrição: ${rev.description}`);
      console.log(`  Valor: R$ ${rev.totalAmount.toFixed(2)}`);
      console.log(`  Categoria: ${rev.category}`);
      console.log(`  Data Vencimento: ${rev.dueDate.toLocaleDateString('pt-BR')}`);
      console.log(`  Recebido: ${rev.isReceived ? 'Sim' : 'Não'}`);
      console.log(`  Venda ID: ${rev.saleRecordId || 'N/A'}`);
      console.log(`  User ID: ${rev.userId}`);
    });

    // Verificar vendas sem receitas
    const salesWithoutRevenue = await prisma.saleRecord.findMany({
      where: {
        revenues: {
          none: {}
        }
      }
    });

    console.log(`\n⚠️  Vendas sem receitas: ${salesWithoutRevenue.length}`);

    // Verificar conteúdo da tabela revenues
    const revenueCount = await prisma.revenue.count();
    console.log(`\n📈 Total de registros na tabela revenues: ${revenueCount}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRevenues();
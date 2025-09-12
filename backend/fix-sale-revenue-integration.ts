import { prisma } from './src/config/database';

async function createRevenuesFromSales() {
  console.log('🔄 Criando receitas para vendas existentes...');
  
  try {
    // Buscar todas as vendas que não têm receitas associadas
    const sales = await prisma.saleRecord.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'DELIVERED', 'PAID', 'COMPLETED']
        }
      }
    });
    
    console.log(`📊 Encontradas ${sales.length} vendas`);
    
    for (const sale of sales) {
      // Verificar se já existe receita para esta venda
      const existingRevenue = await prisma.revenue.findFirst({
        where: {
          saleRecordId: sale.id
        }
      });
      
      if (!existingRevenue) {
        // Criar receita
        const revenue = await prisma.revenue.create({
          data: {
            category: 'cattle_sale',
            description: `Venda de Gado - ${sale.quantity} cabeças`,
            totalAmount: sale.totalValue || sale.netValue,
            dueDate: sale.paymentDate || sale.saleDate,
            receiptDate: sale.status === 'PAID' ? sale.paymentDate : null,
            isReceived: sale.status === 'PAID',
            saleRecordId: sale.id,
            buyerId: sale.buyerId,
            payerAccountId: sale.receiverAccountId,
            userId: sale.userId || '0c2621f4-456a-4a45-9a39-cb2230290ec9',
            notes: sale.observations
          }
        });
        
        console.log(`✅ Receita criada para venda ${sale.id}`);
      } else {
        console.log(`⚠️ Venda ${sale.id} já possui receita`);
      }
    }
    
    console.log('✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRevenuesFromSales();
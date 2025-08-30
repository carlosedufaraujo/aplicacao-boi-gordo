const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateFreightData() {
  try {
    console.log('📦 Atualizando dados de frete nas ordens de compra...\n');
    
    // Buscar todas as ordens
    const orders = await prisma.purchaseOrder.findMany();
    
    for (const order of orders) {
      // Adicionar dados de frete de exemplo
      const updateData = {
        freightDistance: 250 + Math.floor(Math.random() * 500), // 250-750 km
        freightCostPerKm: 3.5 + Math.random() * 2, // R$ 3.50 - 5.50 por km
        transportCompany: ['Transportadora Silva', 'Rodovias Express', 'TransBoi Ltda', 'Frete Rápido'][Math.floor(Math.random() * 4)],
        freightPaymentType: Math.random() > 0.5 ? 'cash' : 'installment',
        freightDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      };
      
      // Recalcular freightCost baseado na distância e custo por km
      updateData.freightCost = updateData.freightDistance * updateData.freightCostPerKm;
      
      await prisma.purchaseOrder.update({
        where: { id: order.id },
        data: updateData
      });
      
      console.log(`✅ Ordem ${order.orderNumber} atualizada:`);
      console.log(`   - Transportadora: ${updateData.transportCompany}`);
      console.log(`   - Distância: ${updateData.freightDistance} km`);
      console.log(`   - Custo/km: R$ ${updateData.freightCostPerKm.toFixed(2)}`);
      console.log(`   - Total Frete: R$ ${updateData.freightCost.toFixed(2)}`);
      console.log(`   - Pagamento: ${updateData.freightPaymentType === 'cash' ? 'À Vista' : 'A Prazo'}\n`);
    }
    
    console.log('🚀 Dados de frete atualizados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateFreightData();
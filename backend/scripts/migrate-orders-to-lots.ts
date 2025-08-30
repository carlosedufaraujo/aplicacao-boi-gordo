import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateOrdersToLots() {
  console.log('🔄 Iniciando migração de ordens para lotes...');
  
  try {
    // Buscar todas as ordens que não têm lote
    const ordersWithoutLots = await prisma.purchaseOrder.findMany({
      where: {
        lot: null
      },
      include: {
        vendor: true
      }
    });
    
    console.log(`📋 Encontradas ${ordersWithoutLots.length} ordens sem lotes`);
    
    for (const order of ordersWithoutLots) {
      console.log(`\n🔧 Processando ordem ${order.orderNumber}...`);
      
      // Gerar número do lote baseado no número da ordem
      const lotNumber = `LOT-${order.orderNumber.replace('PO-', '')}`;
      
      // Calcular custos iniciais
      const acquisitionCost = order.totalValue || 0;
      const freightCost = order.freightCost || 0;
      const otherCosts = order.otherCosts || 0;
      const totalInitialCost = acquisitionCost + freightCost + otherCosts;
      
      try {
        // Criar o lote
        const lot = await prisma.cattleLot.create({
          data: {
            lotNumber,
            purchaseOrderId: order.id,
            entryDate: order.purchaseDate || new Date(),
            entryWeight: order.actualWeight || order.totalWeight || 0,
            entryQuantity: order.actualCount || order.animalCount || 0,
            currentQuantity: order.actualCount || order.animalCount || 0,
            acquisitionCost,
            healthCost: 0,
            feedCost: 0,
            operationalCost: 0,
            freightCost,
            otherCosts,
            totalCost: totalInitialCost,
            deathCount: order.transportMortality || 0,
            status: 'ACTIVE'
          }
        });
        
        console.log(`✅ Lote ${lotNumber} criado com sucesso`);
        console.log(`   - Quantidade: ${lot.entryQuantity} animais`);
        console.log(`   - Peso total: ${lot.entryWeight} kg`);
        console.log(`   - Custo total: R$ ${totalInitialCost.toFixed(2)}`);
        
      } catch (error) {
        console.error(`❌ Erro ao criar lote para ordem ${order.orderNumber}:`, error);
      }
    }
    
    // Verificar resultado final
    const totalOrders = await prisma.purchaseOrder.count();
    const ordersWithLots = await prisma.purchaseOrder.count({
      where: {
        lot: {
          isNot: null
        }
      }
    });
    
    console.log('\n📊 Resultado da migração:');
    console.log(`   - Total de ordens: ${totalOrders}`);
    console.log(`   - Ordens com lotes: ${ordersWithLots}`);
    console.log(`   - Ordens sem lotes: ${totalOrders - ordersWithLots}`);
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateOrdersToLots()
  .then(() => {
    console.log('\n✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migração falhou:', error);
    process.exit(1);
  });
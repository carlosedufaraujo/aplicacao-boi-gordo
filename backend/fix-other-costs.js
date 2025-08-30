const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOtherCosts() {
  try {
    console.log('🔧 Corrigindo otherCosts nos lotes e ordens...\n');
    
    // 1. Atualizar CattleLot - zerar otherCosts pois não é usado
    const lotsUpdated = await prisma.cattleLot.updateMany({
      where: {
        otherCosts: {
          gt: 0
        }
      },
      data: {
        otherCosts: 0
      }
    });
    
    console.log('✅ Lotes com otherCosts zerados:', lotsUpdated.count);
    
    // 2. Atualizar PurchaseOrder - zerar otherCosts também
    const ordersUpdated = await prisma.purchaseOrder.updateMany({
      where: {
        otherCosts: {
          gt: 0
        }
      },
      data: {
        otherCosts: 0
      }
    });
    
    console.log('✅ Ordens com otherCosts zerados:', ordersUpdated.count);
    
    // 3. Recalcular totalCost dos lotes
    const lots = await prisma.cattleLot.findMany();
    
    console.log('\n📊 Recalculando totalCost dos lotes:\n');
    
    for (const lot of lots) {
      const totalCost = (lot.acquisitionCost || 0) + 
                       (lot.freightCost || 0) + 
                       (lot.healthCost || 0) + 
                       (lot.feedCost || 0) + 
                       (lot.operationalCost || 0); // operationalCost é a comissão
      
      await prisma.cattleLot.update({
        where: { id: lot.id },
        data: { totalCost }
      });
      
      console.log(`  ✓ Lote ${lot.lotNumber}:`);
      console.log(`    - Custo Aquisição: R$ ${(lot.acquisitionCost || 0).toFixed(2)}`);
      console.log(`    - Frete: R$ ${(lot.freightCost || 0).toFixed(2)}`);
      console.log(`    - Comissão: R$ ${(lot.operationalCost || 0).toFixed(2)}`);
      console.log(`    - Total Recalculado: R$ ${totalCost.toFixed(2)}\n`);
    }
    
    console.log('✅ Todos os custos foram corrigidos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir custos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOtherCosts();
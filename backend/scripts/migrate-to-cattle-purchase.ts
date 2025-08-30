import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToCattlePurchase() {
  console.log('🚀 Iniciando migração para CattlePurchase...\n');
  
  try {
    // 1. Buscar todas as ordens e lotes existentes
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        lot: true,
        vendor: true,
        broker: true,
        payerAccount: true,
      }
    });

    console.log(`📦 Encontradas ${orders.length} ordens de compra para migrar\n`);

    for (const order of orders) {
      const lot = order.lot;
      
      console.log(`\n📋 Migrando ordem ${order.orderNumber}...`);
      
      // Verificar se já existe
      let cattlePurchase = await prisma.cattlePurchase.findUnique({
        where: { purchaseCode: order.orderNumber }
      });
      
      if (cattlePurchase) {
        console.log(`   ⏭️  Já existe, pulando...`);
        continue;
      }
      
      // Criar novo CattlePurchase
      cattlePurchase = await prisma.cattlePurchase.create({
        data: {
          // Códigos de identificação
          purchaseCode: order.orderNumber,
          lotCode: lot?.lotNumber || `LOT-${order.orderNumber}`,
          
          // Relacionamentos
          vendorId: order.vendorId,
          brokerId: order.brokerId,
          transportCompanyId: order.transportCompanyId,
          payerAccountId: order.payerAccountId,
          userId: order.userId,
          
          // Localização e data
          location: order.location,
          purchaseDate: order.purchaseDate,
          receivedDate: order.receptionDate || lot?.entryDate,
          
          // Informações dos animais
          animalType: order.animalType,
          animalAge: order.averageAge,
          initialQuantity: order.animalCount,
          currentQuantity: lot?.currentQuantity || order.animalCount,
          deathCount: lot?.deathCount || 0,
          
          // Pesos
          purchaseWeight: order.totalWeight,
          receivedWeight: order.actualWeight || lot?.entryWeight,
          currentWeight: lot?.entryWeight, // Será calculado futuramente com GMD
          averageWeight: order.averageWeight,
          weightBreakPercentage: order.weightBreakPercentage,
          
          // Valores e rendimento
          carcassYield: order.carcassYield || 50,
          pricePerArroba: order.pricePerArroba,
          purchaseValue: order.totalValue || ((order.totalWeight * (order.carcassYield || 50) / 100) / 15 * order.pricePerArroba),
          
          // Custos
          freightCost: order.freightCost || lot?.freightCost || 0,
          freightDistance: order.freightDistance,
          freightCostPerKm: order.freightCostPerKm,
          commission: order.commission || 0,
          healthCost: lot?.healthCost || 0,
          feedCost: lot?.feedCost || 0,
          operationalCost: lot?.operationalCost || 0,
          totalCost: lot?.totalCost || order.totalValue || 0,
          
          // Informações de pagamento
          paymentType: order.paymentType,
          paymentTerms: order.paymentTerms,
          principalDueDate: order.principalDueDate,
          commissionPaymentType: order.commissionPaymentType,
          commissionDueDate: order.commissionDueDate,
          freightPaymentType: order.freightPaymentType,
          freightDueDate: order.freightDueDate,
          
          // GMD e projeções
          expectedGMD: lot?.expectedGMD,
          targetWeight: lot?.targetWeight,
          estimatedSlaughterDate: lot?.estimatedSlaughterDate,
          
          // Status e controle
          status: mapStatus(order.status, lot?.status),
          stage: order.currentStage,
          notes: order.notes || lot?.notes,
          
          // Mortalidade no transporte
          transportMortality: order.transportMortality || 0,
        }
      });
      
      console.log(`✅ CattlePurchase criado: ${cattlePurchase.purchaseCode} / ${cattlePurchase.lotCode}`);
      
      // 2. Migrar relacionamentos se o lote existir
      if (lot) {
        console.log(`   🔄 Migrando relacionamentos do lote ${lot.lotNumber}...`);
        
        // Atualizar LotPenLink
        await prisma.lotPenLink.updateMany({
          where: { lotId: lot.id },
          data: { purchaseId: cattlePurchase.id }
        });
        
        // Atualizar HealthRecord
        await prisma.healthRecord.updateMany({
          where: { lotId: lot.id },
          data: { purchaseId: cattlePurchase.id }
        });
        
        // Atualizar LotMovement
        await prisma.lotMovement.updateMany({
          where: { lotId: lot.id },
          data: { purchaseId: cattlePurchase.id }
        });
        
        // Atualizar WeightReading
        await prisma.weightReading.updateMany({
          where: { lotId: lot.id },
          data: { purchaseId: cattlePurchase.id }
        });
        
        // Atualizar SaleRecord
        await prisma.saleRecord.updateMany({
          where: { lotId: lot.id },
          data: { purchaseId: cattlePurchase.id }
        });
        
        // Atualizar Expense
        await prisma.expense.updateMany({
          where: { lotId: lot.id },
          data: { purchaseId: cattlePurchase.id }
        });
        
        // Atualizar CostProportionalAllocation
        await prisma.costProportionalAllocation.updateMany({
          where: { lotId: lot.id },
          data: { purchaseId: cattlePurchase.id }
        });
        
        // Atualizar NonCashExpense
        await prisma.nonCashExpense.updateMany({
          where: { lotId: lot.id },
          data: { purchaseId: cattlePurchase.id }
        });
        
        console.log(`   ✅ Relacionamentos migrados`);
      }
      
      // 3. Atualizar FinancialAccount (relacionado à order)
      await prisma.financialAccount.updateMany({
        where: { purchaseOrderId: order.id },
        data: { purchaseId: cattlePurchase.id }
      });
    }
    
    console.log('\n✨ Migração concluída com sucesso!');
    console.log(`📊 Total de ${orders.length} compras migradas para CattlePurchase`);
    
    // Verificar resultado
    const totalPurchases = await prisma.cattlePurchase.count();
    console.log(`\n📈 Total de CattlePurchases no banco: ${totalPurchases}`);
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function mapStatus(orderStatus: string | null, lotStatus: string | null): any {
  // Se tem lote e está ativo
  if (lotStatus === 'ACTIVE') return 'ACTIVE';
  if (lotStatus === 'SOLD') return 'SOLD';
  
  // Baseado no status da ordem
  if (orderStatus === 'PENDING') return 'CONFIRMED';
  if (orderStatus === 'RECEIVED') return 'RECEIVED';
  if (orderStatus === 'ACTIVE') return 'ACTIVE';
  if (orderStatus === 'CANCELLED') return 'CANCELLED';
  
  // Default
  return 'NEGOTIATING';
}

// Executar migração
migrateToCattlePurchase()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
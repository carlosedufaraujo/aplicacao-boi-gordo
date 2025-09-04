import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLot2509001() {
  console.log('🔧 Corrigindo despesa faltante do LOT-2509001...\n');
  
  try {
    // Buscar a compra do LOT-2509001
    const purchase = await prisma.cattlePurchase.findFirst({
      where: { lotCode: 'LOT-2509001' }
    });
    
    if (!purchase) {
      console.log('❌ Compra LOT-2509001 não encontrada');
      return;
    }
    
    // Verificar se já existe a despesa principal
    const existingExpense = await prisma.expense.findFirst({
      where: {
        purchaseId: purchase.id,
        category: 'animal_purchase'
      }
    });
    
    if (existingExpense) {
      console.log('✓ Despesa principal já existe para LOT-2509001');
      return;
    }
    
    // Criar a despesa principal
    const expense = await prisma.expense.create({
      data: {
        category: 'animal_purchase',
        description: `Compra de gado - Lote ${purchase.lotCode}`,
        totalAmount: purchase.purchaseValue,
        dueDate: purchase.purchaseDate,
        impactsCashFlow: true,
        purchaseId: purchase.id,
        vendorId: purchase.vendorId,
        payerAccountId: purchase.payerAccountId,
        notes: `Compra de ${purchase.initialQuantity} animais - ${purchase.purchaseWeight}kg total`,
        userId: purchase.userId,
        isPaid: false
      }
    });
    
    console.log(`✅ Despesa criada: ${expense.description} - R$ ${expense.totalAmount.toFixed(2)}`);
    
    // Verificar total final
    const totalExpenses = await prisma.expense.aggregate({
      _sum: { totalAmount: true },
      where: { category: { in: ['animal_purchase', 'freight', 'commission'] } }
    });
    
    console.log(`\n💰 Total em despesas agora: R$ ${totalExpenses._sum.totalAmount?.toFixed(2) || '0.00'}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLot2509001();
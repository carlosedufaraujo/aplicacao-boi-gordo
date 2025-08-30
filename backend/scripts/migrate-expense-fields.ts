import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExpenseFields() {
  console.log('🔄 Migrando campos de Expense...');
  
  try {
    // 1. Contar registros que têm purchaseOrderId mas não purchaseId
    const expensesWithOldField = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count 
      FROM expenses 
      WHERE "purchaseOrderId" IS NOT NULL 
      AND "purchaseId" IS NULL
    `;
    
    console.log(`📊 Despesas com purchaseOrderId antigo: ${expensesWithOldField[0].count}`);
    
    // 2. Migrar dados de purchaseOrderId para purchaseId onde aplicável
    // Como purchaseOrder não existe mais, vamos apenas limpar o campo
    const result = await prisma.$executeRaw`
      UPDATE expenses 
      SET "purchaseOrderId" = NULL 
      WHERE "purchaseOrderId" IS NOT NULL
    `;
    
    console.log(`✅ ${result} registros atualizados`);
    
    // 3. Verificar resultado final
    const finalCheck = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count 
      FROM expenses 
      WHERE "purchaseOrderId" IS NOT NULL
    `;
    
    console.log(`📊 Despesas com purchaseOrderId após migração: ${finalCheck[0].count}`);
    
    if (finalCheck[0].count === 0n) {
      console.log('✅ Migração concluída! Campo purchaseOrderId pode ser removido do schema.');
    }
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateExpenseFields();
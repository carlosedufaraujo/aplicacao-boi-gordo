const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEnum() {
  try {
    const result = await prisma.$queryRaw`
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'PurchaseStatus'
      )
    `;
    
    console.log('Valores válidos do enum PurchaseStatus no banco:');
    console.log(result);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnum();
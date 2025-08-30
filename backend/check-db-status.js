const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
  try {
    // Query SQL direta
    const result = await prisma.$queryRaw`
      SELECT DISTINCT status FROM cattle_purchases
    `;
    
    console.log('Status únicos na tabela cattle_purchases:');
    console.log(result);
    
    // Contar registros por status
    const counts = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM cattle_purchases 
      GROUP BY status
    `;
    
    console.log('\nContagem por status:');
    console.log(counts);
    
    // Verificar se há registros com status ACTIVE
    const activeCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM cattle_purchases 
      WHERE status = 'ACTIVE'
    `;
    
    console.log('\nRegistros com status ACTIVE:', activeCount);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
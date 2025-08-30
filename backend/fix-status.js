const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStatus() {
  try {
    console.log('🔧 Corrigindo status inválidos no banco de dados...\n');
    
    // Atualizar registros com status ACTIVE para CONFINED
    const result = await prisma.$executeRaw`
      UPDATE cattle_purchases 
      SET status = 'CONFINED' 
      WHERE status = 'ACTIVE'
    `;
    
    console.log(`✅ ${result} registros atualizados de ACTIVE para CONFINED`);
    
    // Verificar resultado
    const counts = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM cattle_purchases 
      GROUP BY status
    `;
    
    console.log('\nStatus após correção:');
    counts.forEach(row => {
      console.log(`  ${row.status}: ${row.count} registros`);
    });
    
    console.log('\n✅ Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStatus();
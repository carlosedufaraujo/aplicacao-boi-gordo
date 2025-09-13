const { PrismaClient } = require('@prisma/client');

async function testarConexao() {
  console.log('🔍 Testando conexão com banco de dados...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    // Tentar uma query simples
    console.log('Tentando conectar...');
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ CONEXÃO SUCESSO!');
    console.log('Hora no servidor:', result[0].current_time);
    
    // Contar registros
    const users = await prisma.user.count();
    const purchases = await prisma.cattlePurchase.count();
    const pens = await prisma.pen.count();
    
    console.log('\n📊 Status do banco:');
    console.log(`- Usuários: ${users}`);
    console.log(`- Compras: ${purchases}`);
    console.log(`- Currais: ${pens}`);
    
  } catch (error) {
    console.error('❌ ERRO DE CONEXÃO:');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    
    if (error.code === 'P1001') {
      console.error('\n⚠️ Não foi possível conectar ao servidor de banco de dados');
      console.error('Verifique se o Supabase está online');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testarConexao();
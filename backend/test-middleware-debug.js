const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMiddleware() {
  console.log('🔍 TESTE DO MIDDLEWARE DE AUTENTICAÇÃO\n');
  console.log('='.repeat(50));
  
  try {
    // Buscar admin@boicontrol.com
    console.log('\n1. Buscando admin@boicontrol.com...');
    const adminBoicontrol = await prisma.user.findFirst({
      where: { 
        email: 'admin@boicontrol.com'
      }
    });
    
    if (adminBoicontrol) {
      console.log('✅ Usuário admin@boicontrol.com encontrado:');
      console.log(`   ID: ${adminBoicontrol.id}`);
      console.log(`   Nome: ${adminBoicontrol.name}`);
      console.log(`   Role: ${adminBoicontrol.role}`);
      console.log(`   Master: ${adminBoicontrol.isMaster}`);
      console.log(`   Ativo: ${adminBoicontrol.isActive}`);
    } else {
      console.log('❌ Usuário admin@boicontrol.com NÃO encontrado');
    }
    
    // Buscar admin@boigordo.com
    console.log('\n2. Buscando admin@boigordo.com...');
    const adminBoigordo = await prisma.user.findFirst({
      where: { 
        email: 'admin@boigordo.com'
      }
    });
    
    if (adminBoigordo) {
      console.log('✅ Usuário admin@boigordo.com encontrado:');
      console.log(`   ID: ${adminBoigordo.id}`);
      console.log(`   Nome: ${adminBoigordo.name}`);
      console.log(`   Role: ${adminBoigordo.role}`);
      console.log(`   Master: ${adminBoigordo.isMaster}`);
      console.log(`   Ativo: ${adminBoigordo.isActive}`);
    } else {
      console.log('❌ Usuário admin@boigordo.com NÃO encontrado');
    }
    
    // Listar todos os usuários
    console.log('\n3. Todos os usuários no banco:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isMaster: true,
        isActive: true
      }
    });
    
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Master: ${user.isMaster} - Ativo: ${user.isActive}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 ANÁLISE:');
    console.log('='.repeat(50));
    
    if (adminBoicontrol || adminBoigordo) {
      console.log('\n✅ O middleware DEVE funcionar porque:');
      console.log('   - Pelo menos um dos usuários admin existe no banco');
      console.log('   - O middleware vai encontrar e usar o usuário real');
      console.log('   - Não vai criar o usuário temporário "dev-user"');
    } else {
      console.log('\n⚠️ O middleware VAI FALHAR porque:');
      console.log('   - Nenhum dos usuários admin existe no banco');
      console.log('   - Vai criar o usuário temporário "dev-user"');
      console.log('   - Esse ID não existe no banco, causando erro 500');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMiddleware();
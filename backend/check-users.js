const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...\n');
    
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isMaster: true,
        isActive: true,
        createdAt: true
      }
    });
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco!');
      console.log('\n🔧 Criando usuário administrador...');
      
      // Criar usuário admin
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = await prisma.user.create({
        data: {
          email: 'admin@boicontrol.com',
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN',
          isMaster: true,
          isActive: true
        }
      });
      
      console.log('✅ Usuário administrador criado com sucesso!');
      console.log('📧 Email: admin@boicontrol.com');
      console.log('🔑 Senha: admin123');
      console.log('🆔 ID:', admin.id);
      
    } else {
      console.log(`📊 Total de usuários encontrados: ${users.length}\n`);
      
      users.forEach((user, index) => {
        console.log(`👤 Usuário ${index + 1}:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👨 Nome: ${user.name}`);
        console.log(`   🎭 Role: ${user.role}`);
        console.log(`   ⭐ Master: ${user.isMaster ? 'Sim' : 'Não'}`);
        console.log(`   ✅ Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
        console.log(`   📅 Criado em: ${user.createdAt.toLocaleString('pt-BR')}`);
        console.log('');
      });
      
      // Verificar se existe admin
      const admin = users.find(u => u.role === 'ADMIN' || u.isMaster);
      if (!admin) {
        console.log('⚠️  Nenhum usuário ADMIN encontrado!');
        console.log('🔧 Criando usuário administrador...');
        
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const newAdmin = await prisma.user.create({
          data: {
            email: 'admin@boicontrol.com',
            password: hashedPassword,
            name: 'Administrador',
            role: 'ADMIN',
            isMaster: true,
            isActive: true
          }
        });
        
        console.log('✅ Usuário administrador criado!');
        console.log('📧 Email: admin@boicontrol.com');
        console.log('🔑 Senha: admin123');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    console.error('\nDetalhes:', error.message);
    
    if (error.code === 'P2002') {
      console.log('\n⚠️  Usuário admin@boicontrol.com já existe!');
      console.log('💡 Use as credenciais:');
      console.log('   📧 Email: admin@boicontrol.com');
      console.log('   🔑 Senha: admin123');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
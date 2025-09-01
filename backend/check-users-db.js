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
        isActive: true,
        isMaster: true,
        createdAt: true
      }
    });
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco!');
      console.log('\n📝 Criando usuário admin...');
      
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
      
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('📧 Email: admin@boicontrol.com');
      console.log('🔑 Senha: admin123');
      console.log('🆔 ID:', admin.id);
      
    } else {
      console.log(`✅ ${users.length} usuário(s) encontrado(s):\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🎭 Role: ${user.role}`);
        console.log(`   ⭐ Master: ${user.isMaster ? 'Sim' : 'Não'}`);
        console.log(`   ✅ Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
        console.log(`   📅 Criado em: ${user.createdAt.toLocaleDateString('pt-BR')}`);
        console.log('');
      });
      
      // Verificar se existe o admin@boicontrol.com
      const adminUser = users.find(u => u.email === 'admin@boicontrol.com');
      if (!adminUser) {
        console.log('⚠️  Usuário admin@boicontrol.com não encontrado!');
        console.log('💡 Criando usuário admin padrão...');
        
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
        
        console.log('✅ Usuário admin criado!');
        console.log('📧 Email: admin@boicontrol.com');
        console.log('🔑 Senha: admin123');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
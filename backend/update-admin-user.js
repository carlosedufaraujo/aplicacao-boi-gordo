const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminUser() {
  try {
    console.log('🔧 Atualizando usuário admin@boicontrol.com...\n');
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: {
        email: 'admin@boicontrol.com'
      }
    });
    
    if (!user) {
      console.log('❌ Usuário admin@boicontrol.com não encontrado!');
      console.log('📝 Criando novo usuário admin@boicontrol.com...');
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Criar o usuário
      const newUser = await prisma.user.create({
        data: {
          email: 'admin@boicontrol.com',
          name: 'Administrador Master',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          isMaster: true
        }
      });
      
      console.log('✅ Usuário criado com sucesso!');
      console.log('📧 Email:', newUser.email);
      console.log('🔑 Senha: admin123');
      console.log('👤 Nome:', newUser.name);
      console.log('🛡️ Role:', newUser.role);
      console.log('⭐ Master:', newUser.isMaster);
      console.log('✅ Ativo:', newUser.isActive);
      
    } else {
      console.log('✅ Usuário encontrado! Atualizando permissões...');
      
      // Atualizar o usuário para garantir que seja ADMIN e Master
      const updatedUser = await prisma.user.update({
        where: {
          email: 'admin@boicontrol.com'
        },
        data: {
          role: 'ADMIN',
          isActive: true,
          isMaster: true,
          name: user.name || 'Administrador Master'
        }
      });
      
      console.log('\n✅ Usuário atualizado com sucesso!');
      console.log('📧 Email:', updatedUser.email);
      console.log('👤 Nome:', updatedUser.name);
      console.log('🛡️ Role:', updatedUser.role);
      console.log('⭐ Master:', updatedUser.isMaster);
      console.log('✅ Ativo:', updatedUser.isActive);
      console.log('\n💡 Use a senha que você já conhece para fazer login');
    }
    
    // Verificar também o middleware de autenticação
    console.log('\n📌 Informações importantes:');
    console.log('----------------------------------------');
    console.log('1. O usuário admin@boicontrol.com agora é ADMIN MASTER');
    console.log('2. Tem acesso total ao sistema');
    console.log('3. Pode gerenciar outros usuários');
    console.log('4. Pode acessar todas as funcionalidades');
    
    // Verificar se existem outros admins
    console.log('\n👥 Outros administradores no sistema:');
    const allAdmins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        email: true,
        name: true,
        isMaster: true,
        isActive: true
      }
    });
    
    allAdmins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.name}) - Master: ${admin.isMaster ? 'Sim' : 'Não'} - Ativo: ${admin.isActive ? 'Sim' : 'Não'}`);
    });
    
    // Atualizar também o middleware para reconhecer este email
    console.log('\n⚙️ Configuração do middleware:');
    console.log('----------------------------------------');
    console.log('O middleware auth.ts já está configurado para:');
    console.log('1. Em desenvolvimento, buscar admin@boigordo.com');
    console.log('2. Vamos adicionar fallback para admin@boicontrol.com');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminUser();
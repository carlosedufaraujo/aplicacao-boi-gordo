import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔍 Verificando usuários existentes...');
    
    // Listar todos os usuários
    const users = await prisma.user.findMany();
    console.log(`\n📊 Total de usuários no banco: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Usuários existentes:');
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - Ativo: ${user.isActive}`);
      });
    }

    // Verificar se existe admin@boigordo.com
    const adminEmail = 'admin@boigordo.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log(`\n✅ Admin já existe: ${adminEmail}`);
      console.log('   ID:', existingAdmin.id);
      console.log('   Nome:', existingAdmin.name);
      console.log('   Role:', existingAdmin.role);
      console.log('   Ativo:', existingAdmin.isActive);
      
      // Atualizar senha para garantir que seja admin123
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { 
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log('\n🔐 Senha atualizada para: admin123');
      
    } else {
      console.log(`\n📝 Criando novo admin: ${adminEmail}`);
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN',
          isMaster: false,
          isActive: true
        }
      });
      
      console.log('\n✅ Admin criado com sucesso!');
      console.log('   ID:', newAdmin.id);
      console.log('   Email:', adminEmail);
      console.log('   Senha: admin123');
    }

    // Criar também um usuário normal para testes
    const userEmail = 'user@boigordo.com';
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('user123', 10);
      await prisma.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          name: 'Usuário Teste',
          role: 'USER',
          isMaster: false,
          isActive: true
        }
      });
      console.log(`\n✅ Usuário teste criado: ${userEmail} / user123`);
    }

    console.log('\n🎯 Credenciais para login:');
    console.log('   Admin: admin@boigordo.com / admin123');
    console.log('   User:  user@boigordo.com / user123');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
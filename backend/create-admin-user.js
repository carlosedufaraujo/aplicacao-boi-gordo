const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Verificar se já existe um admin
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        email: 'admin@boigordo.com',
      },
    });

    if (existingAdmin) {
      console.log('👤 Usuário admin já existe');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Nome: ${existingAdmin.name}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      console.log(`✅ Ativo: ${existingAdmin.isActive}`);
      
      // Atualizar senha se necessário
      const hashedPassword = await bcrypt.hash('123456', 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { 
          password: hashedPassword,
          isActive: true,
        },
      });
      console.log('🔄 Senha atualizada para: 123456');
      return;
    }

    // Criar novo usuário admin
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@boigordo.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`👤 ID: ${admin.id}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`👤 Nome: ${admin.name}`);
    console.log(`🔑 Role: ${admin.role}`);
    console.log('🔐 Senha: 123456');

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
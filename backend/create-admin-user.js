const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Verifica se já existe um usuário admin
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@boigordo.com'
      }
    });

    if (existingAdmin) {
      console.log('✅ Usuário admin já existe:', existingAdmin.email);
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Cria o usuário admin
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@boigordo.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        isMaster: true
      }
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Senha: admin123');
    console.log('👤 Nome:', adminUser.name);
    console.log('🛡️ Role:', adminUser.role);

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
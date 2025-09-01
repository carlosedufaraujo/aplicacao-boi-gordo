const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@boigordo.com' }
    });

    if (existingUser) {
      console.log('✅ Usuário de teste já existe!');
      console.log('Email: admin@boigordo.com');
      console.log('Senha: admin123');
      return;
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: 'admin@boigordo.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN'
      }
    });

    console.log('✅ Usuário de teste criado com sucesso!');
    console.log('Email: admin@boigordo.com');
    console.log('Senha: admin123');
    console.log('ID:', user.id);

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
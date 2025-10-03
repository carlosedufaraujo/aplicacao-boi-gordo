import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔄 Criando usuários de teste...');

    // Senha padrão para todos os usuários de teste
    const defaultPassword = await bcrypt.hash('senha123', 10);

    // Usuários de teste
    const testUsers = [
      {
        email: 'usuario1@boigordo.com',
        name: 'Usuário Teste 1',
        password: defaultPassword,
        role: 'ADMIN',
        isActive: true,
        isMaster: false
      },
      {
        email: 'usuario2@boigordo.com',
        name: 'Usuário Teste 2',
        password: defaultPassword,
        role: 'ADMIN',
        isActive: true,
        isMaster: false
      },
      {
        email: 'admin@boigordo.com',
        name: 'Administrador',
        password: defaultPassword,
        role: 'ADMIN',
        isActive: true,
        isMaster: true
      }
    ];

    for (const userData of testUsers) {
      // Verifica se o usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`✅ Usuário ${userData.email} já existe`);
        // Atualiza a senha se necessário
        await prisma.user.update({
          where: { email: userData.email },
          data: { password: defaultPassword, isActive: true }
        });
        console.log(`   Senha atualizada para: senha123`);
      } else {
        // Cria novo usuário
        await prisma.user.create({
          data: userData
        });
        console.log(`✅ Usuário ${userData.email} criado com sucesso`);
        console.log(`   Senha: senha123`);
      }
    }

    console.log('\n📊 Resumo dos usuários criados:');
    console.log('================================');
    console.log('Email: usuario1@boigordo.com | Senha: senha123');
    console.log('Email: usuario2@boigordo.com | Senha: senha123');
    console.log('Email: admin@boigordo.com | Senha: senha123');
    console.log('================================');
    console.log('\n✨ Todos os usuários têm acesso total aos dados!');

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
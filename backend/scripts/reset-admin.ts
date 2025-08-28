import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const email = 'admin@boigordo.com';
    const newPassword = 'admin123';
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualiza ou cria o usuário admin
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        isActive: true,
      },
      create: {
        email,
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
        isActive: true,
      },
    });
    
    console.log(`✅ Usuário admin atualizado/criado:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Senha: ${newPassword}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Ativo: ${user.isActive}`);
    
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
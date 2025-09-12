import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetCarlosPassword() {
  try {
    const email = 'carlosedufaraujo@outlook.com';
    const newPassword = '368308450Ce*';
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualiza o usuário
    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    });
    
    console.log(`✅ Senha atualizada para o usuário:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Master: ${user.isMaster}`);
    console.log(`   Ativo: ${user.isActive}`);
    console.log(`   Senha: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetCarlosPassword();
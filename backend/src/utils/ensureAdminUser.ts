import bcrypt from 'bcryptjs';
import { prisma } from '@/config/database';

export async function ensureAdminUser() {
  try {
    // Verificar se existe algum usuário admin
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@boicontrol.com' },
          { role: 'ADMIN' },
          { isMaster: true }
        ]
      }
    });

    if (!adminUser) {
      console.log('🔧 Criando usuário administrador padrão...');
      
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
      console.log('⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!');
      
      return admin;
    } else {
      console.log('✅ Usuário administrador encontrado:', adminUser.email);
      return adminUser;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar/criar usuário admin:', error);
    // Não lançar erro para não impedir a inicialização do servidor
  }
}
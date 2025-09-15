#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste para testes automatizados...\n');

    // Credenciais para o usuário admin de teste
    const adminEmail = 'admin@boigordo.com';
    const adminPassword = 'Admin123@';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Verificar se já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('✅ Usuário admin já existe, atualizando senha...');
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          isActive: true,
          role: 'ADMIN'
        }
      });
    } else {
      // Criar novo usuário admin
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Admin Teste',
          role: 'ADMIN',
          isMaster: true,
          isActive: true
        }
      });
    }

    console.log('✅ Usuário admin criado/atualizado com sucesso!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Senha:', adminPassword);
    console.log('🎭 Role: ADMIN');

    // Criar também usuário normal
    const userEmail = 'user@boigordo.com';
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: userEmail,
          password: hashedPassword,
          name: 'Usuário Normal',
          role: 'USER',
          isMaster: false,
          isActive: true
        }
      });
      console.log('\n✅ Usuário normal criado!');
      console.log('📧 Email:', userEmail);
      console.log('🔑 Senha:', adminPassword);
      console.log('🎭 Role: USER');
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...');
    
    const email = 'teste@boigordo.com';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Deletar usuário existente se houver
    await prisma.user.deleteMany({
      where: { email }
    });
    
    // Criar novo usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Usuário Teste',
        role: 'ADMIN',
        isMaster: false,
        isActive: true
      }
    });
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email:', email);
    console.log('🔑 Senha:', password);
    console.log('👤 ID:', user.id);
    console.log('🎭 Role:', user.role);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
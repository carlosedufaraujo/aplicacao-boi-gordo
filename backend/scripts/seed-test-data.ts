#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    console.log('🌱 Criando dados de teste...\n');

    // 1. Garantir usuário admin
    const adminEmail = 'admin@boigordo.com';
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      const bcrypt = await import('bcryptjs');
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: await bcrypt.hash('Admin123@', 10),
          name: 'Admin Teste',
          role: 'ADMIN',
          isMaster: false,
          isActive: true
        }
      });
      console.log('✅ Usuário admin criado');
    }

    // 2. Criar parceiros de teste se não existirem
    const vendorCount = await prisma.partner.count({ where: { type: 'VENDOR' } });
    if (vendorCount === 0) {
      await prisma.partner.createMany({
        data: [
          {
            name: 'Fazenda Teste 1',
            type: 'VENDOR',
            documentType: 'CNPJ',
            documentNumber: '12345678901234',
            email: 'fazenda1@teste.com',
            phone: '11999999999',
            isActive: true
          },
          {
            name: 'Fazenda Teste 2',
            type: 'VENDOR',
            documentType: 'CPF',
            documentNumber: '12345678901',
            email: 'fazenda2@teste.com',
            phone: '11888888888',
            isActive: true
          }
        ]
      });
      console.log('✅ Parceiros de teste criados');
    }

    // 3. Criar contas de pagamento se não existirem
    const accountCount = await prisma.payerAccount.count();
    if (accountCount === 0) {
      await prisma.payerAccount.createMany({
        data: [
          {
            bankName: 'Banco Teste',
            accountNumber: '12345-6',
            accountHolder: 'Empresa Teste',
            documentNumber: '12345678901234',
            balance: 1000000,
            isActive: true
          }
        ]
      });
      console.log('✅ Contas de pagamento criadas');
    }

    // 4. Criar currais se não existirem
    const penCount = await prisma.pen.count();
    if (penCount === 0) {
      await prisma.pen.createMany({
        data: [
          {
            code: 'PEN-001',
            name: 'Curral 1',
            capacity: 100,
            currentOccupancy: 50,
            location: 'Setor A',
            type: 'CONFINEMENT',
            isActive: true
          },
          {
            code: 'PEN-002',
            name: 'Curral 2',
            capacity: 150,
            currentOccupancy: 75,
            location: 'Setor B',
            type: 'CONFINEMENT',
            isActive: true
          }
        ]
      });
      console.log('✅ Currais criados');
    }

    // 5. Criar pelo menos 5 lotes de teste se não existirem
    const lotCount = await prisma.cattlePurchase.count();
    if (lotCount < 5) {
      const vendor = await prisma.partner.findFirst({ where: { type: 'VENDOR' } });
      const account = await prisma.payerAccount.findFirst();

      if (vendor && account && adminUser) {
        const lotsToCreate = [];
        for (let i = 1; i <= 5; i++) {
          lotsToCreate.push({
            lotCode: `LOT-TEST-${String(i).padStart(3, '0')}`,
            vendorId: vendor.id,
            payerAccountId: account.id,
            userId: adminUser.id,
            purchaseDate: new Date(),
            animalType: 'MALE' as const,
            initialQuantity: 50 + i * 10,
            currentQuantity: 50 + i * 10,
            purchaseWeight: (50 + i * 10) * 300,
            averageWeight: 300,
            pricePerArroba: 280,
            purchaseValue: (50 + i * 10) * 300 * 280 / 30,
            status: 'CONFIRMED' as const,
            carcassYield: 55
          });
        }

        await prisma.cattlePurchase.createMany({ data: lotsToCreate });
        console.log('✅ Lotes de teste criados');
      }
    }

    // 6. Criar algumas despesas de teste
    const expenseCount = await prisma.expense.count();
    if (expenseCount === 0) {
      const account = await prisma.payerAccount.findFirst();
      if (account && adminUser) {
        await prisma.expense.createMany({
          data: [
            {
              description: 'Ração - Teste',
              amount: 5000,
              date: new Date(),
              category: 'FEED',
              status: 'PAID',
              payerAccountId: account.id,
              userId: adminUser.id
            },
            {
              description: 'Medicamentos - Teste',
              amount: 2000,
              date: new Date(),
              category: 'MEDICINE',
              status: 'PENDING',
              payerAccountId: account.id,
              userId: adminUser.id
            }
          ]
        });
        console.log('✅ Despesas de teste criadas');
      }
    }

    console.log('\n✅ Dados de teste criados com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   - Lotes: ${await prisma.cattlePurchase.count()}`);
    console.log(`   - Parceiros: ${await prisma.partner.count()}`);
    console.log(`   - Currais: ${await prisma.pen.count()}`);
    console.log(`   - Despesas: ${await prisma.expense.count()}`);

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
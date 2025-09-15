import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🚀 Criando dados de teste para TestSprite...');

  try {
    // 1. Criar PayerAccount
    const payerAccount = await prisma.payerAccount.upsert({
      where: { name: 'Conta TestSprite' },
      update: {},
      create: {
        name: 'Conta TestSprite',
        accountType: 'CHECKING',
        balance: 1000000.00,
        isActive: true,
        description: 'Conta criada para testes automatizados'
      }
    });
    console.log('✅ PayerAccount criado:', payerAccount.id);

    // 2. Criar Partner VENDOR
    const vendor = await prisma.partner.upsert({
      where: { name: 'Fazenda TestSprite' },
      update: {},
      create: {
        name: 'Fazenda TestSprite',
        type: 'VENDOR',
        isActive: true,
        notes: 'Fornecedor criado para testes automatizados'
      }
    });
    console.log('✅ Partner VENDOR criado:', vendor.id);

    // 3. Criar Partner INDIVIDUAL (para TC006)
    const individual = await prisma.partner.upsert({
      where: { name: 'Pessoa Física TestSprite' },
      update: {},
      create: {
        name: 'Pessoa Física TestSprite',
        type: 'OTHER', // Mapeamos individual para OTHER
        isActive: true,
        notes: 'Partner individual criado para testes automatizados'
      }
    });
    console.log('✅ Partner INDIVIDUAL criado:', individual.id);

    // 4. Atualizar endpoint de dados de teste com IDs reais
    console.log('\n📋 IDs criados para usar nos testes:');
    console.log(`PayerAccount ID: ${payerAccount.id}`);
    console.log(`Vendor ID: ${vendor.id}`);
    console.log(`Individual ID: ${individual.id}`);

    console.log('\n🎉 Dados de teste criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();

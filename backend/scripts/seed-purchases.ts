import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPurchases() {
  try {
    console.log('🌱 Iniciando seed de compras de gado...');

    // Buscar IDs necessários
    const [vendor, payerAccount, user] = await Promise.all([
      prisma.partner.findFirst({ where: { type: 'VENDOR' } }),
      prisma.payerAccount.findFirst(),
      prisma.user.findFirst()
    ]);

    if (!vendor || !payerAccount || !user) {
      console.error('❌ Dados necessários não encontrados. Certifique-se de ter vendors, contas e usuários cadastrados.');
      return;
    }

    // Criar compras de teste
    const purchases = [
      {
        vendorId: vendor.id,
        payerAccountId: payerAccount.id,
        userId: user.id,
        lotCode: 'LOTE-001',
        purchaseDate: new Date('2025-01-10'),
        animalType: 'BOVINE', // Tipo padrão para bovinos
        initialQuantity: 100,
        currentQuantity: 98, // 2 mortes
        purchaseWeight: 45000, // 450kg médio
        carcassYield: 52, // 52% de rendimento
        pricePerArroba: 320,
        purchaseValue: 390400,
        totalCost: 395000,
        status: 'CONFIRMED',
        deathCount: 2,
        averageWeight: 450,
        location: 'Fazenda São José',
        city: 'Goiânia',
        state: 'GO'
      },
      {
        vendorId: vendor.id,
        payerAccountId: payerAccount.id,
        userId: user.id,
        lotCode: 'LOTE-002',
        purchaseDate: new Date('2025-01-05'),
        animalType: 'BOVINE', // Tipo padrão para bovinos
        initialQuantity: 80,
        currentQuantity: 78,
        purchaseWeight: 40000, // 500kg médio
        carcassYield: 55, // 55% de rendimento
        pricePerArroba: 350,
        purchaseValue: 385000,
        totalCost: 390000,
        status: 'CONFIRMED',
        deathCount: 2,
        averageWeight: 500,
        location: 'Fazenda Santa Maria',
        city: 'Campo Grande',
        state: 'MS'
      },
      {
        vendorId: vendor.id,
        payerAccountId: payerAccount.id,
        userId: user.id,
        lotCode: 'LOTE-003',
        purchaseDate: new Date('2024-12-20'),
        animalType: 'BOVINE', // Tipo padrão para bovinos
        initialQuantity: 120,
        currentQuantity: 115,
        purchaseWeight: 54000, // 450kg médio
        carcassYield: 50, // 50% de rendimento padrão
        pricePerArroba: 310,
        purchaseValue: 279000,
        totalCost: 285000,
        status: 'CONFIRMED',
        deathCount: 5,
        averageWeight: 450,
        location: 'Fazenda Boa Vista',
        city: 'Cuiabá',
        state: 'MT'
      }
    ];

    for (const purchase of purchases) {
      const existing = await prisma.cattlePurchase.findFirst({
        where: { lotCode: purchase.lotCode }
      });

      if (!existing) {
        const created = await prisma.cattlePurchase.create({
          data: purchase
        });
        console.log(`✅ Compra criada: ${created.lotCode} - ${created.initialQuantity} animais`);
      } else {
        console.log(`⚠️ Compra já existe: ${purchase.lotCode}`);
      }
    }

    // Verificar total
    const total = await prisma.cattlePurchase.count();
    console.log(`\n📊 Total de compras no banco: ${total}`);

    const allPurchases = await prisma.cattlePurchase.findMany({
      select: {
        lotCode: true,
        initialQuantity: true,
        currentQuantity: true,
        carcassYield: true,
        status: true
      }
    });

    console.log('\n📋 Compras cadastradas:');
    allPurchases.forEach(p => {
      console.log(`   - ${p.lotCode}: ${p.currentQuantity}/${p.initialQuantity} animais, Rendimento: ${p.carcassYield}%, Status: ${p.status}`);
    });

  } catch (error) {
    console.error('❌ Erro ao criar seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPurchases();
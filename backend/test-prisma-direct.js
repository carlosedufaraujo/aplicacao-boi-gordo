const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrisma() {
  console.log('🧪 Teste direto do Prisma...\n');

  try {
    // 1. Teste básico - listar sem filtros
    console.log('1️⃣ Listando CattlePurchase sem filtros...');
    const purchases = await prisma.cattlePurchase.findMany({
      take: 5
    });
    console.log(`✅ Sucesso! ${purchases.length} registros encontrados`);

    // 2. Teste com include
    console.log('\n2️⃣ Testando com include...');
    const purchasesWithRelations = await prisma.cattlePurchase.findMany({
      take: 2,
      include: {
        vendor: true,
        payerAccount: true
      }
    });
    console.log(`✅ Sucesso com include! ${purchasesWithRelations.length} registros`);

    // 3. Teste com filtro de status válido
    console.log('\n3️⃣ Testando filtro com status válido (CONFIRMED)...');
    const confirmedPurchases = await prisma.cattlePurchase.findMany({
      where: { status: 'CONFIRMED' },
      take: 5
    });
    console.log(`✅ Sucesso! ${confirmedPurchases.length} registros com status CONFIRMED`);

    // 4. Teste que deve falhar - status inválido
    console.log('\n4️⃣ Testando com status inválido (ACTIVE) - deve falhar...');
    try {
      const activePurchases = await prisma.cattlePurchase.findMany({
        where: { status: 'ACTIVE' },
        take: 5
      });
      console.log('⚠️ Inesperado: não deveria funcionar com status ACTIVE');
    } catch (error) {
      console.log('✅ Erro esperado:', error.message.substring(0, 100));
    }

    // 5. Listar enums disponíveis
    console.log('\n5️⃣ Valores válidos para PurchaseStatus:');
    console.log(['CONFIRMED', 'RECEIVED', 'CONFINED']);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
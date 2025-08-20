// Script para adicionar dados reais de exemplo no sistema
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedRealData() {
  console.log('🌱 Adicionando dados reais de exemplo...\n');
  console.log('=' .repeat(60));

  try {
    // 1. CRIAR ORDENS DE COMPRA REALISTAS
    console.log('\n📦 Criando Ordens de Compra...');
    
    // Buscar IDs necessários
    const vendor = await prisma.partner.findFirst({ where: { type: 'VENDOR' } });
    const broker = await prisma.partner.findFirst({ where: { type: 'BROKER' } });
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    if (!vendor || !broker || !admin) {
      console.log('⚠️  Parceiros ou usuário não encontrados. Execute seed-users.js primeiro.');
      return;
    }

    const purchaseOrders = [
      {
        code: 'OC-2024-001',
        date: new Date('2024-01-15'),
        vendorId: vendor.id,
        brokerId: broker.id,
        userId: admin.id,
        quantity: 120,
        animalType: 'NELORE',
        estimatedAge: 24,
        totalWeight: 48000,
        pricePerArroba: 285.50,
        totalValue: 542716.00,
        commission: 6000,
        freightCost: 3750,
        status: 'RECEIVED',
        paymentStatus: 'PAID',
        city: 'Ribeirão Preto',
        state: 'SP',
        observations: 'Lote de alta qualidade - Nelore PO'
      },
      {
        code: 'OC-2024-002',
        date: new Date('2024-01-20'),
        vendorId: vendor.id,
        brokerId: broker.id,
        userId: admin.id,
        quantity: 85,
        animalType: 'ANGUS',
        estimatedAge: 18,
        totalWeight: 29750,
        pricePerArroba: 295.00,
        totalValue: 349937.50,
        commission: 4250,
        freightCost: 2800,
        status: 'IN_TRANSIT',
        paymentStatus: 'PENDING',
        city: 'Barretos',
        state: 'SP',
        observations: 'Animais precoces - Angus meio sangue'
      },
      {
        code: 'OC-2024-003',
        date: new Date('2024-01-25'),
        vendorId: vendor.id,
        brokerId: broker.id,
        userId: admin.id,
        quantity: 150,
        animalType: 'NELORE',
        estimatedAge: 30,
        totalWeight: 67500,
        pricePerArroba: 280.00,
        totalValue: 756000.00,
        commission: 7500,
        freightCost: 4500,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        city: 'Araçatuba',
        state: 'SP',
        observations: 'Lote grande - Nelore comercial'
      }
    ];

    for (const order of purchaseOrders) {
      const created = await prisma.purchaseOrder.create({ data: order });
      console.log(`✅ Ordem de compra criada: ${created.code} - ${created.quantity} animais`);
    }

    // 2. CRIAR LOTES DE GADO
    console.log('\n🐮 Criando Lotes de Gado...');
    
    const cattleLots = [
      {
        lotNumber: 'LOT-2024-001',
        purchaseOrderId: (await prisma.purchaseOrder.findFirst()).id,
        entryDate: new Date('2024-01-16'),
        quantity: 120,
        currentQuantity: 118, // 2 mortes
        averageWeight: 400,
        currentAverageWeight: 485,
        status: 'ACTIVE',
        totalCost: 542716.00,
        estimatedRevenue: 680000.00,
        observations: 'Lote em fase final de engorda'
      },
      {
        lotNumber: 'LOT-2024-002',
        purchaseOrderId: (await prisma.purchaseOrder.findFirst({ skip: 1 })).id,
        entryDate: new Date('2024-01-21'),
        quantity: 85,
        currentQuantity: 85,
        averageWeight: 350,
        currentAverageWeight: 420,
        status: 'ACTIVE',
        totalCost: 349937.50,
        estimatedRevenue: 450000.00,
        observations: 'Lote Angus - alto rendimento'
      }
    ];

    for (const lot of cattleLots) {
      const created = await prisma.cattleLot.create({ data: lot });
      console.log(`✅ Lote criado: ${created.lotNumber} - ${created.currentQuantity} animais`);
    }

    // 3. CRIAR ALOCAÇÕES NOS CURRAIS
    console.log('\n🏠 Alocando animais nos currais...');
    
    const pens = await prisma.pen.findMany({ take: 10 });
    const lots = await prisma.cattleLot.findMany();
    
    if (pens.length > 0 && lots.length > 0) {
      // Alocar primeiro lote
      const allocations = [
        { penId: pens[0].id, cattleLotId: lots[0].id, quantity: 40, entryDate: new Date('2024-01-16') },
        { penId: pens[1].id, cattleLotId: lots[0].id, quantity: 40, entryDate: new Date('2024-01-16') },
        { penId: pens[2].id, cattleLotId: lots[0].id, quantity: 38, entryDate: new Date('2024-01-16') },
        // Alocar segundo lote
        { penId: pens[3].id, cattleLotId: lots[1].id, quantity: 30, entryDate: new Date('2024-01-21') },
        { penId: pens[4].id, cattleLotId: lots[1].id, quantity: 30, entryDate: new Date('2024-01-21') },
        { penId: pens[5].id, cattleLotId: lots[1].id, quantity: 25, entryDate: new Date('2024-01-21') },
      ];
      
      for (const alloc of allocations) {
        await prisma.lotPenLink.create({ data: alloc });
        await prisma.pen.update({
          where: { id: alloc.penId },
          data: { status: 'OCCUPIED' }
        });
      }
      console.log(`✅ ${allocations.length} alocações criadas`);
    }

    // 4. CRIAR PESAGENS
    console.log('\n⚖️ Registrando pesagens...');
    
    if (lots.length > 0) {
      const weightReadings = [
        {
          cattleLotId: lots[0].id,
          date: new Date('2024-01-16'),
          averageWeight: 400,
          totalWeight: 48000,
          observations: 'Pesagem inicial'
        },
        {
          cattleLotId: lots[0].id,
          date: new Date('2024-02-01'),
          averageWeight: 440,
          totalWeight: 51920,
          observations: 'Primeira pesagem mensal'
        },
        {
          cattleLotId: lots[0].id,
          date: new Date('2024-03-01'),
          averageWeight: 485,
          totalWeight: 57230,
          observations: 'Pesagem pré-venda'
        }
      ];
      
      for (const reading of weightReadings) {
        await prisma.weightReading.create({ data: reading });
      }
      console.log(`✅ ${weightReadings.length} pesagens registradas`);
    }

    // 5. CRIAR DESPESAS OPERACIONAIS
    console.log('\n💰 Registrando despesas...');
    
    const expenses = [
      {
        description: 'Ração - Janeiro 2024',
        category: 'FEED',
        amount: 85000,
        date: new Date('2024-01-31'),
        status: 'PAID',
        paymentDate: new Date('2024-02-05'),
        userId: admin.id
      },
      {
        description: 'Medicamentos veterinários',
        category: 'HEALTH',
        amount: 12500,
        date: new Date('2024-01-20'),
        status: 'PAID',
        paymentDate: new Date('2024-01-20'),
        userId: admin.id
      },
      {
        description: 'Manutenção de currais',
        category: 'MAINTENANCE',
        amount: 8500,
        date: new Date('2024-01-15'),
        status: 'PAID',
        paymentDate: new Date('2024-01-18'),
        userId: admin.id
      },
      {
        description: 'Folha de pagamento - Janeiro',
        category: 'PAYROLL',
        amount: 45000,
        date: new Date('2024-01-31'),
        status: 'PAID',
        paymentDate: new Date('2024-02-01'),
        userId: admin.id
      },
      {
        description: 'Energia elétrica',
        category: 'UTILITIES',
        amount: 6800,
        date: new Date('2024-01-30'),
        status: 'PENDING',
        userId: admin.id
      }
    ];

    for (const expense of expenses) {
      const created = await prisma.expense.create({ data: expense });
      console.log(`✅ Despesa registrada: ${created.description} - R$ ${created.amount}`);
    }

    // 6. CRIAR VENDAS
    console.log('\n💵 Registrando vendas...');
    
    const slaughterhouse = await prisma.partner.findFirst({ where: { type: 'SLAUGHTERHOUSE' } });
    
    if (slaughterhouse && lots.length > 0) {
      const sale = await prisma.sale.create({
        data: {
          code: 'VND-2024-001',
          date: new Date('2024-03-15'),
          cattleLotId: lots[0].id,
          slaughterhouseId: slaughterhouse.id,
          quantity: 118,
          totalWeight: 57230,
          pricePerArroba: 295.00,
          totalValue: 675159.00,
          status: 'CONFIRMED',
          userId: admin.id,
          observations: 'Venda programada para 15/03'
        }
      });
      console.log(`✅ Venda criada: ${sale.code} - R$ ${sale.totalValue}`);
    }

    // 7. CRIAR PROTOCOLOS SANITÁRIOS
    console.log('\n💉 Registrando protocolos sanitários...');
    
    if (lots.length > 0) {
      const healthProtocols = [
        {
          cattleLotId: lots[0].id,
          date: new Date('2024-01-17'),
          type: 'VACCINATION',
          description: 'Vacinação contra febre aftosa',
          veterinarianName: 'Dr. José Silva',
          cost: 3500,
          observations: 'Todos os animais vacinados'
        },
        {
          cattleLotId: lots[0].id,
          date: new Date('2024-01-20'),
          type: 'DEWORMING',
          description: 'Vermifugação preventiva',
          veterinarianName: 'Dr. José Silva',
          cost: 2800,
          observations: 'Aplicação de ivermectina'
        }
      ];
      
      for (const protocol of healthProtocols) {
        await prisma.healthProtocol.create({ data: protocol });
      }
      console.log(`✅ ${healthProtocols.length} protocolos sanitários registrados`);
    }

    // RESUMO FINAL
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMO DOS DADOS CRIADOS:');
    console.log('=' .repeat(60));
    
    const summary = {
      purchaseOrders: await prisma.purchaseOrder.count(),
      cattleLots: await prisma.cattleLot.count(),
      pens: await prisma.pen.count({ where: { status: 'OCCUPIED' } }),
      expenses: await prisma.expense.count(),
      sales: await prisma.sale.count(),
      users: await prisma.user.count(),
      partners: await prisma.partner.count()
    };
    
    console.log(`✅ Ordens de Compra: ${summary.purchaseOrders}`);
    console.log(`✅ Lotes de Gado: ${summary.cattleLots}`);
    console.log(`✅ Currais Ocupados: ${summary.pens}`);
    console.log(`✅ Despesas: ${summary.expenses}`);
    console.log(`✅ Vendas: ${summary.sales}`);
    console.log(`✅ Usuários: ${summary.users}`);
    console.log(`✅ Parceiros: ${summary.partners}`);
    
    console.log('\n🎉 Dados reais de exemplo adicionados com sucesso!');
    console.log('📌 O sistema está pronto para uso com dados realistas.');

  } catch (error) {
    console.error('❌ Erro ao adicionar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRealData();
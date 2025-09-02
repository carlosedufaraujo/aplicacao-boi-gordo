const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('🚀 Criando dados de exemplo...\n');
    
    // 1. Buscar IDs necessários
    const vendor = await prisma.partner.findFirst({
      where: { type: 'VENDOR' }
    });
    
    if (!vendor) {
      console.log('❌ Nenhum fornecedor encontrado. Criando...');
      const newVendor = await prisma.partner.create({
        data: {
          name: 'Fazenda São João',
          type: 'VENDOR',
          cpfCnpj: '12345678901234',
          phone: '(11) 98765-4321',
          email: 'contato@fazendasaojoao.com',
          address: 'Rodovia BR-101, Km 45'
        }
      });
      vendor = newVendor;
    }
    
    const payerAccount = await prisma.payerAccount.findFirst();
    
    if (!payerAccount) {
      console.log('❌ Nenhuma conta pagadora encontrada. Criando...');
      const newAccount = await prisma.payerAccount.create({
        data: {
          bankName: 'Banco do Brasil',
          accountName: 'Conta Principal',
          agency: '1234',
          accountNumber: '56789-0',
          accountType: 'CHECKING',
          balance: 1000000
        }
      });
      payerAccount = newAccount;
    }
    
    // 2. Criar uma compra de gado de exemplo
    console.log('📝 Criando compra de gado de exemplo...');
    
    const purchase = await prisma.cattlePurchase.create({
      data: {
        lotCode: `LOT-${Date.now()}`,
        vendorId: vendor.id,
        payerAccountId: payerAccount.id,
        location: 'Fazenda Esperança',
        city: 'Ribeirão Preto',
        state: 'SP',
        purchaseDate: new Date(),
        animalType: 'MALE',
        initialQuantity: 100,
        currentQuantity: 100,
        purchaseWeight: 30000, // 300kg médio
        averageWeight: 300,
        pricePerArroba: 280,
        purchaseValue: 280000,
        freightCost: 5000,
        commission: 5600, // 2%
        totalCost: 290600,
        paymentType: 'CASH',
        status: 'CONFIRMED'
      }
    });
    
    console.log(`✅ Compra criada: Lote ${purchase.lotCode}`);
    console.log(`   • ${purchase.initialQuantity} cabeças`);
    console.log(`   • Valor: R$ ${purchase.purchaseValue.toFixed(2)}`);
    console.log(`   • Frete: R$ ${purchase.freightCost.toFixed(2)}`);
    console.log(`   • Comissão: R$ ${purchase.commission.toFixed(2)}`);
    
    // 3. Criar centro de custo do lote
    const lotCostCenter = await prisma.costCenter.create({
      data: {
        code: `LOT-${purchase.lotCode}`,
        name: `Lote ${purchase.lotCode}`,
        type: 'ACQUISITION',
        isActive: true
      }
    });
    
    console.log(`\n✅ Centro de custo criado: ${lotCostCenter.code}`);
    
    // 4. Criar despesas relacionadas
    console.log('\n📝 Criando despesas relacionadas...');
    
    const expenses = [];
    
    // Despesa 1: Compra do gado
    const cattleExpense = await prisma.expense.create({
      data: {
        description: `Compra de Gado - ${purchase.lotCode}`,
        category: 'COMPRA_GADO',
        costCenterId: lotCostCenter.id,
        totalAmount: purchase.purchaseValue,
        dueDate: purchase.purchaseDate,
        isPaid: false,
        impactsCashFlow: true,
        purchaseId: purchase.id,
        vendorId: vendor.id,
        userId: 'system'
      }
    });
    expenses.push(cattleExpense);
    console.log(`   ✅ Despesa de compra: R$ ${cattleExpense.totalAmount.toFixed(2)}`);
    
    // Despesa 2: Frete
    if (purchase.freightCost > 0) {
      const freightExpense = await prisma.expense.create({
        data: {
          description: `Frete - ${purchase.lotCode}`,
          category: 'TRANSPORTE',
          costCenterId: lotCostCenter.id,
          totalAmount: purchase.freightCost,
          dueDate: purchase.purchaseDate,
          isPaid: false,
          impactsCashFlow: true,
          purchaseId: purchase.id,
          userId: 'system'
        }
      });
      expenses.push(freightExpense);
      console.log(`   ✅ Despesa de frete: R$ ${freightExpense.totalAmount.toFixed(2)}`);
    }
    
    // Despesa 3: Comissão
    if (purchase.commission > 0) {
      const commissionExpense = await prisma.expense.create({
        data: {
          description: `Comissão - ${purchase.lotCode}`,
          category: 'COMISSAO',
          costCenterId: lotCostCenter.id,
          totalAmount: purchase.commission,
          dueDate: purchase.purchaseDate,
          isPaid: false,
          impactsCashFlow: true,
          purchaseId: purchase.id,
          userId: 'system'
        }
      });
      expenses.push(commissionExpense);
      console.log(`   ✅ Despesa de comissão: R$ ${commissionExpense.totalAmount.toFixed(2)}`);
    }
    
    // 5. Criar algumas despesas administrativas
    console.log('\n📝 Criando despesas administrativas...');
    
    const adminCenter = await prisma.costCenter.findFirst({
      where: { code: 'ADM' }
    });
    
    if (adminCenter) {
      const adminExpenses = [
        {
          description: 'Conta de Internet - Janeiro',
          category: 'ADMINISTRATIVO',
          totalAmount: 299.90,
          costCenterId: adminCenter.id
        },
        {
          description: 'Energia Elétrica - Janeiro',
          category: 'ENERGIA',
          totalAmount: 1500.00,
          costCenterId: adminCenter.id
        },
        {
          description: 'Folha de Pagamento - Janeiro',
          category: 'MAO_DE_OBRA',
          totalAmount: 15000.00,
          costCenterId: adminCenter.id
        }
      ];
      
      for (const expData of adminExpenses) {
        const exp = await prisma.expense.create({
          data: {
            ...expData,
            dueDate: new Date(),
            isPaid: false,
            impactsCashFlow: true,
            userId: 'system'
          }
        });
        console.log(`   ✅ ${exp.description}: R$ ${exp.totalAmount.toFixed(2)}`);
      }
    }
    
    // 6. Resumo final
    console.log('\n\n📊 RESUMO DOS DADOS CRIADOS:');
    console.log('============================');
    
    const totalExpenses = await prisma.expense.count();
    const totalValue = await prisma.expense.aggregate({
      _sum: { totalAmount: true }
    });
    
    console.log(`Total de despesas: ${totalExpenses}`);
    console.log(`Valor total: R$ ${(totalValue._sum.totalAmount || 0).toFixed(2)}`);
    
    const purchases = await prisma.cattlePurchase.count();
    console.log(`Total de compras de gado: ${purchases}`);
    
    const costCenters = await prisma.costCenter.count();
    console.log(`Total de centros de custo: ${costCenters}`);
    
    console.log('\n✅ Dados criados com sucesso!');
    console.log('Acesse o Centro Financeiro para visualizar.');
    
  } catch (error) {
    console.error('❌ Erro ao criar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
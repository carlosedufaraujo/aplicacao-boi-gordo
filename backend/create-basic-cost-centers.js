const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBasicCostCenters() {
  try {
    console.log('🚀 Criando Centros de Custo Básicos...\n');
    
    const basicCenters = [
      {
        code: 'ADM',
        name: 'Administrativo',
        type: 'ADMINISTRATIVE',
        isActive: true
      },
      {
        code: 'OPR',
        name: 'Operacional',
        type: 'FATTENING',
        isActive: true
      },
      {
        code: 'COM',
        name: 'Comercial',
        type: 'ADMINISTRATIVE',
        isActive: true
      },
      {
        code: 'FIN',
        name: 'Financeiro',
        type: 'ADMINISTRATIVE',
        isActive: true
      },
      {
        code: 'MAN',
        name: 'Manutenção',
        type: 'FATTENING',
        isActive: true
      },
      {
        code: 'TRA',
        name: 'Transporte',
        type: 'FATTENING',
        isActive: true
      }
    ];
    
    for (const center of basicCenters) {
      // Verificar se já existe
      const existing = await prisma.costCenter.findFirst({
        where: { code: center.code }
      });
      
      if (existing) {
        console.log(`⚠️  Centro ${center.code} já existe`);
      } else {
        const created = await prisma.costCenter.create({
          data: center
        });
        console.log(`✅ Centro criado: [${created.code}] ${created.name}`);
      }
    }
    
    // Criar alguns sub-centros para o Administrativo
    const admCenter = await prisma.costCenter.findFirst({
      where: { code: 'ADM' }
    });
    
    if (admCenter) {
      const subCenters = [
        {
          code: 'ADM-ESC',
          name: 'Escritório',
          type: 'ADMINISTRATIVE',
          parentId: admCenter.id,
          isActive: true
        },
        {
          code: 'ADM-CON',
          name: 'Contabilidade',
          type: 'ADMINISTRATIVE',
          parentId: admCenter.id,
          isActive: true
        },
        {
          code: 'ADM-TI',
          name: 'Tecnologia',
          type: 'ADMINISTRATIVE',
          parentId: admCenter.id,
          isActive: true
        }
      ];
      
      for (const subCenter of subCenters) {
        const existing = await prisma.costCenter.findFirst({
          where: { code: subCenter.code }
        });
        
        if (!existing) {
          const created = await prisma.costCenter.create({
            data: subCenter
          });
          console.log(`  ↳ Sub-centro criado: [${created.code}] ${created.name}`);
        }
      }
    }
    
    console.log('\n✨ Centros de Custo básicos criados com sucesso!');
    console.log('\n📊 Resumo dos Centros de Custo:');
    
    const allCenters = await prisma.costCenter.findMany({
      orderBy: { code: 'asc' },
      include: {
        parent: true,
        _count: {
          select: { children: true }
        }
      }
    });
    
    console.log('================================');
    allCenters.forEach(cc => {
      const level = cc.parentId ? '  ↳ ' : '';
      console.log(`${level}[${cc.code}] ${cc.name} (${cc.type})`);
      if (cc._count.children > 0) {
        console.log(`     └─ ${cc._count.children} sub-centros`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar centros de custo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBasicCostCenters();
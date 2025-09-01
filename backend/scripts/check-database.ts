import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('\n🔍 VARREDURA COMPLETA DO BANCO DE DADOS\n');
  console.log('=' .repeat(60));
  
  const tables = [
    { name: 'users', model: prisma.user },
    { name: 'partners', model: prisma.partner },
    { name: 'payerAccounts', model: prisma.payerAccount },
    { name: 'pens', model: prisma.pen },
    { name: 'cycles', model: prisma.cycle },
    { name: 'costCenters', model: prisma.costCenter },
    { name: 'cattlePurchases', model: prisma.cattlePurchase },
    { name: 'penAllocations', model: prisma.penAllocation },
    { name: 'expenses', model: prisma.expense },
    { name: 'revenues', model: prisma.revenue },
    { name: 'saleRecords', model: prisma.saleRecord },
    { name: 'saleItems', model: prisma.saleItem },
    { name: 'weightReadings', model: prisma.weightReading },
    { name: 'deathRecords', model: prisma.deathRecord },
    { name: 'healthRecords', model: prisma.healthRecord },
    { name: 'feedRecords', model: prisma.feedRecord },
    { name: 'inventoryMovements', model: prisma.inventoryMovement },
    { name: 'bankStatements', model: prisma.bankStatement },
    { name: 'cashFlows', model: prisma.cashFlow },
    { name: 'documents', model: prisma.document },
    { name: 'notifications', model: prisma.notification },
    { name: 'auditLogs', model: prisma.auditLog },
  ];
  
  let totalRecords = 0;
  const summary: any[] = [];
  
  for (const table of tables) {
    try {
      const count = await (table.model as any).count();
      totalRecords += count;
      
      if (count > 0) {
        console.log(`\n📊 ${table.name.toUpperCase()}: ${count} registro(s)`);
        console.log('-'.repeat(40));
        
        // Pega até 3 registros como amostra
        const samples = await (table.model as any).findMany({
          take: 3,
          orderBy: { createdAt: 'desc' }
        });
        
        if (samples.length > 0) {
          console.log('Amostra dos dados:');
          samples.forEach((item: any, index: number) => {
            console.log(`  ${index + 1}. ID: ${item.id}`);
            
            // Mostra campos relevantes dependendo da tabela
            if (table.name === 'users') {
              console.log(`     Nome: ${item.name}, Email: ${item.email}, Role: ${item.role}`);
            } else if (table.name === 'cattlePurchases') {
              console.log(`     Lote: ${item.lotNumber}, Status: ${item.status}, Qtd: ${item.quantity}`);
            } else if (table.name === 'partners') {
              console.log(`     Nome: ${item.name}, Tipo: ${item.type}, CPF/CNPJ: ${item.cpfCnpj}`);
            } else if (table.name === 'pens') {
              console.log(`     Nome: ${item.name}, Capacidade: ${item.capacity}, Ocupação: ${item.currentOccupancy}`);
            } else if (table.name === 'expenses') {
              console.log(`     Descrição: ${item.description}, Valor: R$ ${item.amount}`);
            } else if (table.name === 'revenues') {
              console.log(`     Descrição: ${item.description}, Valor: R$ ${item.amount}`);
            } else if (item.name) {
              console.log(`     Nome: ${item.name}`);
            } else if (item.description) {
              console.log(`     Descrição: ${item.description}`);
            }
          });
        }
        
        summary.push({
          tabela: table.name,
          registros: count,
          temDados: true
        });
      } else {
        summary.push({
          tabela: table.name,
          registros: 0,
          temDados: false
        });
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar ${table.name}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 RESUMO GERAL\n');
  console.log('Tabelas com dados:');
  summary
    .filter(t => t.temDados)
    .forEach(t => console.log(`  ✅ ${t.tabela}: ${t.registros} registros`));
  
  console.log('\nTabelas vazias:');
  summary
    .filter(t => !t.temDados)
    .forEach(t => console.log(`  ⚪ ${t.tabela}`));
  
  console.log(`\n📊 Total geral: ${totalRecords} registros em ${tables.length} tabelas`);
  console.log(`📁 Tabelas com dados: ${summary.filter(t => t.temDados).length}`);
  console.log(`📂 Tabelas vazias: ${summary.filter(t => !t.temDados).length}`);
  
  await prisma.$disconnect();
}

checkDatabase().catch(console.error);
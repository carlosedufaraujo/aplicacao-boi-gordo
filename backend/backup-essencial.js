const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fazerBackupEssencial() {
  console.log('🔐 FAZENDO BACKUP DOS DADOS ESSENCIAIS');
  console.log('======================================\n');
  
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      database: 'aplicacao-boi-gordo',
      tables: {}
    };
    
    console.log('📊 Salvando dados principais:\n');
    
    // Dados essenciais
    console.log('1️⃣ Usuários...');
    backupData.tables.users = await prisma.user.findMany();
    console.log(`   ✅ ${backupData.tables.users.length} usuários`);
    
    console.log('2️⃣ Parceiros...');
    backupData.tables.partners = await prisma.partner.findMany();
    console.log(`   ✅ ${backupData.tables.partners.length} parceiros`);
    
    console.log('3️⃣ Currais...');
    backupData.tables.pens = await prisma.pen.findMany();
    console.log(`   ✅ ${backupData.tables.pens.length} currais`);
    
    console.log('4️⃣ Compras de gado...');
    backupData.tables.cattlePurchases = await prisma.cattlePurchase.findMany();
    console.log(`   ✅ ${backupData.tables.cattlePurchases.length} compras`);
    
    console.log('5️⃣ Alocações em currais...');
    backupData.tables.lotPenLinks = await prisma.lotPenLink.findMany();
    console.log(`   ✅ ${backupData.tables.lotPenLinks.length} alocações`);
    
    console.log('6️⃣ Categorias...');
    backupData.tables.categories = await prisma.category.findMany();
    console.log(`   ✅ ${backupData.tables.categories.length} categorias`);
    
    console.log('7️⃣ Movimentações financeiras...');
    backupData.tables.cashFlows = await prisma.cashFlow.findMany();
    console.log(`   ✅ ${backupData.tables.cashFlows.length} movimentações`);
    
    console.log('8️⃣ Despesas...');
    backupData.tables.expenses = await prisma.expense.findMany();
    console.log(`   ✅ ${backupData.tables.expenses.length} despesas`);
    
    // Salvar backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.json`;
    const backupPath = path.join(__dirname, backupFileName);
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    // Estatísticas
    const totalRegistros = Object.values(backupData.tables).reduce((sum, table) => sum + table.length, 0);
    const tamanhoArquivo = (fs.statSync(backupPath).size / 1024 / 1024).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ BACKUP CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`📁 Arquivo: ${backupFileName}`);
    console.log(`📊 Total de registros salvos: ${totalRegistros}`);
    console.log(`💾 Tamanho: ${tamanhoArquivo} MB`);
    console.log(`📍 Local: ${backupPath}`);
    
    console.log('\n🔐 DADOS SEGUROS! Backup realizado com sucesso.');
    console.log('\n📝 Resumo dos dados salvos:');
    console.log(`   • ${backupData.tables.cattlePurchases.length} compras de gado`);
    console.log(`   • ${backupData.tables.pens.length} currais`);
    console.log(`   • ${backupData.tables.lotPenLinks.length} alocações`);
    console.log(`   • ${backupData.tables.cashFlows.length} movimentações financeiras`);
    console.log(`   • ${backupData.tables.expenses.length} despesas`);
    
    // Criar CSV das compras para segurança extra
    const csvData = backupData.tables.cattlePurchases.map(p => ({
      lotCode: p.lotCode,
      vendorId: p.vendorId,
      purchaseDate: p.purchaseDate,
      initialQuantity: p.initialQuantity,
      purchaseWeight: p.purchaseWeight,
      pricePerArroba: p.pricePerArroba,
      purchaseValue: p.purchaseValue,
      commission: p.commission,
      freightCost: p.freightCost
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    fs.writeFileSync(
      path.join(__dirname, `backup-compras-${timestamp}.csv`),
      csvContent
    );
    
    console.log(`\n📄 Backup CSV das compras também criado!`);
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fazerBackupEssencial();
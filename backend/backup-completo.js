const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Tentar diferentes URLs de conexão
const connectionUrls = [
  'postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
  'postgresql://postgres:368308450Ce*@db.vffxtvuqhlhcbbyqmynz.supabase.co:5432/postgres',
  'postgresql://postgres:368308450Ce*@db.vffxtvuqhlhcbbyqmynz.supabase.co:6543/postgres?pgbouncer=true'
];

async function tentarConexao() {
  for (const url of connectionUrls) {
    console.log(`🔄 Tentando conectar com: ${url.split('@')[1].split('/')[0]}...`);
    
    const prisma = new PrismaClient({
      datasources: {
        db: { url }
      },
      log: ['error']
    });
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Conexão estabelecida!');
      return prisma;
    } catch (error) {
      console.log('❌ Falhou');
      await prisma.$disconnect();
    }
  }
  
  throw new Error('Não foi possível conectar ao banco de dados');
}

async function fazerBackup() {
  console.log('🔐 INICIANDO BACKUP COMPLETO DO BANCO DE DADOS');
  console.log('==============================================\n');
  
  let prisma;
  
  try {
    prisma = await tentarConexao();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      database: 'aplicacao-boi-gordo',
      tables: {}
    };
    
    console.log('\n📊 Fazendo backup das tabelas:\n');
    
    // 1. Usuários
    console.log('👥 Backing up users...');
    backupData.tables.users = await prisma.user.findMany();
    console.log(`   ✅ ${backupData.tables.users.length} usuários salvos`);
    
    // 2. Parceiros
    console.log('🤝 Backing up partners...');
    backupData.tables.partners = await prisma.partner.findMany();
    console.log(`   ✅ ${backupData.tables.partners.length} parceiros salvos`);
    
    // 3. Contas pagadoras
    console.log('💳 Backing up payer accounts...');
    backupData.tables.payerAccounts = await prisma.payerAccount.findMany();
    console.log(`   ✅ ${backupData.tables.payerAccounts.length} contas pagadoras salvas`);
    
    // 4. Currais
    console.log('🏠 Backing up pens...');
    backupData.tables.pens = await prisma.pen.findMany();
    console.log(`   ✅ ${backupData.tables.pens.length} currais salvos`);
    
    // 5. Compras de gado
    console.log('🐂 Backing up cattle purchases...');
    backupData.tables.cattlePurchases = await prisma.cattlePurchase.findMany();
    console.log(`   ✅ ${backupData.tables.cattlePurchases.length} compras salvas`);
    
    // 6. Alocações em currais
    console.log('📍 Backing up lot pen links...');
    backupData.tables.lotPenLinks = await prisma.lotPenLink.findMany();
    console.log(`   ✅ ${backupData.tables.lotPenLinks.length} alocações salvas`);
    
    // 7. Categorias
    console.log('📁 Backing up categories...');
    backupData.tables.categories = await prisma.category.findMany();
    console.log(`   ✅ ${backupData.tables.categories.length} categorias salvas`);
    
    // 8. CashFlow
    console.log('💰 Backing up cash flows...');
    backupData.tables.cashFlows = await prisma.cashFlow.findMany();
    console.log(`   ✅ ${backupData.tables.cashFlows.length} movimentações salvas`);
    
    // 9. Despesas
    console.log('💸 Backing up expenses...');
    backupData.tables.expenses = await prisma.expense.findMany();
    console.log(`   ✅ ${backupData.tables.expenses.length} despesas salvas`);
    
    // 10. Receitas
    console.log('💵 Backing up revenues...');
    backupData.tables.revenues = await prisma.revenue.findMany();
    console.log(`   ✅ ${backupData.tables.revenues.length} receitas salvas`);
    
    // 11. Vendas
    console.log('🛒 Backing up sale records...');
    backupData.tables.saleRecords = await prisma.saleRecord.findMany();
    console.log(`   ✅ ${backupData.tables.saleRecords.length} vendas salvas`);
    
    // 12. Eventos do calendário
    console.log('📅 Backing up calendar events...');
    backupData.tables.calendarEvents = await prisma.calendarEvent.findMany();
    console.log(`   ✅ ${backupData.tables.calendarEvents.length} eventos salvos`);
    
    // 13. Ciclos (pode não existir)
    try {
      console.log('🔄 Backing up cycles...');
      backupData.tables.cycles = await prisma.cycle?.findMany() || [];
      console.log(`   ✅ ${backupData.tables.cycles.length} ciclos salvos`);
    } catch (e) {
      console.log('   ⚠️ Tabela cycles não encontrada');
      backupData.tables.cycles = [];
    }
    
    // 14. Análises de mortalidade
    console.log('📊 Backing up mortality analyses...');
    backupData.tables.mortalityAnalyses = await prisma.mortalityAnalysis.findMany();
    console.log(`   ✅ ${backupData.tables.mortalityAnalyses.length} análises salvas`);
    
    // 15. Registros de morte
    console.log('💀 Backing up death records...');
    backupData.tables.deathRecords = await prisma.deathRecord.findMany();
    console.log(`   ✅ ${backupData.tables.deathRecords.length} registros de morte salvos`);
    
    // 16. Intervenções de saúde
    console.log('💉 Backing up health interventions...');
    backupData.tables.healthInterventions = await prisma.healthIntervention.findMany();
    console.log(`   ✅ ${backupData.tables.healthInterventions.length} intervenções salvas`);
    
    // 17. Transportadoras
    console.log('🚚 Backing up transport companies...');
    backupData.tables.transportCompanies = await prisma.transportCompany.findMany();
    console.log(`   ✅ ${backupData.tables.transportCompanies.length} transportadoras salvas`);
    
    // 18. Corretores
    console.log('👔 Backing up brokers...');
    backupData.tables.brokers = await prisma.broker.findMany();
    console.log(`   ✅ ${backupData.tables.brokers.length} corretores salvos`);
    
    // Salvar backup em arquivo JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-completo-${timestamp}.json`;
    const backupPath = path.join(__dirname, backupFileName);
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    // Calcular estatísticas
    const totalRegistros = Object.values(backupData.tables).reduce((sum, table) => sum + table.length, 0);
    const tamanhoArquivo = (fs.statSync(backupPath).size / 1024 / 1024).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ BACKUP CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`📁 Arquivo: ${backupFileName}`);
    console.log(`📊 Total de registros: ${totalRegistros}`);
    console.log(`💾 Tamanho do arquivo: ${tamanhoArquivo} MB`);
    console.log(`📍 Local: ${backupPath}`);
    
    // Criar arquivo de resumo
    const resumo = {
      arquivo: backupFileName,
      data: new Date().toLocaleString('pt-BR'),
      tabelas: Object.entries(backupData.tables).map(([nome, dados]) => ({
        nome,
        registros: dados.length
      })),
      totalRegistros,
      tamanhoMB: tamanhoArquivo
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'backup-resumo.json'),
      JSON.stringify(resumo, null, 2)
    );
    
    console.log('\n📝 Arquivo de resumo criado: backup-resumo.json');
    console.log('\n🔐 BACKUP SEGURO! Agora você pode reiniciar o projeto tranquilamente.');
    
  } catch (error) {
    console.error('\n❌ ERRO NO BACKUP:', error.message);
    console.log('\n⚠️ Não foi possível fazer backup.');
    console.log('O banco pode estar temporariamente inacessível.');
    console.log('\nOpções:');
    console.log('1. Aguarde alguns minutos e tente novamente');
    console.log('2. Reinicie o projeto (os dados são preservados pelo Supabase)');
    console.log('3. O Supabase mantém backups automáticos diários');
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

fazerBackup();
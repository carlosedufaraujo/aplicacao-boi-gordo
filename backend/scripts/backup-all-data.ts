import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backupAllData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -1);
  const backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}`);

  // Criar diretório de backup
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🔄 Iniciando backup completo do sistema...');
  console.log(`📁 Diretório de backup: ${backupDir}\n`);

  const backupData: any = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'boi_gordo_db'
    },
    data: {}
  };

  try {
    // 1. USUÁRIOS
    console.log('👤 Fazendo backup de usuários...');
    const users = await prisma.user.findMany();
    backupData.data.users = users;
    console.log(`   ✅ ${users.length} usuários`);

    // 2. PARCEIROS (Fornecedores, Compradores, etc)
    console.log('🤝 Fazendo backup de parceiros...');
    const partners = await prisma.partner.findMany();
    backupData.data.partners = partners;
    console.log(`   ✅ ${partners.length} parceiros`);

    // 3. CONTAS PAGADORAS
    console.log('💳 Fazendo backup de contas pagadoras...');
    const payerAccounts = await prisma.payerAccount.findMany();
    backupData.data.payerAccounts = payerAccounts;
    console.log(`   ✅ ${payerAccounts.length} contas`);

    // 4. CATEGORIAS
    console.log('📂 Fazendo backup de categorias...');
    const categories = await prisma.category.findMany();
    backupData.data.categories = categories;
    console.log(`   ✅ ${categories.length} categorias`);

    // 5. CURRAIS
    console.log('🏠 Fazendo backup de currais...');
    const pens = await prisma.pen.findMany();
    backupData.data.pens = pens;
    console.log(`   ✅ ${pens.length} currais`);

    // 6. COMPRAS DE GADO
    console.log('🐂 Fazendo backup de compras de gado...');
    const cattlePurchases = await prisma.cattlePurchase.findMany();
    backupData.data.cattlePurchases = cattlePurchases;
    console.log(`   ✅ ${cattlePurchases.length} compras`);

    // 7. VENDAS
    console.log('💰 Fazendo backup de vendas...');
    const saleRecords = await prisma.saleRecord.findMany();
    backupData.data.saleRecords = saleRecords;
    console.log(`   ✅ ${saleRecords.length} vendas`);

    // 8. DESPESAS
    console.log('💸 Fazendo backup de despesas...');
    const expenses = await prisma.expense.findMany();
    backupData.data.expenses = expenses;
    console.log(`   ✅ ${expenses.length} despesas`);

    // 9. RECEITAS
    console.log('💵 Fazendo backup de receitas...');
    const revenues = await prisma.revenue.findMany();
    backupData.data.revenues = revenues;
    console.log(`   ✅ ${revenues.length} receitas`);

    // 10. FLUXO DE CAIXA
    console.log('📊 Fazendo backup de fluxo de caixa...');
    const cashFlows = await prisma.cashFlow.findMany();
    backupData.data.cashFlows = cashFlows;
    console.log(`   ✅ ${cashFlows.length} registros de fluxo de caixa`);

    // 11. INTERVENÇÕES
    console.log('💉 Fazendo backup de intervenções...');
    const interventions = await prisma.intervention.findMany();
    backupData.data.interventions = interventions;
    console.log(`   ✅ ${interventions.length} intervenções`);

    // 12. MORTALIDADE
    console.log('☠️ Fazendo backup de registros de mortalidade...');
    const deathRecords = await prisma.deathRecord.findMany();
    backupData.data.deathRecords = deathRecords;
    console.log(`   ✅ ${deathRecords.length} registros de mortalidade`);

    // 13. ALOCAÇÕES DE CURRAIS
    console.log('📍 Fazendo backup de alocações de currais...');
    const penAllocations = await prisma.penAllocation.findMany();
    backupData.data.penAllocations = penAllocations;
    console.log(`   ✅ ${penAllocations.length} alocações`);

    // 14. EVENTOS DO CALENDÁRIO
    console.log('📅 Fazendo backup de eventos do calendário...');
    const calendarEvents = await prisma.calendarEvent.findMany();
    backupData.data.calendarEvents = calendarEvents;
    console.log(`   ✅ ${calendarEvents.length} eventos`);

    // 15. CICLOS
    console.log('🔄 Fazendo backup de ciclos...');
    const cycles = await prisma.cycle.findMany();
    backupData.data.cycles = cycles;
    console.log(`   ✅ ${cycles.length} ciclos`);

    // Salvar backup completo em JSON
    const backupFile = path.join(backupDir, 'complete-backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`\n✅ Backup completo salvo em: ${backupFile}`);

    // Salvar arquivos individuais para cada entidade
    console.log('\n📝 Salvando arquivos individuais...');
    for (const [entity, data] of Object.entries(backupData.data)) {
      const entityFile = path.join(backupDir, `${entity}.json`);
      fs.writeFileSync(entityFile, JSON.stringify(data, null, 2));
      console.log(`   ✅ ${entity}.json`);
    }

    // Criar resumo do backup
    const summary = {
      timestamp: backupData.metadata.timestamp,
      totalRecords: {
        users: users.length,
        partners: partners.length,
        payerAccounts: payerAccounts.length,
        categories: categories.length,
        pens: pens.length,
        cattlePurchases: cattlePurchases.length,
        saleRecords: saleRecords.length,
        expenses: expenses.length,
        revenues: revenues.length,
        cashFlows: cashFlows.length,
        interventions: interventions.length,
        deathRecords: deathRecords.length,
        penAllocations: penAllocations.length,
        calendarEvents: calendarEvents.length,
        cycles: cycles.length
      },
      backupLocation: backupDir
    };

    const summaryFile = path.join(backupDir, 'backup-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DO BACKUP:');
    console.log('='.repeat(50));
    Object.entries(summary.totalRecords).forEach(([entity, count]) => {
      console.log(`${entity.padEnd(20)}: ${count} registros`);
    });
    console.log('='.repeat(50));
    console.log(`\n🎉 BACKUP COMPLETO COM SUCESSO!`);
    console.log(`📁 Local: ${backupDir}`);
    console.log(`📝 Arquivos criados: ${Object.keys(backupData.data).length + 2} arquivos`);

    return summary;

  } catch (error) {
    console.error('❌ Erro durante o backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar backup
backupAllData()
  .then((summary) => {
    console.log('\n✅ Processo de backup finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha no processo de backup:', error);
    process.exit(1);
  });
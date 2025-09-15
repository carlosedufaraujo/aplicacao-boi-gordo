import { PrismaClient } from '../backend/node_modules/@prisma/client/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function createCompleteBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `backup-${timestamp}`);
  
  // Criar diretório de backup
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🗄️ INICIANDO BACKUP COMPLETO DO BOVICONTROL');
  console.log(`📁 Diretório: ${backupDir}`);
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('');

  const backupSummary = {
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleString('pt-BR'),
    tables: {},
    totalRecords: 0
  };

  try {
    // 1. BACKUP DE USUÁRIOS
    console.log('👥 Fazendo backup de usuários...');
    const users = await prisma.user.findMany({
      include: {
        _count: true
      }
    });
    await saveToFile(backupDir, 'users.json', users);
    backupSummary.tables.users = users.length;
    console.log(`   ✅ ${users.length} usuários salvos`);

    // 2. BACKUP DE PARCEIROS
    console.log('🤝 Fazendo backup de parceiros...');
    const partners = await prisma.partner.findMany();
    await saveToFile(backupDir, 'partners.json', partners);
    backupSummary.tables.partners = partners.length;
    console.log(`   ✅ ${partners.length} parceiros salvos`);

    // 3. BACKUP DE CURRAIS
    console.log('🏠 Fazendo backup de currais...');
    const pens = await prisma.pen.findMany();
    await saveToFile(backupDir, 'pens.json', pens);
    backupSummary.tables.pens = pens.length;
    console.log(`   ✅ ${pens.length} currais salvos`);

    // 4. BACKUP DE CONTAS PAGADORAS
    console.log('💳 Fazendo backup de contas pagadoras...');
    const payerAccounts = await prisma.payerAccount.findMany();
    await saveToFile(backupDir, 'payer-accounts.json', payerAccounts);
    backupSummary.tables.payerAccounts = payerAccounts.length;
    console.log(`   ✅ ${payerAccounts.length} contas pagadoras salvas`);

    // 5. BACKUP DE COMPRAS DE GADO
    console.log('🐄 Fazendo backup de compras de gado...');
    const cattlePurchases = await prisma.cattlePurchase.findMany({
      include: {
        vendor: {
          select: { id: true, name: true, cpfCnpj: true }
        },
        payerAccount: {
          select: { id: true, accountName: true }
        }
      }
    });
    await saveToFile(backupDir, 'cattle-purchases.json', cattlePurchases);
    backupSummary.tables.cattlePurchases = cattlePurchases.length;
    console.log(`   ✅ ${cattlePurchases.length} compras de gado salvas`);

    // 6. BACKUP DE DESPESAS
    console.log('💸 Fazendo backup de despesas...');
    const expenses = await prisma.expense.findMany({
      include: {
        payerAccount: {
          select: { id: true, accountName: true }
        }
      }
    });
    await saveToFile(backupDir, 'expenses.json', expenses);
    backupSummary.tables.expenses = expenses.length;
    console.log(`   ✅ ${expenses.length} despesas salvas`);

    // 7. BACKUP DE RECEITAS
    console.log('💰 Fazendo backup de receitas...');
    const revenues = await prisma.revenue.findMany();
    await saveToFile(backupDir, 'revenues.json', revenues);
    backupSummary.tables.revenues = revenues.length;
    console.log(`   ✅ ${revenues.length} receitas salvas`);

    // 8. BACKUP DE REGISTROS DE VENDA
    console.log('📊 Fazendo backup de registros de venda...');
    const saleRecords = await prisma.saleRecord.findMany({
      include: {
        buyer: {
          select: { id: true, name: true, cpfCnpj: true }
        }
      }
    });
    await saveToFile(backupDir, 'sale-records.json', saleRecords);
    backupSummary.tables.saleRecords = saleRecords.length;
    console.log(`   ✅ ${saleRecords.length} registros de venda salvos`);

    // 9. BACKUP DE INTERVENÇÕES DE SAÚDE
    console.log('💉 Fazendo backup de intervenções de saúde...');
    const healthInterventions = await prisma.healthIntervention.findMany();
    await saveToFile(backupDir, 'health-interventions.json', healthInterventions);
    backupSummary.tables.healthInterventions = healthInterventions.length;
    console.log(`   ✅ ${healthInterventions.length} intervenções de saúde salvas`);

    // 10. BACKUP DE FLUXO DE CAIXA
    console.log('💹 Fazendo backup de fluxo de caixa...');
    const cashFlows = await prisma.cashFlow.findMany({
      include: {
        account: {
          select: { id: true, accountName: true }
        }
      }
    });
    await saveToFile(backupDir, 'cash-flows.json', cashFlows);
    backupSummary.tables.cashFlows = cashFlows.length;
    console.log(`   ✅ ${cashFlows.length} registros de fluxo de caixa salvos`);

    // 11. BACKUP DE MOVIMENTAÇÕES DE CURRAIS
    console.log('🏡 Fazendo backup de movimentações de currais...');
    const penMovements = await prisma.penMovement.findMany();
    await saveToFile(backupDir, 'pen-movements.json', penMovements);
    backupSummary.tables.penMovements = penMovements.length;
    console.log(`   ✅ ${penMovements.length} movimentações de currais salvas`);

    // 12. BACKUP DE EVENTOS DE CALENDÁRIO
    console.log('📅 Fazendo backup de eventos de calendário...');
    const calendarEvents = await prisma.calendarEvent.findMany();
    await saveToFile(backupDir, 'calendar-events.json', calendarEvents);
    backupSummary.tables.calendarEvents = calendarEvents.length;
    console.log(`   ✅ ${calendarEvents.length} eventos de calendário salvos`);

    // 13. BACKUP DE CENTROS DE CUSTO
    console.log('🏢 Fazendo backup de centros de custo...');
    const costCenters = await prisma.costCenter.findMany();
    await saveToFile(backupDir, 'cost-centers.json', costCenters);
    backupSummary.tables.costCenters = costCenters.length;
    console.log(`   ✅ ${costCenters.length} centros de custo salvos`);

    // 14. BACKUP DE CATEGORIAS
    console.log('🏷️ Fazendo backup de categorias...');
    const categories = await prisma.category.findMany();
    await saveToFile(backupDir, 'categories.json', categories);
    backupSummary.tables.categories = categories.length;
    console.log(`   ✅ ${categories.length} categorias salvas`);

    // 15. BACKUP DE REGISTROS DE MORTALIDADE
    console.log('💀 Fazendo backup de registros de mortalidade...');
    const mortalityRecords = await prisma.mortalityRecord.findMany();
    await saveToFile(backupDir, 'mortality-records.json', mortalityRecords);
    backupSummary.tables.mortalityRecords = mortalityRecords.length;
    console.log(`   ✅ ${mortalityRecords.length} registros de mortalidade salvos`);

    // 16. BACKUP DE REGISTROS DE MORTE
    console.log('⚰️ Fazendo backup de registros de morte...');
    const deathRecords = await prisma.deathRecord.findMany();
    await saveToFile(backupDir, 'death-records.json', deathRecords);
    backupSummary.tables.deathRecords = deathRecords.length;
    console.log(`   ✅ ${deathRecords.length} registros de morte salvos`);

    // 17. BACKUP DE TRANSAÇÕES FINANCEIRAS
    console.log('💳 Fazendo backup de transações financeiras...');
    const financialTransactions = await prisma.financialTransaction.findMany();
    await saveToFile(backupDir, 'financial-transactions.json', financialTransactions);
    backupSummary.tables.financialTransactions = financialTransactions.length;
    console.log(`   ✅ ${financialTransactions.length} transações financeiras salvas`);

    // Calcular total de registros
    backupSummary.totalRecords = Object.values(backupSummary.tables).reduce((sum, count) => sum + count, 0);

    // Salvar resumo do backup
    await saveToFile(backupDir, 'backup-summary.json', backupSummary);

    // Criar arquivo README
    const readmeContent = `# BACKUP COMPLETO - BOVICONTROL

## 📋 Informações do Backup

- **Data de Criação:** ${backupSummary.date}
- **Timestamp:** ${backupSummary.timestamp}
- **Total de Registros:** ${backupSummary.totalRecords}

## 📊 Tabelas Incluídas

${Object.entries(backupSummary.tables).map(([table, count]) => `- **${table}:** ${count} registros`).join('\n')}

## 📁 Arquivos de Backup

${Object.keys(backupSummary.tables).map(table => `- \`${table}.json\` - Dados da tabela ${table}`).join('\n')}
- \`backup-summary.json\` - Resumo do backup
- \`README.md\` - Este arquivo

## 🔄 Como Restaurar

Para restaurar os dados, use o script de restauração:

\`\`\`bash
node scripts/restore-backup.js ${path.basename(backupDir)}
\`\`\`

## ⚠️ Observações

- Este backup contém todos os dados do sistema na data especificada
- Os dados estão em formato JSON para fácil leitura e restauração
- Mantenha este backup em local seguro
- Para backups automáticos, configure um cron job

---
*Backup gerado automaticamente pelo sistema BoviControl*
`;

    fs.writeFileSync(path.join(backupDir, 'README.md'), readmeContent);

    console.log('');
    console.log('🎉 BACKUP COMPLETO FINALIZADO!');
    console.log(`📁 Localização: ${backupDir}`);
    console.log(`📊 Total de registros: ${backupSummary.totalRecords}`);
    console.log('');
    console.log('📋 Resumo por tabela:');
    Object.entries(backupSummary.tables).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} registros`);
    });

    return {
      success: true,
      backupDir,
      summary: backupSummary
    };

  } catch (error) {
    console.error('❌ Erro durante o backup:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function saveToFile(dir, filename, data) {
  const filePath = path.join(dir, filename);
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonData);
}

// Executar backup se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createCompleteBackup()
    .then((result) => {
      if (result.success) {
        console.log('✅ Backup concluído com sucesso!');
        process.exit(0);
      } else {
        console.error('❌ Backup falhou:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { createCompleteBackup };

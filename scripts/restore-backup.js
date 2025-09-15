import { PrismaClient } from '../backend/node_modules/@prisma/client/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function restoreBackup(backupDirName) {
  const backupDir = path.join(__dirname, '..', 'backups', backupDirName);
  
  if (!fs.existsSync(backupDir)) {
    console.error(`❌ Diretório de backup não encontrado: ${backupDir}`);
    return { success: false, error: 'Diretório não encontrado' };
  }

  console.log('🔄 INICIANDO RESTAURAÇÃO DO BACKUP BOVICONTROL');
  console.log(`📁 Diretório: ${backupDir}`);
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('');

  // Ler resumo do backup
  const summaryPath = path.join(backupDir, 'backup-summary.json');
  let backupSummary = {};
  if (fs.existsSync(summaryPath)) {
    backupSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    console.log(`📊 Backup original: ${backupSummary.date}`);
    console.log(`📋 Total de registros: ${backupSummary.totalRecords}`);
    console.log('');
  }

  const restoreSummary = {
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleString('pt-BR'),
    backupSource: backupDirName,
    tables: {},
    totalRestored: 0,
    errors: []
  };

  try {
    // IMPORTANTE: A ordem de restauração é crucial devido às dependências entre tabelas
    
    // 1. RESTAURAR USUÁRIOS (sem dependências)
    await restoreTable('users', 'usuários', '👥', backupDir, restoreSummary);

    // 2. RESTAURAR PARCEIROS (sem dependências)
    await restoreTable('partners', 'parceiros', '🤝', backupDir, restoreSummary);

    // 3. RESTAURAR CONTAS PAGADORAS (sem dependências)
    await restoreTable('payer-accounts', 'contas pagadoras', '💳', backupDir, restoreSummary, 'payerAccount');

    // 4. RESTAURAR CURRAIS (sem dependências)
    await restoreTable('pens', 'currais', '🏠', backupDir, restoreSummary, 'pen');

    // 5. RESTAURAR CATEGORIAS (sem dependências)
    await restoreTable('categories', 'categorias', '🏷️', backupDir, restoreSummary, 'category');

    // 6. RESTAURAR CENTROS DE CUSTO (sem dependências)
    await restoreTable('cost-centers', 'centros de custo', '🏢', backupDir, restoreSummary, 'costCenter');

    // 7. RESTAURAR COMPRAS DE GADO (depende de parceiros e contas)
    await restoreTable('cattle-purchases', 'compras de gado', '🐄', backupDir, restoreSummary, 'cattlePurchase');

    // 8. RESTAURAR DESPESAS (depende de contas)
    await restoreTable('expenses', 'despesas', '💸', backupDir, restoreSummary, 'expense');

    // 9. RESTAURAR RECEITAS (sem dependências principais)
    await restoreTable('revenues', 'receitas', '💰', backupDir, restoreSummary, 'revenue');

    // 10. RESTAURAR FLUXO DE CAIXA (depende de contas)
    await restoreTable('cash-flows', 'fluxo de caixa', '💹', backupDir, restoreSummary, 'cashFlow');

    // 11. RESTAURAR TRANSAÇÕES FINANCEIRAS (depende de parceiros)
    await restoreTable('financial-transactions', 'transações financeiras', '💳', backupDir, restoreSummary, 'financialTransaction');

    // 12. RESTAURAR EVENTOS DE CALENDÁRIO (sem dependências principais)
    await restoreTable('calendar-events', 'eventos de calendário', '📅', backupDir, restoreSummary, 'calendarEvent');

    // 13. RESTAURAR REGISTROS DE VENDA (depende de parceiros)
    await restoreTable('sale-records', 'registros de venda', '📊', backupDir, restoreSummary, 'saleRecord');

    // 14. RESTAURAR REGISTROS DE MORTE (depende de usuários)
    await restoreTable('death-records', 'registros de morte', '⚰️', backupDir, restoreSummary, 'deathRecord');

    // 15. RESTAURAR REGISTROS DE MORTALIDADE (sem dependências principais)
    await restoreTable('mortality-records', 'registros de mortalidade', '💀', backupDir, restoreSummary, 'mortalityRecord');

    // 16. RESTAURAR INTERVENÇÕES DE SAÚDE (sem dependências principais)
    await restoreTable('health-interventions', 'intervenções de saúde', '💉', backupDir, restoreSummary, 'healthIntervention');

    // 17. RESTAURAR MOVIMENTAÇÕES DE CURRAIS (depende de currais)
    await restoreTable('pen-movements', 'movimentações de currais', '🏡', backupDir, restoreSummary, 'penMovement');

    // Calcular total restaurado
    restoreSummary.totalRestored = Object.values(restoreSummary.tables).reduce((sum, count) => sum + count, 0);

    console.log('');
    console.log('🎉 RESTAURAÇÃO COMPLETA FINALIZADA!');
    console.log(`📊 Total de registros restaurados: ${restoreSummary.totalRestored}`);
    
    if (restoreSummary.errors.length > 0) {
      console.log(`⚠️ Erros encontrados: ${restoreSummary.errors.length}`);
      restoreSummary.errors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }

    console.log('');
    console.log('📋 Resumo por tabela:');
    Object.entries(restoreSummary.tables).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} registros`);
    });

    // Salvar log da restauração
    const restoreLogPath = path.join(backupDir, 'restore-log.json');
    fs.writeFileSync(restoreLogPath, JSON.stringify(restoreSummary, null, 2));

    return {
      success: true,
      summary: restoreSummary
    };

  } catch (error) {
    console.error('❌ Erro durante a restauração:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function restoreTable(fileName, displayName, emoji, backupDir, restoreSummary, modelName = null) {
  const filePath = path.join(backupDir, `${fileName}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Arquivo não encontrado: ${fileName}.json`);
    restoreSummary.errors.push(`Arquivo não encontrado: ${fileName}.json`);
    return;
  }

  try {
    console.log(`${emoji} Restaurando ${displayName}...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`   ⚠️ Nenhum registro para restaurar em ${displayName}`);
      restoreSummary.tables[fileName] = 0;
      return;
    }

    // Determinar o nome do modelo Prisma
    const prismaModel = modelName || fileName.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    
    if (!prisma[prismaModel]) {
      console.log(`   ❌ Modelo Prisma não encontrado: ${prismaModel}`);
      restoreSummary.errors.push(`Modelo Prisma não encontrado: ${prismaModel}`);
      return;
    }

    // Restaurar registros em lotes para melhor performance
    const batchSize = 50;
    let restored = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        // Usar createMany para inserção em lote (mais rápido)
        const result = await prisma[prismaModel].createMany({
          data: batch,
          skipDuplicates: true // Pular duplicatas baseadas em chaves únicas
        });
        
        restored += result.count;
      } catch (batchError) {
        // Se createMany falhar, tentar inserção individual
        console.log(`   ⚠️ Lote falhou, tentando inserção individual...`);
        
        for (const record of batch) {
          try {
            await prisma[prismaModel].create({ data: record });
            restored++;
          } catch (recordError) {
            console.log(`   ⚠️ Erro ao inserir registro: ${recordError.message}`);
            restoreSummary.errors.push(`${displayName}: ${recordError.message}`);
          }
        }
      }
    }

    restoreSummary.tables[fileName] = restored;
    console.log(`   ✅ ${restored} ${displayName} restaurados`);

  } catch (error) {
    console.log(`   ❌ Erro ao restaurar ${displayName}: ${error.message}`);
    restoreSummary.errors.push(`${displayName}: ${error.message}`);
    restoreSummary.tables[fileName] = 0;
  }
}

// Executar restauração se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const backupDirName = process.argv[2];
  
  if (!backupDirName) {
    console.error('❌ Uso: node restore-backup.js <nome-do-diretorio-backup>');
    console.log('');
    console.log('📁 Backups disponíveis:');
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (fs.existsSync(backupsDir)) {
      const backups = fs.readdirSync(backupsDir).filter(dir => 
        fs.statSync(path.join(backupsDir, dir)).isDirectory()
      );
      backups.forEach(backup => {
        console.log(`   - ${backup}`);
      });
    }
    process.exit(1);
  }

  restoreBackup(backupDirName)
    .then((result) => {
      if (result.success) {
        console.log('✅ Restauração concluída com sucesso!');
        process.exit(0);
      } else {
        console.error('❌ Restauração falhou:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { restoreBackup };

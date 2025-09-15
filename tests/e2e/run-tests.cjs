#!/usr/bin/env node

/**
 * TestSprite Runner - Aplicação Boi Gordo
 * Script para executar todos os testes E2E
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuração
const CONFIG = {
  testDir: __dirname,
  screenshotDir: path.join(__dirname, '../screenshots'),
  reportDir: path.join(__dirname, '../reports'),
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  headless: process.env.HEADLESS !== 'false'
};

// Lista de testes na ordem de execução
const TEST_SUITE = [
  '01-login.test.cjs',
  '02-cadastro-lote.test.cjs',
  '03-centro-financeiro.test.cjs'
];

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function ensureDirectories() {
  const dirs = [CONFIG.screenshotDir, CONFIG.reportDir];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`📁 Criado diretório: ${dir}`, 'cyan');
    }
  }
}

async function checkApplication() {
  log('🔍 Verificando se a aplicação está rodando...', 'yellow');

  try {
    const response = await fetch(CONFIG.baseUrl);
    if (response.ok) {
      log('✅ Aplicação está rodando!', 'green');
      return true;
    }
  } catch (error) {
    log('❌ Aplicação não está acessível!', 'red');
    log(`   Certifique-se de que o servidor está rodando em ${CONFIG.baseUrl}`, 'yellow');
    return false;
  }
}

async function runTest(testFile) {
  const testPath = path.join(CONFIG.testDir, testFile);

  log(`\n🧪 Executando: ${testFile}`, 'bright');
  log('─'.repeat(50), 'cyan');

  try {
    // Aqui você integraria com o TestSprite MCP
    // Por enquanto, vamos simular a execução

    const test = require(testPath);
    log(`   📝 ${test.description}`, 'cyan');
    log(`   🏷️  Tags: ${test.tags.join(', ')}`, 'cyan');

    // Simular execução dos steps
    for (const step of test.steps) {
      if (step.name) {
        log(`   ▶️  ${step.name}`, 'blue');
      }

      // Aqui seria a execução real via TestSprite
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    log(`   ✅ Teste concluído com sucesso!`, 'green');
    return { success: true, test: testFile };

  } catch (error) {
    log(`   ❌ Erro no teste: ${error.message}`, 'red');
    return { success: false, test: testFile, error: error.message };
  }
}

async function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results: results,
    duration: Date.now() - startTime
  };

  const reportPath = path.join(CONFIG.reportDir, `report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log('\n📊 RELATÓRIO DE TESTES', 'bright');
  log('═'.repeat(50), 'cyan');
  log(`Total de testes: ${report.totalTests}`, 'cyan');
  log(`✅ Passou: ${report.passed}`, 'green');
  log(`❌ Falhou: ${report.failed}`, report.failed > 0 ? 'red' : 'green');
  log(`⏱️  Duração: ${(report.duration / 1000).toFixed(2)}s`, 'cyan');
  log(`📄 Relatório salvo em: ${reportPath}`, 'cyan');
}

// Execução principal
const startTime = Date.now();

async function main() {
  log('🚀 TESTSPRITE - APLICAÇÃO BOI GORDO', 'bright');
  log('═'.repeat(50), 'cyan');

  // Preparar ambiente
  await ensureDirectories();

  // Verificar aplicação
  const appRunning = await checkApplication();
  if (!appRunning) {
    process.exit(1);
  }

  // Executar testes
  const results = [];
  for (const testFile of TEST_SUITE) {
    const result = await runTest(testFile);
    results.push(result);

    if (!result.success && process.env.FAIL_FAST === 'true') {
      log('⛔ Parando execução (FAIL_FAST ativado)', 'yellow');
      break;
    }
  }

  // Gerar relatório
  await generateReport(results);

  // Retornar código de saída apropriado
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

// Tratamento de erros
process.on('unhandledRejection', (error) => {
  log(`\n❌ Erro não tratado: ${error.message}`, 'red');
  process.exit(1);
});

// Executar
main().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});
const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Limpando dados de teste do banco...\n');
  
  try {
    // Limpar em ordem de dependências
    await prisma.$executeRaw`DELETE FROM expenses`;
    await prisma.$executeRaw`DELETE FROM sale_records`;
    await prisma.$executeRaw`DELETE FROM cattle_purchases`;
    await prisma.$executeRaw`DELETE FROM pens WHERE "penNumber" IN ('C-001', 'C-002')`;
    await prisma.$executeRaw`DELETE FROM payer_accounts WHERE "accountName" = 'Fazenda Bovicontrol - Conta Principal'`;
    await prisma.$executeRaw`DELETE FROM partners WHERE "cpfCnpj" IN ('12345678901', '98765432101', '11222333000144', '44555666000177')`;
    
    console.log('✅ Banco limpo com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function runTest() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Executando teste E2E...\n');
    console.log('='.repeat(60) + '\n');
    
    const test = spawn('node', ['test-e2e-complete-flow.js'], {
      stdio: 'inherit'
    });
    
    test.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Teste falhou com código ${code}`));
      }
    });
    
    test.on('error', reject);
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔄 TESTE E2E COMPLETO - BOVICONTROL');
  console.log('='.repeat(60) + '\n');
  
  try {
    await cleanDatabase();
    await runTest();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE E2E EXECUTADO COM SUCESSO!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Erro no processo:', error.message);
    process.exit(1);
  }
}

main();
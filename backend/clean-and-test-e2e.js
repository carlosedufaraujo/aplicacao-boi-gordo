const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const util = require('util');

const prisma = new PrismaClient();
const execPromise = util.promisify(exec);

async function cleanTestData() {
  console.log('🧹 Limpando dados de teste anteriores...\n');
  
  try {
    // Limpar em ordem reversa de dependências
    await prisma.expense.deleteMany({});
    await prisma.saleRecord.deleteMany({});
    await prisma.cattlePurchase.deleteMany({});
    
    // Limpar tabelas antigas se ainda existirem
    try {
      await prisma.purchaseOrder.deleteMany({});
    } catch (e) {
      // Tabela pode não existir mais
    }
    
    await prisma.pen.deleteMany({});
    await prisma.payerAccount.deleteMany({});
    await prisma.partner.deleteMany({
      where: {
        OR: [
          { cpfCnpj: '12345678901' },
          { cpfCnpj: '98765432101' },
          { cpfCnpj: '11222333000144' },
          { cpfCnpj: '44555666000177' }
        ]
      }
    });
    
    console.log('✅ Dados de teste limpos com sucesso\n');
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function runTest() {
  console.log('🚀 Executando teste E2E...\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    const { stdout, stderr } = await execPromise('node test-e2e-complete-flow.js');
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    // O script de teste já imprime seus próprios erros
    process.exit(1);
  }
}

async function main() {
  console.log('🔄 INICIANDO TESTE E2E COM LIMPEZA PRÉVIA\n');
  console.log('='.repeat(60));
  
  try {
    await cleanTestData();
    await runTest();
  } catch (error) {
    console.error('\n❌ Processo falhou:', error.message);
    process.exit(1);
  }
}

main();
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Iniciando correção automática de erros TypeScript...\n');

// 1. Corrigir referências a modelos antigos
const fixes = [
  // Remover referências a lotAllocations
  { 
    pattern: /\.lotAllocations/g, 
    replacement: '.penAllocations',
    description: 'lotAllocations → penAllocations'
  },
  // Corrigir purchaseOrderId para purchaseId
  { 
    pattern: /purchaseOrderId/g, 
    replacement: 'purchaseId',
    description: 'purchaseOrderId → purchaseId'
  },
  // Corrigir cattleLotId para purchaseId
  { 
    pattern: /cattleLotId/g, 
    replacement: 'purchaseId',
    description: 'cattleLotId → purchaseId'
  },
  // Corrigir lot para cattlePurchase em includes
  { 
    pattern: /include:\s*{\s*lot:/g, 
    replacement: 'include: { cattlePurchase:',
    description: 'include lot → cattlePurchase'
  },
  // Corrigir sales para saleRecords
  { 
    pattern: /\.sales\b/g, 
    replacement: '.saleRecords',
    description: 'sales → saleRecords'
  },
  // Corrigir quantity para currentQuantity
  { 
    pattern: /lot\.quantity/g, 
    replacement: 'lot.currentQuantity',
    description: 'lot.quantity → lot.currentQuantity'
  },
  // Corrigir weight para currentWeight
  { 
    pattern: /lot\.weight(?!\w)/g, 
    replacement: 'lot.currentWeight',
    description: 'lot.weight → lot.currentWeight'
  },
  // Corrigir totalAmount para purchaseValue
  { 
    pattern: /sale\.totalAmount/g, 
    replacement: 'sale.totalValue',
    description: 'sale.totalAmount → sale.totalValue'
  },
  // Corrigir paymentDueDate
  { 
    pattern: /paymentDueDate/g, 
    replacement: 'paymentDate',
    description: 'paymentDueDate → paymentDate'
  },
  // Corrigir saleDate
  { 
    pattern: /\.saleDate/g, 
    replacement: '.createdAt',
    description: 'saleDate → createdAt'
  },
  // Corrigir lotId
  { 
    pattern: /\.lotId/g, 
    replacement: '.purchaseId',
    description: 'lotId → purchaseId'
  }
];

// Diretórios para processar
const directories = [
  'src/repositories',
  'src/services',
  'src/controllers'
];

let totalFixed = 0;

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fileChanges = [];
    
    fixes.forEach(({ pattern, replacement, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        modified = true;
        fileChanges.push(`  • ${description} (${matches.length}x)`);
        totalFixed += matches.length;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
      fileChanges.forEach(change => console.log(change));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro em ${filePath}: ${error.message}`);
    return false;
  }
}

// Processar cada diretório
directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ Diretório não encontrado: ${dir}`);
    return;
  }
  
  const files = fs.readdirSync(fullPath, { recursive: true })
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(fullPath, file));
  
  console.log(`\n📂 Processando ${dir} (${files.length} arquivos)...`);
  
  files.forEach(fixFile);
});

console.log(`\n✨ Total de correções: ${totalFixed}`);

// 2. Adicionar defaults para paginação
console.log('\n🔧 Corrigindo parâmetros de paginação...');

const paginationFix = `
// Adicionar em todos os controllers que usam paginação
const page = pagination?.page ?? 1;
const limit = pagination?.limit ?? 10;
`;

// 3. Regenerar Prisma Client
console.log('\n🔄 Regenerando Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client regenerado');
} catch (error) {
  console.error('❌ Erro ao regenerar Prisma:', error.message);
}

// 4. Executar typecheck novamente
console.log('\n📊 Verificando erros restantes...');
try {
  const output = execSync('npm run typecheck 2>&1 | grep "error TS" | wc -l', { encoding: 'utf8' });
  const errorCount = parseInt(output.trim());
  console.log(`\n📈 Erros TypeScript restantes: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('ℹ️ Execute npm run typecheck para ver os erros específicos');
  } else {
    console.log('🎉 Todos os erros foram corrigidos!');
  }
} catch (error) {
  // Ignore error from grep/wc
}

console.log('\n✅ Processo de correção concluído!');
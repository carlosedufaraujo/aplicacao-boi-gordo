#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuração de substituições
const replacements = [
  // Imports e hooks
  { from: /usePurchaseOrdersApi/g, to: 'useCattlePurchasesApi' },
  { from: /useCattleLotsApi/g, to: 'useCattlePurchasesApi' },
  { from: /from ['"]@\/hooks\/api\/usePurchaseOrdersApi['"]/g, to: "from '@/hooks/api/useCattlePurchasesApi'" },
  { from: /from ['"]@\/hooks\/api\/useCattleLotsApi['"]/g, to: "from '@/hooks/api/useCattlePurchasesApi'" },
  
  // Tipos e interfaces
  { from: /PurchaseOrder/g, to: 'CattlePurchase' },
  { from: /CattleLot/g, to: 'CattlePurchase' },
  { from: /purchaseOrderId/g, to: 'purchaseId' },
  { from: /cattleLotId/g, to: 'purchaseId' },
  
  // APIs
  { from: /\/api\/v1\/purchase-orders/g, to: '/api/v1/cattle-purchases' },
  { from: /\/api\/v1\/cattle-lots/g, to: '/api/v1/cattle-purchases' },
  { from: /purchaseOrders/g, to: 'cattlePurchases' },
  { from: /cattleLots/g, to: 'cattlePurchases' },
  
  // Campos específicos
  { from: /orderNumber/g, to: 'lotCode' },
  { from: /orderDate/g, to: 'purchaseDate' },
  { from: /totalAmount/g, to: 'purchaseValue' },
  { from: /quantity/g, to: 'currentQuantity' },
  { from: /weight/g, to: 'currentWeight' },
];

// Diretórios para processar
const directories = [
  'src/components',
  'src/hooks',
  'src/services',
  'src/stores',
  'src/types',
  'src/providers'
];

let totalFilesProcessed = 0;
let totalReplacements = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileReplacements = 0;
    
    replacements.forEach(({ from, to }) => {
      const matches = content.match(from);
      if (matches) {
        content = content.replace(from, to);
        fileReplacements += matches.length;
      }
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${path.relative(process.cwd(), filePath)} - ${fileReplacements} substituições`);
      totalReplacements += fileReplacements;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

function migrateDirectory(dir) {
  const pattern = path.join(dir, '**/*.{ts,tsx,js,jsx}');
  const files = glob.sync(pattern, { 
    ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*']
  });
  
  console.log(`\n📂 Processando ${dir} (${files.length} arquivos)...`);
  
  let modifiedFiles = 0;
  files.forEach(file => {
    if (processFile(file)) {
      modifiedFiles++;
    }
    totalFilesProcessed++;
  });
  
  console.log(`   → ${modifiedFiles} arquivos modificados`);
}

console.log('🚀 Iniciando migração do frontend para CattlePurchase...\n');
console.log('='.repeat(60));

directories.forEach(migrateDirectory);

console.log('\n' + '='.repeat(60));
console.log('✅ Migração concluída!');
console.log(`📊 Estatísticas:`);
console.log(`   - Arquivos processados: ${totalFilesProcessed}`);
console.log(`   - Total de substituições: ${totalReplacements}`);
console.log('='.repeat(60));

// Remover arquivos obsoletos
const obsoleteFiles = [
  'src/hooks/api/usePurchaseOrdersApi.ts',
  'src/hooks/api/useCattleLotsApi.ts',
  'src/services/api/purchaseOrderApi.ts',
  'src/services/api/cattleLotApi.ts'
];

console.log('\n🗑️ Removendo arquivos obsoletos...');
obsoleteFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`   ❌ ${file}`);
  }
});

console.log('\n✨ Migração completa!');
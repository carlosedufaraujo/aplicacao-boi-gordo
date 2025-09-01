const fs = require('fs');
const path = require('path');

// Collection of specific fixes for model references and types
const fixes = [
  // Fix incorrect include references
  { file: 'repositories/expense.repository.ts', pattern: /lot:/g, replacement: 'cattlePurchase:' },
  { file: 'repositories/report.repository.ts', pattern: /purchaseOrder:/g, replacement: 'cattlePurchase:' },
  { file: 'repositories/report.repository.ts', pattern: /cattlePurchase:\s*true/g, replacement: 'cattlePurchase: true' },
  { file: 'repositories/sale.repository.ts', pattern: /lot:/g, replacement: 'cattlePurchase:' },
  
  // Fix Sale model references (Sale vs SaleRecord)
  { file: 'repositories/sale.repository.ts', pattern: /sales:/g, replacement: 'saleRecords:' },
  { file: 'repositories/sale.repository.ts', pattern: /lot\.saleRecords/g, replacement: 'cattlePurchase.saleRecords' },
  { file: 'repositories/sale.repository.ts', pattern: /lot\.remainingQuantity/g, replacement: 'cattlePurchase.currentQuantity' },
  
  // Fix pen allocation references
  { file: 'repositories/pen.repository.ts', pattern: /allocation\.purchase/g, replacement: 'allocation.cattlePurchase' },
  { file: 'repositories/pen.repository.ts', pattern: /\.percentageOfPen/g, replacement: '.quantity' },
  { file: 'repositories/pen.repository.ts', pattern: /\.allocationDate/g, replacement: '.entryDate' },
  
  // Fix type annotations for callbacks
  { file: 'repositories/saleRecord.repository.ts', pattern: /\.reduce\(\(sum, s\)/g, replacement: '.reduce((sum, s: any)' },
  { file: 'repositories/sale.repository.ts', pattern: /\.map\(\(sale\)/g, replacement: '.map((sale: any)' },
  { file: 'repositories/sale.repository.ts', pattern: /\.forEach\(\(revenue\)/g, replacement: '.forEach((revenue: any)' },
  
  // Fix SaleStatus comparisons
  { file: 'repositories/sale.repository.ts', pattern: /status === 'PENDING'/g, replacement: "status === 'NEXT_SLAUGHTER'" },
  { file: 'repositories/sale.repository.ts', pattern: /status === 'CONFIRMED'/g, replacement: "status === 'SCHEDULED'" },
  
  // Fix dashboard service references
  { file: 'services/dashboard.service.ts', pattern: /lotAllocations:/g, replacement: 'penAllocations:' },
  { file: 'services/dashboard.service.ts', pattern: /\.lotAllocations/g, replacement: '.penAllocations' },
];

function applyFixes() {
  let totalFixed = 0;
  
  for (const fix of fixes) {
    const filePath = path.join(__dirname, 'src', fix.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${fix.file}`);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    content = content.replace(fix.pattern, fix.replacement);
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${fix.file}`);
      totalFixed++;
    }
  }
  
  // Now fix all files with generic patterns
  totalFixed += processDirectory(path.join(__dirname, 'src'));
  
  return totalFixed;
}

function processDirectory(dir) {
  let fixedCount = 0;
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
      fixedCount += processDirectory(fullPath);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      if (processFile(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Fix cattlePurchase references
  content = content.replace(/lot\.id/g, 'cattlePurchase.id');
  content = content.replace(/lot\.lotNumber/g, 'cattlePurchase.lotCode');
  content = content.replace(/fromPen\?\.name/g, 'fromPen?.penNumber');
  content = content.replace(/toPen\?\.name/g, 'toPen?.penNumber');
  
  // Fix implicit any in callbacks
  content = content.replace(/\.filter\(\(([a-z]+)\) =>/g, '.filter(($1: any) =>');
  content = content.replace(/\.map\(\(([a-z]+)\) =>/g, '.map(($1: any) =>');
  content = content.replace(/\.forEach\(\(([a-z]+)\) =>/g, '.forEach(($1: any) =>');
  content = content.replace(/\.find\(\(([a-z]+)\) =>/g, '.find(($1: any) =>');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// Run the fixes
console.log('Fixing model references and types...');
const fixedCount = applyFixes();
console.log(`\nFixed ${fixedCount} files`);
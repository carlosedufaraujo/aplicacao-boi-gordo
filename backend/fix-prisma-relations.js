const fs = require('fs');
const path = require('path');

// Collection of specific fixes for Prisma model relations
const fixes = [
  // Fix Expense relation names
  { 
    file: 'repositories/expense.repository.ts', 
    fixes: [
      { pattern: /cattlePurchase:/g, replacement: 'purchase:' },
      { pattern: /cattlePurchase\s*{\s*include:\s*{\s*purchaseOrder/g, replacement: 'purchase' }
    ]
  },
  
  // Fix Report repository duplicated nesting
  { 
    file: 'repositories/report.repository.ts', 
    fixes: [
      { pattern: /cattlePurchase:\s*{\s*include:\s*{\s*cattlePurchase/g, replacement: 'vendor' },
      { pattern: /include:\s*{\s*cattlePurchase:\s*true/g, replacement: 'include: {\n                purchaseOrder: true' }
    ]
  },
  
  // Fix Sale repository
  { 
    file: 'repositories/sale.repository.ts', 
    fixes: [
      { pattern: /cattlePurchase\.saleRecords/g, replacement: 'lot.saleRecords' },
      { pattern: /cattlePurchase\.currentQuantity/g, replacement: 'lot.currentQuantity' },
      { pattern: /cattlePurchase\.id/g, replacement: 'lot.id' },
      { pattern: /const totalSold = cattlePurchase/g, replacement: 'const totalSold = lot' },
      { pattern: /cattlePurchase:\s*{\s*include:\s*{\s*cattlePurchase/g, replacement: 'purchase: {\n          include: {\n            vendor' },
      { pattern: /cattlePurchase: true/g, replacement: 'purchase: true' }
    ]
  },
  
  // Fix Pen repository - penAllocations is the correct relation
  {
    file: 'repositories/pen.repository.ts',
    fixes: [
      { pattern: /\(pen as any\)\.penAllocations \|\| \[\]/g, replacement: '(pen as any).penAllocations || []' },
      { pattern: /allocation\.cattlePurchase/g, replacement: 'allocation.purchase' }
    ]
  },
  
  // Fix undefined variables
  {
    file: 'repositories/report.repository.ts',
    fixes: [
      { pattern: /id: cattlePurchase\.id/g, replacement: 'id: lot.id' },
      { pattern: /lotNumber: cattlePurchase\.lotCode/g, replacement: 'lotNumber: lot.lotCode' }
    ]
  }
];

function applySpecificFixes() {
  let totalFixed = 0;
  
  for (const fileConfig of fixes) {
    const filePath = path.join(__dirname, 'src', fileConfig.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${fileConfig.file}`);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    for (const fix of fileConfig.fixes) {
      content = content.replace(fix.pattern, fix.replacement);
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${fileConfig.file}`);
      totalFixed++;
    }
  }
  
  return totalFixed;
}

// Run the fixes
console.log('Fixing Prisma relation names...');
const fixedCount = applySpecificFixes();
console.log(`\nFixed ${fixedCount} files`);
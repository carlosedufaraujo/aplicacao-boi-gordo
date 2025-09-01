const fs = require('fs');
const path = require('path');

// Collection of specific fixes for final TypeScript errors
const fixes = [
  // Fix payerAccount.service.ts - PaginatedResult uses 'items' not 'data'
  { 
    file: 'services/payerAccount.service.ts', 
    pattern: /accounts\.data/g, 
    replacement: 'accounts.items' 
  },
  
  // Fix cycle.service.ts - PaginatedResult uses 'items' not 'data'
  { 
    file: 'services/cycle.service.ts', 
    pattern: /cycles\.data/g, 
    replacement: 'cycles.items' 
  },
  
  // Fix sale.service.ts - lotId instead of purchaseId
  { 
    file: 'services/sale.service.ts', 
    pattern: /filters\.purchaseId/g, 
    replacement: 'filters.lotId' 
  },
  { 
    file: 'services/sale.service.ts', 
    pattern: /data\.purchaseId/g, 
    replacement: 'data.lotId' 
  },
  { 
    file: 'services/sale.service.ts', 
    pattern: /sale\.purchaseId/g, 
    replacement: 'sale.lotId' 
  },
  { 
    file: 'services/sale.service.ts', 
    pattern: /data\.createdAt/g, 
    replacement: 'data.saleDate' 
  },
  { 
    file: 'services/sale.service.ts', 
    pattern: /this\.validateLotAvailability\(data\.lotId/g, 
    replacement: 'this.validateLotAvailability(data.lotId' 
  },
  
  // Add missing getPenOccupation method to pen repository
  {
    file: 'repositories/pen.repository.ts',
    pattern: /(async getOccupationStats\(\)[\s\S]*?}\n  })/,
    replacement: `$1

  async getPenOccupation(id: string) {
    return this.findWithOccupation(id);
  }`
  },
  
  // Add missing applyHealthProtocol method to pen repository  
  {
    file: 'repositories/pen.repository.ts',
    pattern: /(async getPenOccupation[\s\S]*?}\n  })/,
    replacement: `$1

  async applyHealthProtocol(penId: string, data: any) {
    return this.prisma.healthProtocol.create({
      data: {
        ...data,
        penId,
      }
    });
  }`
  },
  
  // Fix utils/auth.ts - add return statement
  {
    file: 'utils/auth.ts',
    pattern: /res\.status\(401\)\.json\({ error: 'Invalid credentials' }\);/g,
    replacement: 'return res.status(401).json({ error: \'Invalid credentials\' });'
  }
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
  
  return totalFixed;
}

// Run the fixes
console.log('Fixing final TypeScript errors...');
const fixedCount = applyFixes();
console.log(`\nFixed ${fixedCount} files`);
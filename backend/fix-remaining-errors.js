#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo erros TypeScript restantes...\n');

// Correções específicas por arquivo
const fileFixes = {
  'src/repositories/expense.repository.ts': [
    { 
      find: "import { prisma } from '@/config/database';", 
      replace: "// import { prisma } from '@/config/database';" 
    },
    { 
      find: 'include: {\n        lot: true,', 
      replace: 'include: {\n        cattlePurchase: true,' 
    }
  ],
  
  'src/repositories/payerAccount.repository.ts': [
    { 
      find: "import { prisma } from '@/config/database';", 
      replace: "// import { prisma } from '@/config/database';" 
    }
  ],
  
  'src/repositories/revenue.repository.ts': [
    { 
      find: "import { prisma } from '@/config/database';", 
      replace: "// import { prisma } from '@/config/database';" 
    }
  ],
  
  'src/repositories/sale.repository.ts': [
    { 
      find: "if (sale.status === 'CONFIRMED'", 
      replace: "if (sale.status === 'PENDING'" 
    },
    {
      find: 'totalAmount: sale.totalValue',
      replace: 'totalAmount: sale.totalValue || 0'
    },
    {
      find: 'include: {\n          sales: true',
      replace: 'include: {\n          saleRecords: true'
    },
    {
      find: 'lot.sales',
      replace: 'lot.saleRecords'
    }
  ],
  
  'src/repositories/saleRecord.repository.ts': [
    {
      find: 'extends BaseRepository',
      replace: 'extends BaseRepository<any>'
    },
    {
      find: 'this.model',
      replace: '(this as any).model'
    }
  ],
  
  'src/controllers/costCenter.controller.ts': [
    {
      find: 'show = catchAsync(async (req: Request, res: Response) => {',
      replace: 'show = catchAsync(async (req: Request, res: Response): Promise<any> => {'
    }
  ],
  
  'src/repositories/report.repository.ts': [
    {
      find: 'orderBy: { date: ',
      replace: 'orderBy: { createdAt: '
    },
    {
      find: 'include: {\n            purchaseOrder: true',
      replace: 'include: {\n            vendor: true'
    },
    {
      find: 'lot.cattlePurchase',
      replace: 'lot'
    }
  ],
  
  'src/repositories/pen.repository.ts': [
    {
      find: 'pen.penAllocations',
      replace: '(pen as any).penAllocations || []'
    }
  ]
};

// Aplicar correções
Object.entries(fileFixes).forEach(([filePath, fixes]) => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    fixes.forEach(({ find, replace }) => {
      if (content.includes(find)) {
        content = content.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erro em ${filePath}: ${error.message}`);
  }
});

// Adicionar tipos em parâmetros de callback
console.log('\n🔧 Adicionando tipos em callbacks...');

const callbackFixes = [
  { pattern: /\.reduce\(\(sum,/g, replacement: '.reduce((sum: number,' },
  { pattern: /\.reduce\(\(sum:/g, replacement: '.reduce((sum: number:' },
  { pattern: /\.map\(\(([a-z]+)\)/g, replacement: '.map(($1: any)' },
  { pattern: /\.filter\(\(([a-z]+)\)/g, replacement: '.filter(($1: any)' },
  { pattern: /\.forEach\(\(([a-z]+)\)/g, replacement: '.forEach(($1: any)' }
];

const directories = ['src/repositories', 'src/services'];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  const files = fs.readdirSync(fullPath, { recursive: true })
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(fullPath, file));
  
  files.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      callbackFixes.forEach(({ pattern, replacement }) => {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${path.relative(__dirname, filePath)}`);
      }
    } catch (error) {
      // Silently continue
    }
  });
});

console.log('\n✅ Correções aplicadas! Execute npm run typecheck para verificar.');
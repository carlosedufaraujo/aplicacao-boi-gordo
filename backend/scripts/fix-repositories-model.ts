#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const repositoriesPath = path.join(__dirname, '../src/repositories');

// Mapeamento de repositórios para modelos do Prisma
const repositoryModelMap: Record<string, string> = {
  'cattleLot.repository.ts': 'cattleLot',
  'expense.repository.ts': 'expense',
  'partner.repository.ts': 'partner',
  'payerAccount.repository.ts': 'payerAccount',
  'pen.repository.ts': 'pen',
  'purchaseOrder.repository.ts': 'purchaseOrder',
  'revenue.repository.ts': 'revenue',
  'sale.repository.ts': 'saleRecord'
};

Object.entries(repositoryModelMap).forEach(([file, modelName]) => {
  const filePath = path.join(repositoriesPath, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Corrige o construtor para passar o nome do modelo
    content = content.replace(
      /constructor\(\) \{\s*super\(\);\s*\}/g,
      `constructor() {\n    super('${modelName}');\n  }`
    );
    
    // Remove qualquer this.model = prisma.xxx se existir
    content = content.replace(/this\.model = prisma\.\w+;?\s*/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${file} with model: ${modelName}`);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('🎉 Repository model fixes completed!');
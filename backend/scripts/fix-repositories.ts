#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const repositoriesPath = path.join(__dirname, '../src/repositories');

// Lista de arquivos de repositório
const repositoryFiles = [
  'cattleLot.repository.ts',
  'expense.repository.ts',
  'partner.repository.ts',
  'payerAccount.repository.ts',
  'pen.repository.ts',
  'purchaseOrder.repository.ts',
  'revenue.repository.ts',
  'sale.repository.ts'
];

repositoryFiles.forEach(file => {
  const filePath = path.join(repositoriesPath, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Corrige o erro de super() com argumentos
    content = content.replace(/super\(prisma\.\w+\)/g, 'super()');
    
    // Adiciona tipagem para parâmetros any
    content = content.replace(/\(sum, (\w+)\) =>/g, '(sum: number, $1: any) =>');
    content = content.replace(/\(acc, (\w+)\) =>/g, '(acc: any, $1: any) =>');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${file}`);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('🎉 Repository fixes completed!');
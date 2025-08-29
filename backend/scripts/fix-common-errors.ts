#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';
import path from 'path';

console.log('🔧 Corrigindo erros comuns no backend...\n');

async function fixFiles() {
  // 1. Corrigir imports de authorize/authorizeBackend
  const routeFiles = globSync('src/routes/**/*.ts', { cwd: process.cwd() });
  
  for (const file of routeFiles) {
    const filePath = path.join(process.cwd(), file);
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Corrigir imports errados
    if (content.includes("from '@/middleware/auth'")) {
      content = content.replace("from '@/middleware/auth'", "from '@/middlewares/auth'");
      modified = true;
    }
    
    // Adicionar import do authorizeBackend se estiver faltando
    if (content.includes('authorizeBackend(') && !content.includes('import { authenticateBackend, authorizeBackend }')) {
      if (content.includes('import { authenticateBackend }')) {
        content = content.replace(
          'import { authenticateBackend }',
          'import { authenticateBackend, authorizeBackend }'
        );
        modified = true;
      }
    }
    
    // Corrigir authorize para authorizeBackend
    if (content.includes('authorize(') && !content.includes('authorizeBackend(')) {
      content = content.replace(/\bauthorize\(/g, 'authorizeBackend(');
      modified = true;
    }
    
    if (modified) {
      writeFileSync(filePath, content);
      console.log(`✅ Corrigido: ${file}`);
    }
  }
  
  // 2. Corrigir tipos any implícitos comuns
  const allFiles = globSync('src/**/*.ts', { cwd: process.cwd() });
  
  for (const file of allFiles) {
    const filePath = path.join(process.cwd(), file);
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Corrigir parâmetros sum e s comuns em reduce
    content = content.replace(
      /\.reduce\(\((sum|s),/g,
      '.reduce((($1: number),'
    );
    
    if (content !== readFileSync(filePath, 'utf-8')) {
      writeFileSync(filePath, content);
      console.log(`✅ Tipos corrigidos: ${file}`);
    }
  }
  
  console.log('\n✨ Correções aplicadas!');
}

fixFiles().catch(console.error);
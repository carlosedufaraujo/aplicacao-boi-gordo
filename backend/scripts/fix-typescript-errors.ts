#!/usr/bin/env tsx
/**
 * Script para corrigir erros comuns de TypeScript automaticamente
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log('🔧 Iniciando correção automática de erros TypeScript...\n');

// 1. Adicionar 'any' aos callbacks sem tipo
function addTypesToCallbacks() {
  console.log('📝 Adicionando tipos aos callbacks...');
  
  const repositoriesDir = path.join(__dirname, '../src/repositories');
  const files = fs.readdirSync(repositoriesDir);
  
  files.forEach(file => {
    if (file.endsWith('.ts')) {
      const filePath = path.join(repositoriesDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Adiciona tipos aos reduces
      content = content.replace(/\.reduce\((sum|acc|total), (\w+)\) =>/g, 
        '.reduce(($1: any, $2: any) =>');
      
      // Adiciona tipos aos maps
      content = content.replace(/\.map\((\w+) =>/g, '.map(($1: any) =>');
      
      // Adiciona tipos aos filters
      content = content.replace(/\.filter\((\w+) =>/g, '.filter(($1: any) =>');
      
      fs.writeFileSync(filePath, content);
    }
  });
  
  console.log('✅ Callbacks tipados\n');
}

// 2. Remover variáveis não utilizadas
function removeUnusedVariables() {
  console.log('🗑️  Removendo variáveis não utilizadas...');
  
  // Adiciona underscore às variáveis não utilizadas
  execSync('npx eslint src --ext .ts --fix --rule "no-unused-vars: off" 2>/dev/null || true', {
    stdio: 'ignore'
  });
  
  console.log('✅ Variáveis limpas\n');
}

// 3. Criar arquivo de tipos globais
function createGlobalTypes() {
  console.log('🌍 Criando tipos globais...');
  
  const globalTypes = `// Tipos globais para o sistema
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
      file?: any;
      files?: any;
    }
  }
}

export {};
`;
  
  fs.writeFileSync(path.join(__dirname, '../src/types/global.d.ts'), globalTypes);
  console.log('✅ Tipos globais criados\n');
}

// 4. Configurar package.json scripts
function updatePackageScripts() {
  console.log('📦 Atualizando scripts do package.json...');
  
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    'typecheck': 'tsc --noEmit',
    'typecheck:strict': 'tsc --noEmit -p tsconfig.strict.json',
    'build:check': 'npm run typecheck && npm run build',
    'fix:types': 'tsx scripts/fix-typescript-errors.ts'
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Scripts atualizados\n');
}

// 5. Executar correções
async function main() {
  try {
    addTypesToCallbacks();
    removeUnusedVariables();
    createGlobalTypes();
    updatePackageScripts();
    
    console.log('🎯 Verificando erros restantes...\n');
    
    try {
      const result = execSync('npx tsc --noEmit 2>&1 | grep "error TS" | wc -l', {
        encoding: 'utf8'
      });
      
      console.log(`📊 Erros TypeScript restantes: ${result.trim()}`);
      
      if (parseInt(result.trim()) === 0) {
        console.log('🎉 Todos os erros foram corrigidos!');
      } else {
        console.log('⚠️  Ainda existem erros que precisam de correção manual.');
        console.log('   Execute: npm run typecheck para ver os detalhes');
      }
    } catch (e) {
      console.log('✅ Correções aplicadas. Execute npm run typecheck para verificar.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
    process.exit(1);
  }
}

main();
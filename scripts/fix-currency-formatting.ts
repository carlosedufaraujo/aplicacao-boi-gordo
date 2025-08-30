#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Find all TypeScript/JavaScript files in src directory
const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
  absolute: true,
  cwd: '/Users/carloseduardo/App/aplicacao-boi-gordo'
});

console.log(`Found ${files.length} files to check`);

let filesModified = 0;
let totalReplacements = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  let replacements = 0;
  
  // Pattern 1: R$ {(value / 1000).toFixed(0)}k
  const pattern1 = /R\$\s*\{?\(([^)]+)\/\s*1000\)\.toFixed\(0\)\}?k/g;
  content = content.replace(pattern1, (match, expression) => {
    replacements++;
    return `{formatCompactCurrency(${expression})}`;
  });
  
  // Pattern 2: {(value/1000).toFixed(0)}k without R$
  const pattern2 = /\{?\(([^)]+)\/\s*1000\)\.toFixed\(0\)\}?k(?!\w)/g;
  content = content.replace(pattern2, (match, expression) => {
    // Skip if it's inside a string or comment
    if (match.includes('kg') || match.includes('km')) return match;
    replacements++;
    return `{formatCompactCurrency(${expression})}`;
  });
  
  // Pattern 3: .toFixed(0)}kg for weight - keep as is but improve
  const weightPattern = /\{([^}]+)\.toFixed\(0\)\}kg/g;
  content = content.replace(weightPattern, (match, expression) => {
    replacements++;
    return `{formatWeight(${expression})}`;
  });
  
  // If file was modified, add import if not present
  if (replacements > 0 && content !== originalContent) {
    // Check if formatters are already imported
    const hasFormattersImport = content.includes("from '@/utils/formatters'");
    
    if (!hasFormattersImport) {
      // Find the right place to add import (after other imports)
      const importRegex = /^import .* from ['"].*['"];?$/gm;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertPosition = lastImportIndex + lastImport.length;
        
        // Determine which formatters are needed
        const needsCurrency = content.includes('formatCompactCurrency') || content.includes('formatCurrency');
        const needsWeight = content.includes('formatWeight');
        
        let formattersToImport = [];
        if (needsCurrency) {
          formattersToImport.push('formatCurrency', 'formatCompactCurrency');
        }
        if (needsWeight) {
          formattersToImport.push('formatWeight');
        }
        
        if (formattersToImport.length > 0) {
          const importStatement = `\nimport { ${formattersToImport.join(', ')} } from '@/utils/formatters';`;
          content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
        }
      }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
    totalReplacements += replacements;
    console.log(`✅ Modified ${path.relative('/Users/carloseduardo/App/aplicacao-boi-gordo', file)} - ${replacements} replacements`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total replacements: ${totalReplacements}`);
#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const hooksPath = '/Users/carloseduardo/App/aplicacao-boi-gordo/src/hooks/api';

const hooks = [
  'useExpensesApi.ts',
  'useRevenuesApi.ts',
  'usePayerAccountsApi.ts',
  'usePartnersApi.ts'
];

hooks.forEach(hookFile => {
  const filePath = path.join(hooksPath, hookFile);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Padrão para encontrar e substituir
    const pattern = /if \(response\.status === 'success' && response\.data\) \{\s*set\w+\(response\.data\);/g;
    
    // Encontrar o nome correto do setter
    const setterMatch = content.match(/const \[(\w+), set(\w+)\] = useState<.*\[\]>/);
    if (setterMatch) {
      const varName = setterMatch[1];
      const setterName = `set${setterMatch[2]}`;
      
      // Substituir padrão antigo pelo novo
      const replacement = `if (response.status === 'success' && response.data) {
        // Se response.data for um objeto paginado, extrair o array
        const items = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || [];
        ${setterName}(items);`;
      
      content = content.replace(pattern, replacement);
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${hookFile}`);
    }
  } else {
    console.log(`⚠️  File not found: ${hookFile}`);
  }
});

console.log('🎉 API hooks fixes completed!');
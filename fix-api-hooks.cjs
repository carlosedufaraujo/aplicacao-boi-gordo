#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lista de arquivos a corrigir
const files = [
  'src/hooks/api/useCyclesApi.ts',
  'src/hooks/api/usePenOccupancyApi.ts',
  'src/hooks/api/usePensApi.ts',
  'src/hooks/api/usePayerAccountsApi.ts',
  'src/hooks/api/useRevenuesApi.ts',
  'src/hooks/api/useExpensesApi.ts',
];

console.log('🔧 Corrigindo hooks de API...\n');

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Corrigir response.data.data para response.data.items em listagens
  if (content.includes('response.data.data || []')) {
    content = content.replace(/response\.data\.data \|\| \[\]/g, 'response.data.items || []');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigido: ${file}`);
  } else {
    console.log(`⏭️  Sem mudanças: ${file}`);
  }
});

console.log('\n✨ Correção concluída!');
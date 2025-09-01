#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lista de arquivos a corrigir
const hooks = [
  'useCyclesApi.ts',
  'usePensApi.ts',
  'usePayerAccountsApi.ts',
];

console.log('🔧 Corrigindo hooks de API com problema no useEffect inicial...\n');

hooks.forEach(hookFile => {
  const filePath = path.join(__dirname, 'src', 'hooks', 'api', hookFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${hookFile}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Padrão para encontrar o problema no useEffect inicial
  // Procura por .data.data || [] dentro do useEffect
  const pattern1 = /(\w+Response\.data\.data \|\| \[\])/g;
  const pattern2 = /: (\w+)\.data\.data \|\| \[\]/g;
  
  if (content.match(pattern1)) {
    content = content.replace(pattern1, (match, p1) => {
      const varName = match.split('.')[0];
      return `${varName}.data.items || []`;
    });
    modified = true;
  }
  
  if (content.match(pattern2)) {
    content = content.replace(pattern2, (match, p1) => {
      return `: ${p1}.data.items || []`;
    });
    modified = true;
  }
  
  // Adicionar logs de debug no useEffect inicial
  const useEffectPattern = /if \((\w+Response)\.status === 'success' && \1\.data\) \{/g;
  if (content.match(useEffectPattern)) {
    content = content.replace(useEffectPattern, (match, p1) => {
      return `if (${p1}.status === 'success' && ${p1}.data) {\n          console.log('[${hookFile}] Initial load - Response data:', ${p1}.data);`;
    });
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigido: ${hookFile}`);
  } else {
    console.log(`⏭️  Verificando manualmente: ${hookFile}`);
    
    // Correção manual específica
    if (hookFile === 'useCyclesApi.ts') {
      content = content.replace(
        'cyclesResponse.data.data || []',
        'cyclesResponse.data.items || []'
      );
      if (content.includes('cyclesResponse.data.items')) {
        fs.writeFileSync(filePath, content);
        console.log(`   ✅ Correção manual aplicada`);
      }
    }
    
    if (hookFile === 'usePensApi.ts') {
      content = content.replace(
        'pensResponse.data.data || []',
        'pensResponse.data.items || []'
      );
      if (content.includes('pensResponse.data.items')) {
        fs.writeFileSync(filePath, content);
        console.log(`   ✅ Correção manual aplicada`);
      }
    }
    
    if (hookFile === 'usePayerAccountsApi.ts') {
      content = content.replace(
        'accountsResponse.data.data || []',
        'accountsResponse.data.items || []'
      );
      if (content.includes('accountsResponse.data.items')) {
        fs.writeFileSync(filePath, content);
        console.log(`   ✅ Correção manual aplicada`);
      }
    }
  }
});

console.log('\n✨ Correção concluída!');
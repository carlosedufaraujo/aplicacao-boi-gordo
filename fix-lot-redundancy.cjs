#!/usr/bin/env node

/**
 * Script para remover redundância "Lote" antes de códigos LOT-
 * Padroniza para usar apenas LOT-XXXXX sem prefixo "Lote"
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Contador de alterações
let totalChanges = 0;
const changedFiles = [];

// Padrões para substituir
const patterns = [
  // Padrão 1: "Lote ${...}" onde o conteúdo é um código que já começa com LOT
  {
    regex: /`([^`]*) - Lote \$\{([^}]+)\}`/g,
    replacement: '`$1 - ${$2}`',
    description: 'Remover "Lote" antes de ${variável}'
  },
  // Padrão 2: "Lote #LOT-"
  {
    regex: /Lote #LOT-/g,
    replacement: 'LOT-',
    description: 'Remover "Lote #" antes de LOT-'
  },
  // Padrão 3: "lote LOT-"
  {
    regex: /lote LOT-/g,
    replacement: 'LOT-',
    description: 'Remover "lote " antes de LOT-'
  },
  // Padrão 4: "Lote LOT-"
  {
    regex: /Lote LOT-/g,
    replacement: 'LOT-',
    description: 'Remover "Lote " antes de LOT-'
  }
];

// Função para processar arquivo
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileChanges = 0;

    patterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches && matches.length > 0) {
        content = content.replace(pattern.regex, pattern.replacement);
        fileChanges += matches.length;
        console.log(`  ✓ ${pattern.description}: ${matches.length} ocorrência(s)`);
      }
    });

    if (fileChanges > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalChanges += fileChanges;
      changedFiles.push({
        file: filePath.replace(/.*\/aplicacao-boi-gordo\//, ''),
        changes: fileChanges
      });
      console.log(`  📝 Arquivo atualizado: ${fileChanges} alteração(ões)\n`);
    }
  } catch (error) {
    console.error(`  ❌ Erro ao processar arquivo: ${error.message}`);
  }
}

console.log('🔧 Iniciando correção de redundância de LOTE/LOT...\n');

// Arquivos a processar
const filesToProcess = [
  // Frontend - Componentes
  '/Users/carloseduardo/App/aplicacao-boi-gordo/src/components/Dashboard/ShadcnDashboard.tsx',
  '/Users/carloseduardo/App/aplicacao-boi-gordo/src/components/Calendar/CompleteCalendar.tsx',
  '/Users/carloseduardo/App/aplicacao-boi-gordo/src/components/Lots/SaleSimulationModal.tsx',
  '/Users/carloseduardo/App/aplicacao-boi-gordo/src/components/Interventions/InterventionHistory.tsx',

  // Frontend - Stores
  '/Users/carloseduardo/App/aplicacao-boi-gordo/src/stores/useAppStore.ts',

  // Backend - Services
  '/Users/carloseduardo/App/aplicacao-boi-gordo/backend/src/services/integratedFinancialAnalysis.service.ts',
  '/Users/carloseduardo/App/aplicacao-boi-gordo/backend/src/services/cattlePurchase.service.ts',
  '/Users/carloseduardo/App/aplicacao-boi-gordo/backend/src/repositories/sale.repository.ts',

  // Backend - Scripts
  '/Users/carloseduardo/App/aplicacao-boi-gordo/backend/scripts/sync-purchases-to-expenses.ts',
  '/Users/carloseduardo/App/aplicacao-boi-gordo/backend/scripts/fix-lot-2509001.ts',
  '/Users/carloseduardo/App/aplicacao-boi-gordo/backend/vincular-compras-centro-financeiro.js',
  '/Users/carloseduardo/App/aplicacao-boi-gordo/backend/check-system-integration.js',
];

// Processar cada arquivo
filesToProcess.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`📄 Processando: ${path.basename(filePath)}`);
    processFile(filePath);
  }
});

// Relatório final
console.log('\n' + '='.repeat(80));
console.log('📊 RELATÓRIO DE ALTERAÇÕES');
console.log('='.repeat(80));

if (changedFiles.length > 0) {
  console.log('\n✅ Arquivos modificados:');
  changedFiles.forEach(file => {
    console.log(`   • ${file.file} (${file.changes} alterações)`);
  });

  console.log(`\n📈 Total: ${totalChanges} redundâncias removidas em ${changedFiles.length} arquivo(s)`);
  console.log('\n✨ Padronização concluída com sucesso!');
} else {
  console.log('\n✅ Nenhuma redundância encontrada - todos os arquivos já estão padronizados!');
}

console.log('\n💡 Recomendação: Execute os testes para verificar se tudo está funcionando corretamente.');
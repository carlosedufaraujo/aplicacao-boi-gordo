#!/usr/bin/env node

/**
 * Script para analisar todas as referências de LOTE/LOT no sistema
 * e identificar inconsistências na nomenclatura
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Padrões a buscar
const patterns = {
  // Textos de interface
  uiTexts: [
    'Nova Compra de Gado',
    'Novo Lote',
    'Nova Compra',
    'Editar Compra de Gado',
    'Compra de Gado'
  ],

  // Descrições com Lote
  descriptions: [
    'Compra de Gado - Lote',
    'Compra de.*animais - Lote',
    'Frete - Lote',
    'Comissão.*Lote',
    'Pagamento.*Lote',
    'Vacinação.*Lote',
    'Chegada.*Lote',
    'Pesagem.*Lote'
  ],

  // Códigos de lote
  codes: [
    'LOT-',
    'LOTE',
    'lotCode',
    'lotNumber',
    '#LOT'
  ]
};

// Arquivos encontrados
const findings = {
  uiTexts: [],
  descriptions: [],
  codes: []
};

// Função para buscar padrões em arquivo
function searchInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Buscar textos de UI
      patterns.uiTexts.forEach(pattern => {
        if (line.includes(pattern)) {
          findings.uiTexts.push({
            file: filePath.replace(/.*\/aplicacao-boi-gordo\//, ''),
            line: index + 1,
            text: line.trim(),
            pattern
          });
        }
      });

      // Buscar descrições
      patterns.descriptions.forEach(pattern => {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(line)) {
          findings.descriptions.push({
            file: filePath.replace(/.*\/aplicacao-boi-gordo\//, ''),
            line: index + 1,
            text: line.trim(),
            pattern
          });
        }
      });

      // Buscar códigos
      patterns.codes.forEach(pattern => {
        if (line.includes(pattern)) {
          findings.codes.push({
            file: filePath.replace(/.*\/aplicacao-boi-gordo\//, ''),
            line: index + 1,
            text: line.trim(),
            pattern
          });
        }
      });
    });
  } catch (error) {
    // Ignorar erros de leitura
  }
}

// Buscar em todos os arquivos relevantes
console.log('🔍 Analisando referências de LOTE/LOT no sistema...\n');

// Frontend
const frontendFiles = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
  cwd: '/Users/carloseduardo/App/aplicacao-boi-gordo',
  absolute: true
});

// Backend
const backendFiles = glob.sync('backend/src/**/*.{ts,js}', {
  cwd: '/Users/carloseduardo/App/aplicacao-boi-gordo',
  absolute: true
});

// Processar arquivos
[...frontendFiles, ...backendFiles].forEach(searchInFile);

// Relatório
console.log('📊 RELATÓRIO DE ANÁLISE\n');
console.log('=' .repeat(80));

// Textos de UI
console.log('\n📝 TEXTOS DE INTERFACE (Botões, Títulos, Labels)');
console.log('-'.repeat(80));
const uiGrouped = {};
findings.uiTexts.forEach(item => {
  if (!uiGrouped[item.pattern]) uiGrouped[item.pattern] = [];
  uiGrouped[item.pattern].push(item);
});

Object.keys(uiGrouped).forEach(pattern => {
  console.log(`\n✓ "${pattern}" (${uiGrouped[pattern].length} ocorrências):`);
  uiGrouped[pattern].slice(0, 3).forEach(item => {
    console.log(`  ${item.file}:${item.line}`);
  });
  if (uiGrouped[pattern].length > 3) {
    console.log(`  ... e mais ${uiGrouped[pattern].length - 3} ocorrências`);
  }
});

// Descrições
console.log('\n\n📋 DESCRIÇÕES COM "LOTE"');
console.log('-'.repeat(80));
const descGrouped = {};
findings.descriptions.forEach(item => {
  if (!descGrouped[item.pattern]) descGrouped[item.pattern] = [];
  descGrouped[item.pattern].push(item);
});

Object.keys(descGrouped).forEach(pattern => {
  console.log(`\n✓ Padrão: "${pattern}" (${descGrouped[pattern].length} ocorrências):`);
  descGrouped[pattern].slice(0, 3).forEach(item => {
    console.log(`  ${item.file}:${item.line}`);
    console.log(`    → ${item.text.substring(0, 100)}...`);
  });
  if (descGrouped[pattern].length > 3) {
    console.log(`  ... e mais ${descGrouped[pattern].length - 3} ocorrências`);
  }
});

// Códigos de lote
console.log('\n\n🔤 REFERÊNCIAS DE CÓDIGO DE LOTE');
console.log('-'.repeat(80));
const codeGrouped = {};
findings.codes.forEach(item => {
  if (!codeGrouped[item.pattern]) codeGrouped[item.pattern] = [];
  codeGrouped[item.pattern].push(item);
});

Object.keys(codeGrouped).forEach(pattern => {
  console.log(`\n✓ Padrão: "${pattern}" (${codeGrouped[pattern].length} ocorrências)`);
});

// Resumo e recomendações
console.log('\n\n📌 RESUMO E RECOMENDAÇÕES');
console.log('='.repeat(80));

console.log('\n1. PADRONIZAÇÃO NECESSÁRIA:');
console.log('   • Textos de UI: Padronizar "Nova Compra" vs "Nova Compra de Gado"');
console.log('   • Descrições: Usar sempre "Lote" após código (ex: "Lote LOT-XXX")');
console.log('   • Códigos: Manter padrão "LOT-" para códigos de lote');

console.log('\n2. PRINCIPAIS ARQUIVOS AFETADOS:');
const allFiles = new Set([
  ...findings.uiTexts.map(f => f.file),
  ...findings.descriptions.map(f => f.file),
  ...findings.codes.map(f => f.file)
]);

const topFiles = Array.from(allFiles).slice(0, 10);
topFiles.forEach(file => {
  console.log(`   • ${file}`);
});

console.log('\n3. TOTAL DE OCORRÊNCIAS:');
console.log(`   • Textos de UI: ${findings.uiTexts.length}`);
console.log(`   • Descrições: ${findings.descriptions.length}`);
console.log(`   • Códigos: ${findings.codes.length}`);
console.log(`   • TOTAL: ${findings.uiTexts.length + findings.descriptions.length + findings.codes.length}`);

console.log('\n✅ Análise concluída!\n');
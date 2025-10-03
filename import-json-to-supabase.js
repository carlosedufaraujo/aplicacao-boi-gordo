#!/usr/bin/env node

/**
 * Script para importar dados JSON para o Supabase
 * Execute com: node import-json-to-supabase.js
 */

const fs = require('fs');
const path = require('path');

// Configuração do Supabase - ADICIONE SUAS CREDENCIAIS
const SUPABASE_URL = 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
const SUPABASE_SERVICE_KEY = 'SUA_SERVICE_KEY_AQUI'; // Pegue do Vercel Dashboard

// Ler arquivos JSON
const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'api/data/users.json'), 'utf8'));
const partners = JSON.parse(fs.readFileSync(path.join(__dirname, 'api/data/partners.json'), 'utf8'));
const cattlePurchases = JSON.parse(fs.readFileSync(path.join(__dirname, 'api/data/cattle_purchases.json'), 'utf8'));
const expenses = JSON.parse(fs.readFileSync(path.join(__dirname, 'api/data/expenses.json'), 'utf8'));

console.log('📊 Dados encontrados:');
console.log(`- Users: ${users.length}`);
console.log(`- Partners: ${partners.length}`);
console.log(`- Cattle Purchases: ${cattlePurchases.length}`);
console.log(`- Expenses: ${expenses.length}`);

// Função para fazer upload
async function uploadToSupabase(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      console.log(`✅ ${table}: ${data.length} registros importados`);
    } else {
      const error = await response.text();
      console.error(`❌ Erro em ${table}:`, error);
    }
  } catch (error) {
    console.error(`❌ Erro ao conectar com Supabase:`, error.message);
  }
}

// Executar importação
async function importAll() {
  console.log('\n🚀 Iniciando importação...\n');
  
  if (SUPABASE_SERVICE_KEY === 'SUA_SERVICE_KEY_AQUI') {
    console.error('❌ Configure SUPABASE_SERVICE_KEY primeiro!');
    console.log('\n1. Pegue a service key no Vercel Dashboard');
    console.log('2. Substitua SUA_SERVICE_KEY_AQUI no script');
    return;
  }

  // Importar na ordem correta (respeitando foreign keys)
  await uploadToSupabase('users', users);
  await uploadToSupabase('partners', partners);
  
  // Ajustar cattle_purchases para ter vendor_id correto
  const adjustedPurchases = cattlePurchases.map(purchase => {
    // Encontrar o partner correspondente
    const partner = partners.find(p => p.name === purchase.vendor);
    return {
      ...purchase,
      vendor_id: partner?.id || null,
      vendor: undefined // Remover campo vendor que não existe na tabela
    };
  });
  
  await uploadToSupabase('cattle_purchases', adjustedPurchases);
  await uploadToSupabase('expenses', expenses);
  
  console.log('\n✅ Importação concluída!');
  console.log('Verifique no Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/editor');
}

// Executar
importAll().catch(console.error);

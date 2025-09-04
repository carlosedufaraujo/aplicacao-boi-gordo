#!/usr/bin/env node

/**
 * Script para verificar e corrigir descrições de receitas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRevenueDescriptions() {
  console.log('🔍 Verificando descrições de receitas...\n');

  try {
    // Buscar todas as receitas
    const allRevenues = await prisma.revenue.findMany({
      select: {
        id: true,
        description: true,
        totalAmount: true,
        category: true
      }
    });

    console.log(`📊 Total de receitas no sistema: ${allRevenues.length}`);

    // Filtrar receitas que contém "Lote" na descrição
    const revenuesWithLote = allRevenues.filter(rev => 
      rev.description && rev.description.includes('Lote')
    );

    if (revenuesWithLote.length === 0) {
      console.log('✅ Nenhuma receita encontrada com "Lote" na descrição.\n');
    } else {
      console.log(`\n⚠️ Encontradas ${revenuesWithLote.length} receitas com "Lote" na descrição:\n`);
      
      for (const revenue of revenuesWithLote) {
        console.log(`- ID: ${revenue.id}`);
        console.log(`  Descrição: "${revenue.description}"`);
        console.log(`  Categoria: ${revenue.category}`);
        console.log(`  Valor: R$ ${revenue.totalAmount.toFixed(2)}\n`);
      }

      // Perguntar se deseja corrigir
      console.log('💡 Para corrigir, execute: npx tsx scripts/fix-revenue-descriptions.ts');
    }

    // Verificar padrões de descrição
    console.log('\n📝 Padrões de descrição encontrados:');
    const patterns = {};
    allRevenues.forEach(rev => {
      if (rev.description) {
        const pattern = rev.description.split(' - ')[0];
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      }
    });

    Object.entries(patterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([pattern, count]) => {
        console.log(`  - "${pattern}": ${count} ocorrência(s)`);
      });

  } catch (error) {
    console.error('❌ Erro ao verificar receitas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
checkRevenueDescriptions();
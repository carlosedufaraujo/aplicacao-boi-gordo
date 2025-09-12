#!/usr/bin/env tsx
/**
 * Script para analisar categorias no fluxo de caixa
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeCategories() {
  console.log('🔍 Analisando categorias no fluxo de caixa...\n');

  try {
    // Buscar todas as movimentações
    const cashFlows = await prisma.cashFlow.findMany({
      orderBy: { date: 'desc' }
    });

    console.log(`📊 Total de movimentações: ${cashFlows.length}`);

    // Agrupar por categoria
    const categoryGroups: Record<string, {
      total: number;
      expense: number;
      income: number;
      expenseAmount: number;
      incomeAmount: number;
      descriptions: Set<string>;
    }> = {};

    cashFlows.forEach(cf => {
      const cat = cf.categoryId || 'SEM_CATEGORIA';
      
      if (!categoryGroups[cat]) {
        categoryGroups[cat] = {
          total: 0,
          expense: 0,
          income: 0,
          expenseAmount: 0,
          incomeAmount: 0,
          descriptions: new Set()
        };
      }

      categoryGroups[cat].total++;
      categoryGroups[cat].descriptions.add(cf.description);
      
      if (cf.type === 'EXPENSE') {
        categoryGroups[cat].expense++;
        categoryGroups[cat].expenseAmount += cf.amount;
      } else {
        categoryGroups[cat].income++;
        categoryGroups[cat].incomeAmount += cf.amount;
      }
    });

    console.log('\n=== CATEGORIAS ENCONTRADAS ===');
    
    Object.entries(categoryGroups)
      .sort((a, b) => b[1].expenseAmount - a[1].expenseAmount) // Ordenar por valor de despesa
      .forEach(([cat, data]) => {
        console.log(`\n📁 ${cat}:`);
        console.log(`   Total: ${data.total} movimentações`);
        
        if (data.expense > 0) {
          console.log(`   💸 Despesas: ${data.expense} movimentações`);
          console.log(`      Valor total: ${new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(data.expenseAmount)}`);
        }
        
        if (data.income > 0) {
          console.log(`   💰 Receitas: ${data.income} movimentações`);
          console.log(`      Valor total: ${new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(data.incomeAmount)}`);
        }
        
        console.log(`   📝 Descrições únicas: ${data.descriptions.size}`);
        if (data.descriptions.size <= 5) {
          Array.from(data.descriptions).forEach(desc => {
            console.log(`      - ${desc}`);
          });
        }
      });

    // Análise específica de comissões
    console.log('\n=== ANÁLISE DE COMISSÕES ===');
    
    const comissoes = cashFlows.filter(cf => 
      cf.description.toLowerCase().includes('comissão') ||
      cf.categoryId?.toLowerCase().includes('comiss')
    );

    if (comissoes.length > 0) {
      const totalComissoes = comissoes.reduce((sum, cf) => sum + cf.amount, 0);
      
      console.log(`📊 Total de comissões: ${comissoes.length}`);
      console.log(`💵 Valor total: ${new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(totalComissoes)}`);
      
      // Agrupar comissões por categoria
      const comissoesPorCategoria: Record<string, number> = {};
      comissoes.forEach(cf => {
        const cat = cf.categoryId || 'SEM_CATEGORIA';
        comissoesPorCategoria[cat] = (comissoesPorCategoria[cat] || 0) + 1;
      });
      
      console.log('\n📁 Comissões por categoria:');
      Object.entries(comissoesPorCategoria).forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count} comissões`);
      });
      
      // Mostrar algumas comissões
      console.log('\n📝 Primeiras 5 comissões:');
      comissoes.slice(0, 5).forEach(cf => {
        console.log(`   - ${cf.description}: ${new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(cf.amount)} (Cat: ${cf.categoryId || 'SEM_CATEGORIA'})`);
      });
    } else {
      console.log('❌ Nenhuma comissão encontrada');
    }

    // Verificar categorias faltantes ou problemáticas
    console.log('\n=== PROBLEMAS IDENTIFICADOS ===');
    
    const semCategoria = categoryGroups['SEM_CATEGORIA'];
    if (semCategoria && semCategoria.total > 0) {
      console.log(`⚠️  ${semCategoria.total} movimentações sem categoria definida`);
      console.log(`   Valor total: ${new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(semCategoria.expenseAmount + semCategoria.incomeAmount)}`);
    }

    // Sugerir categorias baseadas em descrições
    console.log('\n=== SUGESTÕES DE CATEGORIZAÇÃO ===');
    
    const sugestoes = {
      'COMPRA_GADO': ['compra de gado', 'aquisição de gado', 'compra gado'],
      'COMISSAO': ['comissão', 'comissao', 'commission'],
      'VENDA_GADO': ['venda de gado', 'venda gado', 'receita gado'],
      'FINANCIAMENTO': ['parcela', 'financiamento', 'empréstimo'],
      'DESPESAS_OPERACIONAIS': ['despesa operacional', 'manutenção', 'combustível']
    };

    Object.entries(sugestoes).forEach(([catSugerida, termos]) => {
      const movimentacoes = cashFlows.filter(cf => {
        const desc = cf.description.toLowerCase();
        return termos.some(termo => desc.includes(termo)) && !cf.categoryId;
      });

      if (movimentacoes.length > 0) {
        console.log(`\n📌 Sugestão: Categoria "${catSugerida}" para:`);
        console.log(`   ${movimentacoes.length} movimentações identificadas`);
        const valorTotal = movimentacoes.reduce((sum, cf) => sum + cf.amount, 0);
        console.log(`   Valor total: ${new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(valorTotal)}`);
      }
    });

  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar análise
analyzeCategories()
  .then(() => {
    console.log('\n✨ Análise concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
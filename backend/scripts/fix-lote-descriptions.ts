#!/usr/bin/env tsx

/**
 * Script para remover a palavra "Lote" das descrições de despesas
 * Atualiza apenas despesas que contém " - Lote LOT-"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLoteDescriptions() {
  console.log('🔧 Iniciando correção das descrições...\n');

  try {
    // Buscar todas as despesas que têm "Lote" na descrição
    const expensesToFix = await prisma.expense.findMany({
      where: {
        OR: [
          { description: { contains: 'Compra de gado - Lote LOT-' } },
          { description: { contains: 'Frete - Lote LOT-' } },
          { description: { contains: 'Comissão - Lote LOT-' } }
        ]
      }
    });

    console.log(`📋 Encontradas ${expensesToFix.length} despesas para corrigir\n`);

    let updated = 0;
    
    for (const expense of expensesToFix) {
      const oldDescription = expense.description;
      // Remove " Lote" apenas antes de "LOT-"
      const newDescription = oldDescription.replace(' - Lote LOT-', ' - LOT-');
      
      if (oldDescription !== newDescription) {
        await prisma.expense.update({
          where: { id: expense.id },
          data: { description: newDescription }
        });
        
        console.log(`✅ Atualizada: "${oldDescription}" → "${newDescription}"`);
        updated++;
      }
    }

    // Também atualizar as notas se necessário
    const expensesWithLoteInNotes = await prisma.expense.findMany({
      where: {
        notes: { contains: 'lote LOT-' }
      }
    });

    console.log(`\n📝 Encontradas ${expensesWithLoteInNotes.length} despesas com "lote" nas notas\n`);

    for (const expense of expensesWithLoteInNotes) {
      if (expense.notes) {
        const oldNotes = expense.notes;
        // Remove "lote " antes de "LOT-" e "do lote " antes de "LOT-"
        let newNotes = oldNotes
          .replace(/do lote (LOT-)/gi, '$1')
          .replace(/lote (LOT-)/gi, '$1');
        
        if (oldNotes !== newNotes) {
          await prisma.expense.update({
            where: { id: expense.id },
            data: { notes: newNotes }
          });
          
          console.log(`✅ Notas atualizadas para despesa ${expense.id}`);
          updated++;
        }
      }
    }

    console.log(`\n🎉 Correção concluída! ${updated} registros atualizados.`);

  } catch (error) {
    console.error('❌ Erro ao corrigir descrições:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
fixLoteDescriptions();
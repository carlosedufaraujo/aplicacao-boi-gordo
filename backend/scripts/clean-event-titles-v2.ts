#!/usr/bin/env tsx
/**
 * Script para limpar os títulos dos eventos removendo prefixos redundantes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanEventTitles() {
  console.log('🔄 Iniciando limpeza dos títulos dos eventos...\n');

  try {
    // Buscar todos os eventos
    const events = await prisma.calendarEvent.findMany();

    console.log(`📊 Total de eventos encontrados: ${events.length}`);

    let updated = 0;
    let errors = 0;

    for (const event of events) {
      try {
        let needsUpdate = false;
        const updates: any = {};

        // Remover prefixos do título
        let cleanTitle = event.title
          .replace(/^Despesa:\s*/i, '')
          .replace(/^Receita:\s*/i, '')
          .replace(/^Venda:\s*/i, 'Venda ')
          .replace(/^Pagamento:\s*/i, 'Pagamento ')
          .trim();

        if (cleanTitle !== event.title) {
          updates.title = cleanTitle;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await prisma.calendarEvent.update({
            where: { id: event.id },
            data: updates
          });
          console.log(`✅ Atualizado: ${event.title} → ${updates.title}`);
          updated++;
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar evento ${event.id}:`, error);
        errors++;
      }
    }

    console.log('\n📊 === RESUMO DA LIMPEZA ===');
    console.log(`✅ Eventos atualizados: ${updated}`);
    console.log(`⏭️  Eventos sem alteração: ${events.length - updated - errors}`);
    console.log(`❌ Erros encontrados: ${errors}`);

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar limpeza
cleanEventTitles()
  .then(() => {
    console.log('\n✨ Limpeza concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
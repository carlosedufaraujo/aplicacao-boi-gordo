#!/usr/bin/env tsx
/**
 * Script para limpar os títulos dos eventos, removendo emojis e valores duplicados das descrições
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanEventTitles() {
  console.log('🔄 Iniciando limpeza dos títulos e descrições dos eventos...\n');

  try {
    // Buscar todos os eventos financeiros
    const events = await prisma.calendarEvent.findMany({
      where: { type: 'FINANCE' }
    });

    console.log(`📊 Total de eventos encontrados: ${events.length}`);

    let updated = 0;
    let errors = 0;

    for (const event of events) {
      try {
        let needsUpdate = false;
        const updates: any = {};

        // Remover emojis do título
        let cleanTitle = event.title
          .replace(/💰\s*/g, '')
          .replace(/💸\s*/g, '')
          .replace(/📊\s*/g, '')
          .replace(/💵\s*/g, '')
          .replace(/💲\s*/g, '')
          .trim();

        if (cleanTitle !== event.title) {
          updates.title = cleanTitle;
          needsUpdate = true;
        }

        // Limpar descrição - remover valor duplicado e manter apenas notas relevantes
        if (event.description) {
          // Remover linhas que começam com "Receita:" ou "Despesa:" seguido de valor
          let cleanDescription = event.description
            .split('\n')
            .filter(line => {
              // Remove linhas que são apenas o valor formatado
              return !line.match(/^(Receita|Despesa):\s*R\$\s*[\d.,]+$/);
            })
            .join('\n')
            .trim();

          // Se a descrição ficar vazia ou só tiver espaços, definir como string vazia
          if (!cleanDescription || cleanDescription === 'undefined') {
            cleanDescription = '';
          }

          if (cleanDescription !== event.description) {
            updates.description = cleanDescription;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await prisma.calendarEvent.update({
            where: { id: event.id },
            data: updates
          });
          console.log(`✅ Atualizado: ${event.title} → ${updates.title || event.title}`);
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
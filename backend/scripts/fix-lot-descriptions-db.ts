#!/usr/bin/env tsx

/**
 * Script para corrigir redundância "Lote" nas descrições do banco de dados
 * Remove "Lote " antes de códigos LOT- em todas as tabelas relevantes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLotDescriptions() {
  console.log('🔧 Iniciando correção de redundância "Lote" no banco de dados...\n');

  try {
    // 1. Corrigir tabela cash_flows (nome correto da tabela)
    console.log('📊 Atualizando tabela cash_flows...');
    const cashFlowResult = await prisma.$executeRaw`
      UPDATE cash_flows
      SET description = REPLACE(description, 'Lote LOT-', 'LOT-')
      WHERE description LIKE '%Lote LOT-%'
    `;
    console.log(`✅ cash_flows: ${cashFlowResult} registro(s) atualizado(s)`);

    // Também corrigir "- Lote " no meio das descrições
    const cashFlowResult2 = await prisma.$executeRaw`
      UPDATE cash_flows
      SET description = REPLACE(description, ' - Lote ', ' - ')
      WHERE description LIKE '% - Lote %'
    `;
    console.log(`✅ cash_flows: ${cashFlowResult2} registro(s) com " - Lote " atualizado(s)`);

    // 2. Corrigir tabela expenses (nome correto da tabela)
    try {
      console.log('\n📊 Atualizando tabela expenses...');
      const expenseResult = await prisma.$executeRaw`
        UPDATE expenses
        SET description = REPLACE(description, 'Lote LOT-', 'LOT-')
        WHERE description LIKE '%Lote LOT-%'
      `;
      console.log(`✅ expenses: ${expenseResult} registro(s) atualizado(s)`);

      const expenseResult2 = await prisma.$executeRaw`
        UPDATE expenses
        SET description = REPLACE(description, ' - Lote ', ' - ')
        WHERE description LIKE '% - Lote %'
      `;
      console.log(`✅ expenses: ${expenseResult2} registro(s) com " - Lote " atualizado(s)`);
    } catch (error) {
      console.log('⚠️ Tabela expenses não encontrada ou sem alterações necessárias');
    }

    // 3. Corrigir tabela revenues (nome correto da tabela)
    try {
      console.log('\n📊 Atualizando tabela revenues...');
      const revenueResult = await prisma.$executeRaw`
        UPDATE revenues
        SET description = REPLACE(description, 'Lote LOT-', 'LOT-')
        WHERE description LIKE '%Lote LOT-%'
      `;
      console.log(`✅ revenues: ${revenueResult} registro(s) atualizado(s)`);

      const revenueResult2 = await prisma.$executeRaw`
        UPDATE revenues
        SET description = REPLACE(description, ' - Lote ', ' - ')
        WHERE description LIKE '% - Lote %'
      `;
      console.log(`✅ revenues: ${revenueResult2} registro(s) com " - Lote " atualizado(s)`);
    } catch (error) {
      console.log('⚠️ Tabela revenues não encontrada ou sem alterações necessárias');
    }

    // 4. Corrigir tabela calendar_events (nome correto da tabela)
    try {
      console.log('\n📊 Atualizando tabela calendar_events...');
      const eventResult = await prisma.$executeRaw`
        UPDATE calendar_events
        SET title = REPLACE(title, 'Lote LOT-', 'LOT-')
        WHERE title LIKE '%Lote LOT-%'
      `;
      console.log(`✅ calendar_events (title): ${eventResult} registro(s) atualizado(s)`);

      const eventResult2 = await prisma.$executeRaw`
        UPDATE calendar_events
        SET title = REPLACE(title, ' - Lote ', ' - ')
        WHERE title LIKE '% - Lote %'
      `;
      console.log(`✅ calendar_events (title): ${eventResult2} registro(s) com " - Lote " atualizado(s)`);

      const eventDescResult = await prisma.$executeRaw`
        UPDATE calendar_events
        SET description = REPLACE(description, 'Lote LOT-', 'LOT-')
        WHERE description LIKE '%Lote LOT-%'
      `;
      console.log(`✅ calendar_events (description): ${eventDescResult} registro(s) atualizado(s)`);
    } catch (error) {
      console.log('⚠️ Tabela calendar_events não encontrada ou sem alterações necessárias');
    }

    // 5. Verificar resultados
    console.log('\n🔍 Verificando resultados...');

    // Buscar exemplos de descrições atualizadas
    const samples = await prisma.cashFlow.findMany({
      where: {
        OR: [
          { description: { contains: 'LOT-' } },
          { description: { contains: 'Compra de Gado' } },
          { description: { contains: 'Frete' } },
          { description: { contains: 'Comissão' } }
        ]
      },
      select: {
        id: true,
        description: true
      },
      take: 5
    });

    if (samples.length > 0) {
      console.log('\n📝 Exemplos de descrições atualizadas:');
      samples.forEach(sample => {
        console.log(`   • ${sample.description}`);
      });
    }

    console.log('\n✨ Correção concluída com sucesso!');
    console.log('💡 As descrições foram padronizadas para usar apenas LOT-XXXXX sem redundância.');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
fixLotDescriptions().catch(console.error);
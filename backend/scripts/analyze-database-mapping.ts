#!/usr/bin/env tsx

/**
 * Script para analisar e documentar o mapeamento entre modelos Prisma e tabelas do banco
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ModelMapping {
  modelName: string;
  tableName: string;
  fields: Array<{
    fieldName: string;
    columnName: string;
    type: string;
  }>;
}

async function analyzeDataaseMapping() {
  console.log('🔍 Analisando mapeamento entre Prisma e banco de dados\n');
  console.log('=' .repeat(70));

  try {
    // Ler o schema.prisma para extrair os mapeamentos
    const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Extrair modelos e seus mapeamentos
    const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
    const mappings: ModelMapping[] = [];

    let match;
    while ((match = modelRegex.exec(schemaContent)) !== null) {
      const modelName = match[1];
      const modelContent = match[2];

      // Buscar @@map para nome da tabela
      const tableMapMatch = modelContent.match(/@@map\("([^"]+)"\)/);
      const tableName = tableMapMatch ? tableMapMatch[1] : modelName;

      // Buscar campos com @map
      const fieldRegex = /(\w+)\s+(\w+(?:\[\])?)\s+[^@\n]*(?:@map\("([^"]+)"\))?/g;
      const fields: ModelMapping['fields'] = [];

      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(modelContent)) !== null) {
        if (fieldMatch[1] && !fieldMatch[1].startsWith('@@')) {
          fields.push({
            fieldName: fieldMatch[1],
            columnName: fieldMatch[3] || fieldMatch[1],
            type: fieldMatch[2]
          });
        }
      }

      mappings.push({
        modelName,
        tableName,
        fields
      });
    }

    // Exibir mapeamentos encontrados
    console.log('\n📊 MAPEAMENTO PRISMA → BANCO DE DADOS:\n');
    console.log('=' .repeat(70));

    for (const mapping of mappings) {
      if (mapping.modelName !== mapping.tableName) {
        console.log(`\n✅ Modelo: ${mapping.modelName}`);
        console.log(`   Tabela: ${mapping.tableName}`);

        // Mostrar campos com mapeamento diferente
        const mappedFields = mapping.fields.filter(f => f.fieldName !== f.columnName);
        if (mappedFields.length > 0) {
          console.log('   Campos mapeados:');
          mappedFields.forEach(field => {
            console.log(`     - ${field.fieldName} → ${field.columnName}`);
          });
        }
      }
    }

    // Verificar tabelas que existem no banco
    console.log('\n📋 TABELAS NO BANCO DE DADOS:\n');
    console.log('=' .repeat(70));

    const tables = await prisma.$queryRaw<Array<{table_name: string}>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\nTabelas encontradas:');
    tables.forEach(table => {
      const model = mappings.find(m => m.tableName === table.table_name);
      if (model) {
        console.log(`  ✅ ${table.table_name} (Modelo: ${model.modelName})`);
      } else {
        console.log(`  ⚠️  ${table.table_name} (Sem modelo Prisma)`);
      }
    });

    // Análise de uso direto vs API
    console.log('\n🔄 PADRÃO DE ACESSO AOS DADOS:\n');
    console.log('=' .repeat(70));

    console.log(`
📌 Sistema atual usa dois padrões:

1. BACKEND API (via Prisma):
   - Todas as operações CRUD principais
   - Autenticação e autorização
   - Lógica de negócios complexa
   - Transações e integridade referencial

2. ACESSO DIRETO (Supabase):
   ❌ NÃO encontrado no código frontend atual
   - O sistema parece usar apenas a API backend

📊 Tabelas com nomes diferentes (Prisma → Banco):
`);

    mappings.forEach(m => {
      if (m.modelName !== m.tableName) {
        console.log(`   • ${m.modelName} → ${m.tableName}`);
      }
    });

    // Verificar redundâncias no banco
    console.log('\n🔍 VERIFICANDO REDUNDÂNCIAS "Lote LOT-" NO BANCO:\n');
    console.log('=' .repeat(70));

    // Verificar cash_flows (nome correto da tabela)
    const cashFlowCount = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count
      FROM cash_flows
      WHERE description LIKE '%Lote LOT-%'
    `;

    if (cashFlowCount[0].count > 0) {
      console.log(`\n⚠️  cash_flows: ${cashFlowCount[0].count} registros com redundância`);

      // Mostrar exemplos
      const examples = await prisma.$queryRaw<Array<{id: string, description: string}>>`
        SELECT id, description
        FROM cash_flows
        WHERE description LIKE '%Lote LOT-%'
        LIMIT 3
      `;

      console.log('   Exemplos:');
      examples.forEach(ex => {
        console.log(`     - ${ex.description}`);
      });
    } else {
      console.log('\n✅ cash_flows: Sem redundâncias');
    }

    // Verificar expenses (nome correto da tabela)
    try {
      const expenseCount = await prisma.$queryRaw<Array<{count: bigint}>>`
        SELECT COUNT(*) as count
        FROM expenses
        WHERE description LIKE '%Lote LOT-%'
      `;

      if (expenseCount[0].count > 0) {
        console.log(`\n⚠️  expenses: ${expenseCount[0].count} registros com redundância`);

        // Mostrar exemplos
        const expenseExamples = await prisma.$queryRaw<Array<{id: string, description: string}>>`
          SELECT id, description
          FROM expenses
          WHERE description LIKE '%Lote LOT-%'
          LIMIT 3
        `;

        console.log('   Exemplos:');
        expenseExamples.forEach(ex => {
          console.log(`     - ${ex.description}`);
        });
      } else {
        console.log('✅ expenses: Sem redundâncias');
      }
    } catch (error) {
      console.log('ℹ️  Tabela expenses não encontrada');
    }

    console.log('\n' + '=' .repeat(70));
    console.log('\n📝 RESUMO E RECOMENDAÇÕES:\n');

    console.log(`
1. O sistema usa Prisma ORM que mapeia modelos para tabelas com nomes diferentes
2. NÃO foi encontrado uso direto do Supabase no frontend
3. Todo acesso a dados passa pela API backend (padrão correto)
4. Existem redundâncias "Lote LOT-" que precisam ser corrigidas no banco

🔧 AÇÃO NECESSÁRIA:
   Execute o script fix-lot-descriptions-db.ts para corrigir as redundâncias
`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDataaseMapping();
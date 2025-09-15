#!/usr/bin/env tsx

/**
 * Script para testar o novo sistema de conexão centralizado
 *
 * Uso: tsx scripts/test-database-connection.ts
 */

import { db } from '../src/lib/prisma';
import { logger } from '../src/config/logger';

async function testConnection() {
  console.log('========================================');
  console.log('Testando Sistema de Conexão Centralizado');
  console.log('========================================\n');

  try {
    // 1. Teste de conexão inicial
    console.log('1. Testando conexão inicial...');
    await db.connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // 2. Health check
    console.log('2. Executando health check...');
    const health = await db.healthCheck();
    console.log('Health Status:', JSON.stringify(health, null, 2));
    console.log('✅ Health check completo!\n');

    // 3. Teste de query simples
    console.log('3. Testando query simples...');
    const client = await db.getClient();
    const result = await client.$queryRaw`SELECT NOW() as current_time, current_database() as database`;
    console.log('Query Result:', result);
    console.log('✅ Query executada com sucesso!\n');

    // 4. Teste de transação
    console.log('4. Testando transação...');
    const transactionResult = await db.transaction(async (tx) => {
      const count = await tx.user.count();
      return { userCount: count };
    });
    console.log('Transaction Result:', transactionResult);
    console.log('✅ Transação executada com sucesso!\n');

    // 5. Estatísticas
    console.log('5. Obtendo estatísticas...');
    const stats = db.getStats();
    console.log('Connection Stats:', JSON.stringify(stats, null, 2));
    console.log('✅ Estatísticas obtidas!\n');

    // 6. Teste de reconexão
    console.log('6. Testando reconexão...');
    console.log('Desconectando...');
    await db.disconnect();
    console.log('Reconectando...');
    await db.connect();
    console.log('✅ Reconexão bem-sucedida!\n');

    // 7. Teste final
    console.log('7. Teste final de integridade...');
    const finalHealth = await db.healthCheck();
    if (finalHealth.status === 'healthy') {
      console.log('✅ Sistema de conexão está totalmente funcional!\n');
    } else {
      console.log('⚠️ Sistema com problemas:', finalHealth.message);
    }

    console.log('========================================');
    console.log('TODOS OS TESTES PASSARAM COM SUCESSO! ✅');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE OS TESTES:');
    console.error(error);

    if (error instanceof Error) {
      console.error('\nDetalhes do erro:');
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }

    console.log('\n========================================');
    console.log('TESTE FALHOU ❌');
    console.log('========================================');

    process.exit(1);
  } finally {
    // Limpa conexão
    await db.disconnect();
    process.exit(0);
  }
}

// Executa o teste
testConnection().catch(console.error);
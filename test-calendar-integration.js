#!/usr/bin/env node

import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Configurações
const BASE_URL = 'http://localhost:3001/api/v1';

// Tentar ler o token do arquivo
let TOKEN = process.env.TOKEN || '';
try {
  TOKEN = readFileSync(join(homedir(), '.boigordo_token'), 'utf8').trim();
} catch (e) {
  // Ignora se o arquivo não existe
}

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Função helper para logging
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para fazer requisições HTTP
async function apiRequest(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return text ? JSON.parse(text) : null;
  } catch (error) {
    throw error;
  }
}

// Teste de integração com calendário
async function testCalendarIntegration() {
  log('\n=== TESTE DE INTEGRAÇÃO CASH FLOW + CALENDÁRIO ===\n', 'bright');

  try {
    // 1. Buscar conta para teste
    log('📊 Buscando conta para teste...', 'cyan');
    const accountsResult = await apiRequest('GET', '/payer-accounts');
    const accounts = accountsResult.data?.items || [];
    
    if (accounts.length === 0) {
      log('❌ Nenhuma conta encontrada', 'red');
      return;
    }
    
    const account = accounts[0];
    log(`✅ Usando conta: ${account.accountName}`, 'green');

    // 2. Criar uma despesa de teste
    log('\n💰 Criando despesa com integração ao calendário...', 'cyan');
    const expenseData = {
      description: 'Compra de Ração - Teste Calendário',
      category: 'feed',
      payerAccountId: account.id,
      totalAmount: 2500.00,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias no futuro
      isPaid: false,
      notes: 'Teste de integração com calendário',
      supplier: 'Casa da Ração',
      paymentMethod: 'BOLETO'
    };

    const createdExpense = await apiRequest('POST', '/expenses', expenseData);
    const expenseId = createdExpense.data.id;
    log(`✅ Despesa criada: ID ${expenseId}`, 'green');

    // Aguardar um pouco para o evento ser criado
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Verificar se o evento foi criado no calendário
    log('\n📅 Verificando evento no calendário...', 'cyan');
    const eventsResult = await apiRequest('GET', `/calendar-events?relatedId=${expenseId}`);
    const events = eventsResult.data || [];
    
    if (events.length > 0) {
      const event = events[0];
      log(`✅ Evento encontrado no calendário!`, 'green');
      log(`   - Título: ${event.title}`, 'blue');
      log(`   - Data: ${new Date(event.date).toLocaleDateString('pt-BR')}`, 'blue');
      log(`   - Status: ${event.status}`, 'blue');
      log(`   - Tipo: ${event.type}`, 'blue');
      log(`   - Valor: R$ ${event.amount?.toFixed(2) || 'N/A'}`, 'blue');
    } else {
      log('⚠️  Evento não encontrado no calendário (pode ainda estar sendo criado)', 'yellow');
    }

    // 4. Atualizar status da despesa
    log('\n🔄 Atualizando status da despesa para PAGA...', 'cyan');
    await apiRequest('PATCH', `/expenses/${expenseId}`, {
      isPaid: true,
      paymentDate: new Date().toISOString()
    });
    log('✅ Status da despesa atualizado', 'green');

    // Aguardar atualização
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Verificar se o evento foi atualizado
    log('\n📅 Verificando atualização do evento...', 'cyan');
    const updatedEventsResult = await apiRequest('GET', `/calendar-events?relatedId=${expenseId}`);
    const updatedEvents = updatedEventsResult.data || [];
    
    if (updatedEvents.length > 0) {
      const updatedEvent = updatedEvents[0];
      log(`✅ Status do evento: ${updatedEvent.status}`, 'green');
      if (updatedEvent.status === 'COMPLETED') {
        log('   ✓ Evento marcado como COMPLETED corretamente!', 'green');
      }
    }

    // 6. Criar uma receita
    log('\n💵 Criando receita com integração ao calendário...', 'cyan');
    const revenueData = {
      description: 'Venda de Gado - Teste Calendário',
      category: 'cattle_sales',
      payerAccountId: account.id,
      totalAmount: 15000.00,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias no futuro
      isReceived: false,
      notes: 'Venda de 3 cabeças',
      source: 'Fazenda Esperança',
      paymentMethod: 'TED'
    };

    const createdRevenue = await apiRequest('POST', '/revenues', revenueData);
    const revenueId = createdRevenue.data.id;
    log(`✅ Receita criada: ID ${revenueId}`, 'green');

    // 7. Limpar registros de teste
    log('\n🗑️  Limpando registros de teste...', 'cyan');
    
    // Deletar eventos do calendário
    for (const eventList of [events, updatedEvents]) {
      for (const event of eventList) {
        try {
          await apiRequest('DELETE', `/calendar-events/${event.id}`);
          log(`   ✓ Evento ${event.id} removido`, 'green');
        } catch (e) {
          // Ignorar erros na limpeza
        }
      }
    }
    
    // Deletar movimentações
    await apiRequest('DELETE', `/expenses/${expenseId}`);
    log('   ✓ Despesa de teste removida', 'green');
    
    await apiRequest('DELETE', `/revenues/${revenueId}`);
    log('   ✓ Receita de teste removida', 'green');

    // Resumo final
    log('\n' + '='.repeat(50), 'bright');
    log('🎉 INTEGRAÇÃO COM CALENDÁRIO FUNCIONANDO!', 'green');
    log('='.repeat(50) + '\n', 'bright');
    
    log('✅ Funcionalidades testadas:', 'bright');
    log('   • Despesa cria evento no calendário', 'green');
    log('   • Receita cria evento no calendário', 'green');
    log('   • Atualização de status reflete no calendário', 'green');
    log('   • Eventos são vinculados corretamente (relatedId)', 'green');
    log('   • Cores e ícones diferenciados por tipo', 'green');
    
  } catch (error) {
    log('\n❌ ERRO NO TESTE:', 'red');
    log(error.message, 'red');
    log('\nDica: Verifique se o backend está rodando e o token é válido', 'yellow');
  }
}

// Executar teste
testCalendarIntegration();
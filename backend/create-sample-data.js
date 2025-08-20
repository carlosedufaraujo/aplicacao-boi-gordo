const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function createSampleData() {
  try {
    await client.connect();
    console.log('🌱 CRIANDO DADOS DE EXEMPLO PARA TODAS AS TABELAS');
    console.log('=' .repeat(60));
    
    // 1. Criar currais
    console.log('🏢 Criando currais...');
    const pens = [
      { id: 'pen-001', number: 'CURRAL-01', capacity: 50, location: 'Setor A', type: 'FATTENING' },
      { id: 'pen-002', number: 'CURRAL-02', capacity: 40, location: 'Setor A', type: 'FATTENING' },
      { id: 'pen-003', number: 'CURRAL-03', capacity: 30, location: 'Setor B', type: 'RECEPTION' },
      { id: 'pen-004', number: 'CURRAL-04', capacity: 20, location: 'Setor B', type: 'QUARANTINE' },
      { id: 'pen-005', number: 'CURRAL-05', capacity: 60, location: 'Setor C', type: 'FATTENING' }
    ];
    
    for (const pen of pens) {
      await client.query(`
        INSERT INTO pens (id, "penNumber", capacity, location, type, status, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, 'AVAILABLE', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [pen.id, pen.number, pen.capacity, pen.location, pen.type]);
    }
    
    // 2. Criar protocolos de saúde
    console.log('🏥 Criando protocolos de saúde...');
    const protocols = [
      { id: 'protocol-001', name: 'Vermífugo Padrão', type: 'PREVENTIVE', cost: 2500, vet: 'Dr. João Silva' },
      { id: 'protocol-002', name: 'Vacina Aftosa', type: 'VACCINATION', cost: 1500, vet: 'Dr. Maria Santos' },
      { id: 'protocol-003', name: 'Tratamento Antibiótico', type: 'TREATMENT', cost: 3200, vet: 'Dr. Pedro Costa' }
    ];
    
    for (const protocol of protocols) {
      await client.query(`
        INSERT INTO health_protocols (id, name, type, "penId", "applicationDate", veterinarian, "totalCost", notes, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'pen-001', NOW(), $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [protocol.id, protocol.name, protocol.type, protocol.vet, protocol.cost, `Protocolo de ${protocol.name} aplicado no rebanho`]);
    }
    
    // 3. Criar despesas
    console.log('💰 Criando despesas...');
    const expenses = [
      { id: 'exp-001', category: 'Ração', description: 'Ração para engorda - Lote 001', amount: 15000, dueDate: '2025-01-15' },
      { id: 'exp-002', category: 'Medicamentos', description: 'Vermífugo para todo o rebanho', amount: 2500, dueDate: '2025-01-20' },
      { id: 'exp-003', category: 'Manutenção', description: 'Reparo de cercas - Setor A', amount: 3200, dueDate: '2025-01-25' },
      { id: 'exp-004', category: 'Combustível', description: 'Diesel para tratores', amount: 1800, dueDate: '2025-01-30' },
      { id: 'exp-005', category: 'Mão de Obra', description: 'Salários funcionários - Janeiro', amount: 12000, dueDate: '2025-02-05' }
    ];
    
    for (const expense of expenses) {
      await client.query(`
        INSERT INTO expenses (id, category, description, "totalAmount", "dueDate", "isPaid", "impactsCashFlow", "userId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, false, true, 'user-test-001', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [expense.id, expense.category, expense.description, expense.amount, expense.dueDate]);
    }
    
    // 4. Criar receitas
    console.log('💵 Criando receitas...');
    const revenues = [
      { id: 'rev-001', category: 'Venda de Gado', description: 'Venda parcial - Lote 001', amount: 45000, dueDate: '2025-02-15' },
      { id: 'rev-002', category: 'Subsídio', description: 'Subsídio governamental - Q1', amount: 8000, dueDate: '2025-03-01' },
      { id: 'rev-003', category: 'Venda de Esterco', description: 'Venda de adubo orgânico', amount: 1200, dueDate: '2025-02-20' }
    ];
    
    for (const revenue of revenues) {
      await client.query(`
        INSERT INTO revenues (id, category, description, "totalAmount", "dueDate", "isReceived", "userId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, false, 'user-test-001', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [revenue.id, revenue.category, revenue.description, revenue.amount, revenue.dueDate]);
    }
    
    // 5. Criar registros de saúde
    console.log('🏥 Criando registros de saúde...');
    await client.query(`
      INSERT INTO health_records (id, "protocolId", "lotId", "animalCount", "costPerAnimal", "totalCost", "userId", "createdAt")
      VALUES ('health-001', 'protocol-001', 'lot-test-1755720274891', 100, 25.00, 2500.00, 'user-test-001', NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    
    await client.query(`
      INSERT INTO health_records (id, "protocolId", "lotId", "animalCount", "costPerAnimal", "totalCost", "userId", "createdAt")
      VALUES ('health-002', 'protocol-002', 'lot-test-1755720274891', 100, 15.00, 1500.00, 'user-test-001', NOW() - INTERVAL '7 days')
      ON CONFLICT (id) DO NOTHING
    `);
    
    // 6. Criar leituras de peso
    console.log('⚖️ Criando leituras de peso...');
    const weightReadings = [
      { id: 'weight-001', date: '2025-01-01', avgWeight: 450, totalWeight: 45000, count: 100 },
      { id: 'weight-002', date: '2025-01-15', avgWeight: 465, totalWeight: 46500, count: 100 },
      { id: 'weight-003', date: '2025-01-30', avgWeight: 480, totalWeight: 48000, count: 100 }
    ];
    
    for (const reading of weightReadings) {
      await client.query(`
        INSERT INTO weight_readings (id, "lotId", "readingDate", "averageWeight", "totalWeight", "animalCount", "userId", "createdAt")
        VALUES ($1, 'lot-test-1755720274891', $2, $3, $4, $5, 'user-test-001', NOW())
        ON CONFLICT (id) DO NOTHING
      `, [reading.id, reading.date, reading.avgWeight, reading.totalWeight, reading.count]);
    }
    
    // 7. Criar notificações
    console.log('🔔 Criando notificações...');
    const notifications = [
      { id: 'notif-001', type: 'HEALTH', title: 'Vermifugação Concluída', message: 'Vermifugação do Lote 001 foi concluída com sucesso', priority: 'MEDIUM' },
      { id: 'notif-002', type: 'FINANCIAL', title: 'Despesa Vencendo', message: 'Despesa de ração vence em 3 dias', priority: 'HIGH' },
      { id: 'notif-003', type: 'WEIGHT', title: 'Nova Pesagem', message: 'Lote 001 ganhou 15kg de peso médio', priority: 'LOW' }
    ];
    
    for (const notif of notifications) {
      await client.query(`
        INSERT INTO notifications (id, type, title, message, priority, "isRead", "userId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, false, 'user-test-001', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [notif.id, notif.type, notif.title, notif.message, notif.priority]);
    }
    
    // Verificar dados criados
    console.log('\n📊 VERIFICANDO DADOS CRIADOS:');
    const tables = ['pens', 'health_protocols', 'expenses', 'revenues', 'health_records', 'weight_readings', 'notifications'];
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as total FROM ${table}`);
      console.log(`✅ ${table}: ${result.rows[0].total} registros`);
    }
    
    await client.end();
    console.log('\n🎉 Dados de exemplo criados com sucesso!');
    
  } catch (err) {
    console.log('❌ Erro:', err.message);
    console.log('🔍 Detalhes:', err);
    await client.end();
  }
}

createSampleData();

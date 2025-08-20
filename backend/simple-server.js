const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3333;

// Configuração do PostgreSQL - SEU PROJETO
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

// Conectar ao banco
client.connect()
  .then(() => console.log('✅ Conectado ao PostgreSQL!'))
  .catch(err => console.error('❌ Erro de conexão:', err));

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando com PostgreSQL!'
  });
});

// Listar lotes de gado (simplificado)
app.get('/api/v1/cattle-lots', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        id,
        "lotNumber" as lot_number,
        status,
        "entryQuantity" as animal_count,
        "entryWeight" as estimated_weight,
        "entryDate" as entry_date,
        "totalCost" as total_cost,
        "currentQuantity" as current_quantity,
        "createdAt" as created_at
      FROM cattle_lots 
      ORDER BY "createdAt" DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar lotes',
      details: err.message 
    });
  }
});

// Criar lote usando apenas INSERT direto (para teste)
app.post('/api/v1/cattle-lots-simple', async (req, res) => {
  try {
    const { 
      lotNumber, 
      entryQuantity, 
      entryWeight, 
      acquisitionCost = 0
    } = req.body;
    
    if (!lotNumber || !entryQuantity || !entryWeight) {
      return res.status(400).json({
        error: 'Campos obrigatórios: lotNumber, entryQuantity, entryWeight'
      });
    }
    
    // Inserir diretamente sem foreign keys problemáticas
    const result = await client.query(`
      INSERT INTO cattle_lots (
        id, "lotNumber", "purchaseOrderId", "entryDate", "entryWeight", 
        "entryQuantity", "acquisitionCost", "healthCost", "feedCost", 
        "operationalCost", "freightCost", "otherCosts", "totalCost", 
        "deathCount", "currentQuantity", status, "createdAt", "updatedAt"
      )
      SELECT 
        gen_random_uuid()::text, $1, po.id, NOW(), $2, $3, $4, 0, 0, 0, 0, 0, $4, 0, $3, 'ACTIVE', NOW(), NOW()
      FROM purchase_orders po 
      LIMIT 1
      RETURNING id, "lotNumber", "entryQuantity", "entryWeight", "totalCost"
    `, [lotNumber, entryWeight, entryQuantity, acquisitionCost]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Nenhuma ordem de compra encontrada. Crie uma ordem primeiro.'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Lote criado com sucesso!',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao criar lote',
      details: err.message 
    });
  }
});

// Estatísticas
app.get('/api/v1/stats', async (req, res) => {
  try {
    const lots = await client.query('SELECT COUNT(*) as total FROM cattle_lots');
    const partners = await client.query('SELECT COUNT(*) as total FROM partners');
    const expenses = await client.query('SELECT COUNT(*) as total FROM expenses');
    const revenues = await client.query('SELECT COUNT(*) as total FROM revenues');
    const orders = await client.query('SELECT COUNT(*) as total FROM purchase_orders');
    const cycles = await client.query('SELECT COUNT(*) as total FROM cycles');
    
    res.json({
      success: true,
      stats: {
        cattle_lots: parseInt(lots.rows[0].total),
        partners: parseInt(partners.rows[0].total),
        expenses: parseInt(expenses.rows[0].total),
        revenues: parseInt(revenues.rows[0].total),
        purchase_orders: parseInt(orders.rows[0].total),
        cycles: parseInt(cycles.rows[0].total)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      details: err.message 
    });
  }
});

// Listar ciclos
app.get('/api/v1/cycles', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        id,
        name,
        description,
        "startDate" as startDate,
        "endDate" as endDate,
        status,
        budget,
        "targetAnimals" as targetAnimals,
        "actualAnimals" as actualAnimals,
        "totalCost" as totalCost,
        "totalRevenue" as totalRevenue,
        "createdAt" as createdAt
      FROM cycles 
      ORDER BY "createdAt" DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar ciclos',
      details: err.message 
    });
  }
});

// Endpoint para conectar com o frontend
app.get('/api/v1/frontend-data', async (req, res) => {
  try {
    // Buscar dados que o frontend precisa
    const [lots, cycles] = await Promise.all([
      client.query(`
        SELECT 
          id,
          "lotNumber" as lotNumber,
          "entryQuantity" as animalCount,
          "entryWeight" as totalWeight,
          "totalCost" as totalCost,
          status,
          "createdAt" as createdAt
        FROM cattle_lots 
        ORDER BY "createdAt" DESC
        LIMIT 10
      `),
      client.query(`
        SELECT 
          id,
          name,
          status,
          "targetAnimals" as targetAnimals,
          "actualAnimals" as actualAnimals,
          budget,
          "createdAt" as createdAt
        FROM cycles 
        ORDER BY "createdAt" DESC
        LIMIT 5
      `)
    ]);
    
    res.json({
      success: true,
      lots: lots.rows,
      cycles: cycles.rows,
      summary: {
        totalLots: lots.rows.length,
        totalAnimals: lots.rows.reduce((sum, lot) => sum + (lot.animalcount || 0), 0),
        totalValue: lots.rows.reduce((sum, lot) => sum + (lot.totalcost || 0), 0),
        totalCycles: cycles.rows.length,
        activeCycles: cycles.rows.filter(c => c.status === 'ACTIVE').length
      }
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar dados para frontend',
      details: err.message 
    });
  }
});

// Listar despesas
app.get('/api/v1/expenses', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        id, category, description, "totalAmount" as totalAmount,
        "dueDate" as dueDate, "paymentDate" as paymentDate, "isPaid" as isPaid,
        "createdAt" as createdAt
      FROM expenses 
      ORDER BY "createdAt" DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar despesas',
      details: err.message 
    });
  }
});

// Listar receitas
app.get('/api/v1/revenues', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        id, category, description, "totalAmount" as totalAmount,
        "dueDate" as dueDate, "receiptDate" as receiptDate, "isReceived" as isReceived,
        "createdAt" as createdAt
      FROM revenues 
      ORDER BY "createdAt" DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar receitas',
      details: err.message 
    });
  }
});

// Listar currais
app.get('/api/v1/pens', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        id, "penNumber" as penNumber, capacity, location, type, status,
        "isActive" as isActive, "createdAt" as createdAt
      FROM pens 
      ORDER BY "penNumber"
    `);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar currais',
      details: err.message 
    });
  }
});

// Listar registros de saúde
app.get('/api/v1/health-records', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        id, "protocolId" as protocolId, "lotId" as lotId, "animalCount" as animalCount,
        "costPerAnimal" as costPerAnimal, "totalCost" as totalCost, "createdAt" as createdAt
      FROM health_records 
      ORDER BY "createdAt" DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar registros de saúde',
      details: err.message 
    });
  }
});

// Listar leituras de peso
app.get('/api/v1/weight-readings', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        id, "lotId" as lotId, "readingDate" as readingDate, "averageWeight" as averageWeight,
        "totalWeight" as totalWeight, "animalCount" as animalCount, "createdAt" as createdAt
      FROM weight_readings 
      ORDER BY "createdAt" DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar leituras de peso',
      details: err.message 
    });
  }
});

// Endpoint completo para todos os dados
app.get('/api/v1/all-data', async (req, res) => {
  try {
    const [cycles, lots, partners, expenses, revenues, pens, healthRecords, weightReadings] = await Promise.all([
      client.query('SELECT * FROM cycles ORDER BY "createdAt" DESC'),
      client.query('SELECT * FROM cattle_lots ORDER BY "createdAt" DESC'),
      client.query('SELECT * FROM partners ORDER BY "createdAt" DESC'),
      client.query('SELECT * FROM expenses ORDER BY "createdAt" DESC'),
      client.query('SELECT * FROM revenues ORDER BY "createdAt" DESC'),
      client.query('SELECT * FROM pens ORDER BY "penNumber"'),
      client.query('SELECT * FROM health_records ORDER BY "createdAt" DESC'),
      client.query('SELECT * FROM weight_readings ORDER BY "createdAt" DESC')
    ]);
    
    res.json({
      success: true,
      data: {
        cycles: cycles.rows,
        cattleLots: lots.rows,
        partners: partners.rows,
        expenses: expenses.rows,
        revenues: revenues.rows,
        pens: pens.rows,
        healthRecords: healthRecords.rows,
        weightReadings: weightReadings.rows
      },
      summary: {
        totalCycles: cycles.rows.length,
        totalLots: lots.rows.length,
        totalPartners: partners.rows.length,
        totalExpenses: expenses.rows.length,
        totalRevenues: revenues.rows.length,
        totalPens: pens.rows.length,
        totalHealthRecords: healthRecords.rows.length,
        totalWeightReadings: weightReadings.rows.length
      }
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar todos os dados',
      details: err.message 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🐄 Lotes: http://localhost:${port}/api/v1/cattle-lots`);
  console.log(`💰 Despesas: http://localhost:${port}/api/v1/expenses`);
  console.log(`💵 Receitas: http://localhost:${port}/api/v1/revenues`);
  console.log(`🏢 Currais: http://localhost:${port}/api/v1/pens`);
  console.log(`📈 Estatísticas: http://localhost:${port}/api/v1/stats`);
  console.log(`🎯 Todos os Dados: http://localhost:${port}/api/v1/all-data`);
});

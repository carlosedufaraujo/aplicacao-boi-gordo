const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
const port = 3333;

// Configuração do PostgreSQL - SEU PROJETO
const client = new Client({
  connectionString: 'postgresql://postgres:368308450Ce*@db.vffxtvuqhlhcbbyqmynz.supabase.co:5432/postgres'
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

// Teste de conexão
app.get('/api/v1/test-connection', async (req, res) => {
  try {
    const result = await client.query('SELECT NOW() as current_time');
    res.json({
      success: true,
      message: 'Conexão com PostgreSQL funcionando!',
      timestamp: result.rows[0].current_time
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro de conexão',
      details: err.message 
    });
  }
});

// Listar tabelas
app.get('/api/v1/tables', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    res.json({
      success: true,
      tables: result.rows.map(row => row.table_name),
      total: result.rows.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar tabelas',
      details: err.message 
    });
  }
});

// Listar lotes de gado
app.get('/api/v1/cattle-lots', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        id,
        "lotNumber",
        status,
        "entryQuantity" as animal_count,
        "entryWeight" as estimated_weight,
        "entryDate" as entry_date,
        "totalCost" as total_cost,
        "currentQuantity" as current_quantity,
        "createdAt" as created_at,
        "updatedAt" as updated_at
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

// Criar novo lote
app.post('/api/v1/cattle-lots', async (req, res) => {
  try {
    const { 
      lotNumber, 
      entryQuantity, 
      entryWeight, 
      acquisitionCost = 0,
      status = 'ACTIVE'
    } = req.body;
    
    if (!lotNumber || !entryQuantity || !entryWeight) {
      return res.status(400).json({
        error: 'Campos obrigatórios: lotNumber, entryQuantity, entryWeight'
      });
    }
    
    // Primeiro, criar uma ordem de compra simples
    const purchaseOrderId = 'PO-' + Date.now();
    await client.query(`
      INSERT INTO purchase_orders (
        id, "orderNumber", "vendorId", "userId", location, "purchaseDate",
        "animalCount", "animalType", "totalWeight", "averageWeight", 
        "carcassYield", "pricePerArroba", "totalValue", commission, 
        "freightCost", "otherCosts", "paymentType", "payerAccountId",
        "principalDueDate", status, "currentStage", "createdAt", "updatedAt"
      )
      VALUES (
        $1, $1, 'vendor-default', 'user-default', 'Local Padrão', NOW(),
        $2, 'MIXED', $3, $4, 55.0, 200.0, $5, 0, 0, 0, 'CASH', 'account-default',
        NOW() + INTERVAL '30 days', 'PENDING', 'CREATED', NOW(), NOW()
      )
    `, [purchaseOrderId, entryQuantity, entryWeight, entryWeight / entryQuantity, acquisitionCost]);
    
    const totalCost = acquisitionCost;
    const currentQuantity = entryQuantity;
    
    const result = await client.query(`
      INSERT INTO cattle_lots (
        id, "lotNumber", "purchaseOrderId", "entryDate", "entryWeight", 
        "entryQuantity", "acquisitionCost", "healthCost", "feedCost", 
        "operationalCost", "freightCost", "otherCosts", "totalCost", 
        "deathCount", "currentQuantity", status, "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text, $1, $2, NOW(), $3, $4, $5, 0, 0, 0, 0, 0, $6, 0, $7, $8, NOW(), NOW()
      )
      RETURNING *
    `, [lotNumber, purchaseOrderId, entryWeight, entryQuantity, acquisitionCost, totalCost, currentQuantity, status]);
    
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

// Estatísticas gerais
app.get('/api/v1/stats', async (req, res) => {
  try {
    const lots = await client.query('SELECT COUNT(*) as total FROM cattle_lots');
    const partners = await client.query('SELECT COUNT(*) as total FROM partners');
    const expenses = await client.query('SELECT COUNT(*) as total FROM expenses');
    const revenues = await client.query('SELECT COUNT(*) as total FROM revenues');
    
    res.json({
      success: true,
      stats: {
        cattle_lots: parseInt(lots.rows[0].total),
        partners: parseInt(partners.rows[0].total),
        expenses: parseInt(expenses.rows[0].total),
        revenues: parseInt(revenues.rows[0].total)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      details: err.message 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 Teste conexão: http://localhost:${port}/api/v1/test-connection`);
  console.log(`📋 Tabelas: http://localhost:${port}/api/v1/tables`);
  console.log(`🐄 Lotes: http://localhost:${port}/api/v1/cattle-lots`);
  console.log(`📈 Estatísticas: http://localhost:${port}/api/v1/stats`);
});

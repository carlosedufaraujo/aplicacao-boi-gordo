const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function fixDatabase() {
  try {
    await client.connect();
    console.log('🔧 CORRIGINDO PROBLEMAS DO BANCO');
    console.log('=' .repeat(40));
    
    // 1. Criar dados base mínimos para testar
    console.log('1. Criando usuário teste...');
    await client.query(`
      INSERT INTO users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
      VALUES ('user-test-001', 'test@test.com', 'test123', 'Usuário Teste', 'ADMIN', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log('2. Criando parceiro teste...');
    await client.query(`
      INSERT INTO partners (id, name, type, "isActive", "createdAt", "updatedAt")
      VALUES ('partner-test-001', 'Fornecedor Teste', 'VENDOR', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log('3. Criando conta teste...');
    await client.query(`
      INSERT INTO payer_accounts (id, "bankName", "accountName", agency, "accountNumber", "accountType", balance, "isActive", "createdAt", "updatedAt")
      VALUES ('account-test-001', 'Banco do Brasil', 'Conta Corrente Teste', '1234-5', '12345-6', 'CHECKING', 0, true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log('4. Criando ordem de compra teste...');
    const orderId = 'order-test-' + Date.now();
    await client.query(`
      INSERT INTO purchase_orders (
        id, "orderNumber", "vendorId", "userId", location, "purchaseDate",
        "animalCount", "animalType", "totalWeight", "averageWeight", 
        "carcassYield", "pricePerArroba", "totalValue", commission, 
        "freightCost", "otherCosts", "paymentType", "payerAccountId",
        "principalDueDate", status, "currentStage", "createdAt", "updatedAt"
      )
      VALUES (
        $1, $1, 'partner-test-001', 'user-test-001', 'Local Teste', NOW(),
        100, 'MIXED', 50000, 500, 55.0, 200.0, 100000, 5000, 2000, 1000, 
        'CASH', 'account-test-001', NOW() + INTERVAL '30 days', 'PENDING', 
        'CREATED', NOW(), NOW()
      )
    `, [orderId]);
    
    console.log('5. Criando lote de teste...');
    const lotId = 'lot-test-' + Date.now();
    await client.query(`
      INSERT INTO cattle_lots (
        id, "lotNumber", "purchaseOrderId", "entryDate", "entryWeight", 
        "entryQuantity", "acquisitionCost", "healthCost", "feedCost", 
        "operationalCost", "freightCost", "otherCosts", "totalCost", 
        "deathCount", "currentQuantity", status, "createdAt", "updatedAt"
      )
      VALUES (
        $1, 'LOTE-TESTE-001', $2, NOW(), 50000, 100, 80000, 2000, 5000, 
        3000, 2000, 1000, 93000, 0, 100, 'ACTIVE', NOW(), NOW()
      )
    `, [lotId, orderId]);
    
    // Verificar dados criados
    console.log('\n📊 VERIFICANDO DADOS:');
    const users = await client.query('SELECT COUNT(*) as total FROM users');
    const partners = await client.query('SELECT COUNT(*) as total FROM partners');
    const orders = await client.query('SELECT COUNT(*) as total FROM purchase_orders');
    const lots = await client.query('SELECT COUNT(*) as total FROM cattle_lots');
    
    console.log(`✅ Usuários: ${users.rows[0].total}`);
    console.log(`✅ Parceiros: ${partners.rows[0].total}`);
    console.log(`✅ Ordens: ${orders.rows[0].total}`);
    console.log(`✅ Lotes: ${lots.rows[0].total}`);
    
    await client.end();
    console.log('\n🎉 Banco corrigido e dados de teste criados!');
    
  } catch (err) {
    console.log('❌ Erro:', err.message);
    await client.end();
  }
}

fixDatabase();

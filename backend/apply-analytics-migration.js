const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('📊 Aplicando migration das tabelas de análise...');
    
    // Execute each statement separately
    const statements = [
      // Criar tabela de análise de quebra de peso
      `CREATE TABLE IF NOT EXISTS weight_break_analyses (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        cattle_purchase_id TEXT NOT NULL,
        vendor_id TEXT NOT NULL,
        vendor_state TEXT NOT NULL,
        vendor_region TEXT NOT NULL,
        transport_distance DOUBLE PRECISION,
        transport_company TEXT,
        transport_duration INTEGER,
        season TEXT NOT NULL,
        purchase_date TIMESTAMP NOT NULL,
        reception_date TIMESTAMP NOT NULL,
        purchase_weight DOUBLE PRECISION NOT NULL,
        received_weight DOUBLE PRECISION NOT NULL,
        weight_lost DOUBLE PRECISION NOT NULL,
        break_percentage DOUBLE PRECISION NOT NULL,
        initial_quantity INTEGER NOT NULL,
        average_initial_weight DOUBLE PRECISION NOT NULL,
        average_final_weight DOUBLE PRECISION NOT NULL,
        temperature_at_loading DOUBLE PRECISION,
        temperature_at_arrival DOUBLE PRECISION,
        weather_conditions TEXT,
        road_conditions TEXT,
        adjusted_unit_cost DOUBLE PRECISION NOT NULL,
        financial_impact DOUBLE PRECISION NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (cattle_purchase_id) REFERENCES cattle_purchases(id),
        FOREIGN KEY (vendor_id) REFERENCES partners(id)
      )`,
      
      // Criar tabela de análise de mortalidade
      `CREATE TABLE IF NOT EXISTS mortality_analyses (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        cattle_purchase_id TEXT NOT NULL,
        pen_id TEXT,
        phase TEXT NOT NULL,
        mortality_date TIMESTAMP NOT NULL,
        quantity INTEGER NOT NULL,
        average_weight DOUBLE PRECISION,
        unit_cost DOUBLE PRECISION NOT NULL,
        total_loss DOUBLE PRECISION NOT NULL,
        accumulated_cost DOUBLE PRECISION NOT NULL,
        days_in_confinement INTEGER,
        cause TEXT,
        symptoms TEXT,
        veterinary_diagnosis TEXT,
        treatment_attempted BOOLEAN DEFAULT false,
        treatment_cost DOUBLE PRECISION DEFAULT 0,
        weather_conditions TEXT,
        temperature DOUBLE PRECISION,
        humidity DOUBLE PRECISION,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (cattle_purchase_id) REFERENCES cattle_purchases(id),
        FOREIGN KEY (pen_id) REFERENCES pens(id)
      )`,
      
      // Criar índices
      `CREATE INDEX IF NOT EXISTS idx_weight_break_vendor ON weight_break_analyses(vendor_id)`,
      `CREATE INDEX IF NOT EXISTS idx_weight_break_date ON weight_break_analyses(purchase_date)`,
      `CREATE INDEX IF NOT EXISTS idx_weight_break_region ON weight_break_analyses(vendor_region)`,
      `CREATE INDEX IF NOT EXISTS idx_weight_break_season ON weight_break_analyses(season)`,
      `CREATE INDEX IF NOT EXISTS idx_mortality_cattle ON mortality_analyses(cattle_purchase_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mortality_date ON mortality_analyses(mortality_date)`,
      `CREATE INDEX IF NOT EXISTS idx_mortality_phase ON mortality_analyses(phase)`,
      `CREATE INDEX IF NOT EXISTS idx_mortality_cause ON mortality_analyses(cause)`
    ];
    
    for (const statement of statements) {
      console.log(`Executando: ${statement.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(statement);
    }
    
    console.log('✅ Tabelas de análise criadas com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const weightBreakCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_name = 'weight_break_analyses'
    `;
    
    const mortalityCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_name = 'mortality_analyses'
    `;
    
    console.log('📋 Verificação:');
    console.log('- Tabela weight_break_analyses:', weightBreakCount[0].count > 0 ? '✅' : '❌');
    console.log('- Tabela mortality_analyses:', mortalityCount[0].count > 0 ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
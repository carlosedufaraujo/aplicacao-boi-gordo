-- Criar tabela de análise de quebra de peso
CREATE TABLE IF NOT EXISTS weight_break_analyses (
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
);

-- Criar tabela de análise de mortalidade
CREATE TABLE IF NOT EXISTS mortality_analyses (
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
);

-- Criar índices para performance
CREATE INDEX idx_weight_break_vendor ON weight_break_analyses(vendor_id);
CREATE INDEX idx_weight_break_date ON weight_break_analyses(purchase_date);
CREATE INDEX idx_weight_break_region ON weight_break_analyses(vendor_region);
CREATE INDEX idx_weight_break_season ON weight_break_analyses(season);

CREATE INDEX idx_mortality_cattle ON mortality_analyses(cattle_purchase_id);
CREATE INDEX idx_mortality_date ON mortality_analyses(mortality_date);
CREATE INDEX idx_mortality_phase ON mortality_analyses(phase);
CREATE INDEX idx_mortality_cause ON mortality_analyses(cause);

-- Adicionar triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weight_break_analyses_updated_at 
  BEFORE UPDATE ON weight_break_analyses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mortality_analyses_updated_at 
  BEFORE UPDATE ON mortality_analyses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
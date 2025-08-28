#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://xqfmejiajosmkfdryizy.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZm1lamlham9zbWtmZHJ5aXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMzI1MjQsImV4cCI6MjA1MDkwODUyNH0.I7bZQvJPx0HLfPGl7Wo94s2s0mOE3IDiFMblQHOQFP0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSettingsTables() {
  console.log('🚀 Iniciando criação das tabelas de configurações...\n');

  try {
    // SQL da migração
    const migrationSQL = `
-- Create settings table for user/organization settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, setting_key)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(setting_key);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON settings;
DROP POLICY IF EXISTS "Users can update own settings" ON settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON settings;

-- Create RLS policies
CREATE POLICY "Users can view own settings" ON settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create backup history table
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_type VARCHAR(50) NOT NULL,
  backup_size BIGINT,
  status VARCHAR(20) NOT NULL,
  file_path TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS for backup_history
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own backup history" ON backup_history;
DROP POLICY IF EXISTS "Users can insert own backup history" ON backup_history;

-- Create RLS policies for backup_history
CREATE POLICY "Users can view own backup history" ON backup_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backup history" ON backup_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
    `;

    // Executar a migração via API Admin do Supabase
    // Nota: Para executar SQL diretamente, você precisa usar o Supabase Dashboard
    // ou a CLI do Supabase. Aqui vamos verificar se as tabelas existem

    console.log('📋 Verificando se a tabela settings existe...');
    const { data: settingsTable, error: settingsError } = await supabase
      .from('settings')
      .select('id')
      .limit(1);

    if (settingsError && settingsError.code === '42P01') {
      console.log('❌ Tabela settings não existe.');
      console.log('\n⚠️  Por favor, execute o seguinte SQL no Supabase Dashboard:\n');
      console.log('----------------------------------------');
      console.log(migrationSQL);
      console.log('----------------------------------------\n');
      console.log('📌 Acesse: https://supabase.com/dashboard/project/xqfmejiajosmkfdryizy/sql/new');
      console.log('📌 Cole o SQL acima e execute\n');
      return;
    }

    console.log('✅ Tabela settings já existe!');

    console.log('\n📋 Verificando se a tabela backup_history existe...');
    const { data: backupTable, error: backupError } = await supabase
      .from('backup_history')
      .select('id')
      .limit(1);

    if (backupError && backupError.code === '42P01') {
      console.log('❌ Tabela backup_history não existe.');
      console.log('\n⚠️  Execute o SQL fornecido acima no Supabase Dashboard.\n');
      return;
    }

    console.log('✅ Tabela backup_history já existe!');
    
    console.log('\n🎉 Sistema de configurações está pronto para uso!');
    
    // Verificar se existem configurações para o usuário atual
    console.log('\n📊 Estatísticas das tabelas:');
    
    const { count: settingsCount } = await supabase
      .from('settings')
      .select('*', { count: 'exact', head: true });
    
    const { count: backupCount } = await supabase
      .from('backup_history')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   - Total de configurações: ${settingsCount || 0}`);
    console.log(`   - Total de backups: ${backupCount || 0}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar
createSettingsTables();
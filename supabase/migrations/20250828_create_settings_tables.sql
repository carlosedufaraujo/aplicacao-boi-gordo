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
CREATE INDEX idx_settings_user_id ON settings(user_id);
CREATE INDEX idx_settings_category ON settings(category);
CREATE INDEX idx_settings_key ON settings(setting_key);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings for new users (function)
CREATE OR REPLACE FUNCTION create_default_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Regional settings
  INSERT INTO settings (user_id, setting_key, setting_value, category)
  VALUES 
    (NEW.id, 'language', '"pt-BR"'::jsonb, 'regional'),
    (NEW.id, 'timezone', '"America/Sao_Paulo"'::jsonb, 'regional'),
    (NEW.id, 'dateFormat', '"DD/MM/YYYY"'::jsonb, 'regional'),
    (NEW.id, 'currency', '"BRL"'::jsonb, 'regional'),
    
    -- Business settings
    (NEW.id, 'weightUnit', '"kg"'::jsonb, 'business'),
    (NEW.id, 'priceUnit', '"arroba"'::jsonb, 'business'),
    (NEW.id, 'taxRate', '15'::jsonb, 'business'),
    (NEW.id, 'defaultPaymentTerm', '30'::jsonb, 'business'),
    
    -- System settings
    (NEW.id, 'autoBackup', 'true'::jsonb, 'system'),
    (NEW.id, 'backupFrequency', '"daily"'::jsonb, 'system'),
    (NEW.id, 'dataRetention', '90'::jsonb, 'system'),
    (NEW.id, 'sessionTimeout', '30'::jsonb, 'system'),
    (NEW.id, 'theme', '"light"'::jsonb, 'system'),
    
    -- Security settings
    (NEW.id, 'twoFactorAuth', 'false'::jsonb, 'security'),
    (NEW.id, 'passwordExpiration', '90'::jsonb, 'security'),
    (NEW.id, 'minPasswordLength', '8'::jsonb, 'security'),
    (NEW.id, 'requireStrongPassword', 'true'::jsonb, 'security'),
    
    -- Notification settings
    (NEW.id, 'emailNotifications', 'true'::jsonb, 'notifications'),
    (NEW.id, 'smsNotifications', 'false'::jsonb, 'notifications'),
    (NEW.id, 'pushNotifications', 'true'::jsonb, 'notifications'),
    (NEW.id, 'notificationSound', 'true'::jsonb, 'notifications'),
    (NEW.id, 'newOrderAlert', 'true'::jsonb, 'notifications'),
    (NEW.id, 'paymentReminder', 'true'::jsonb, 'notifications'),
    (NEW.id, 'systemUpdates', 'true'::jsonb, 'notifications'),
    (NEW.id, 'marketingEmails', 'false'::jsonb, 'notifications');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
CREATE TRIGGER create_user_default_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_settings();

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

-- Create RLS policies for backup_history
CREATE POLICY "Users can view own backup history" ON backup_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backup history" ON backup_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
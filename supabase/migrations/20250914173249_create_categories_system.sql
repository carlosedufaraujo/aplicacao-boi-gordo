-- Criar tabela de categorias compartilhadas entre todos os usuários
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- Código único da categoria (ex: 'animal_purchase', 'feed')
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  cost_center VARCHAR(50), -- acquisition, fattening, administrative, financial, sales, revenue
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50),
  impacts_cash_flow BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Categorias padrão do sistema
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_cost_center ON categories(cost_center);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE
  ON categories FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Inserir categorias padrão do sistema
INSERT INTO categories (code, name, type, cost_center, color, icon, impacts_cash_flow, is_default, display_order) VALUES
-- DESPESAS - Aquisição
('animal_purchase', 'Compra de Animais', 'EXPENSE', 'acquisition', '#EF4444', 'ShoppingCart', true, true, 1),
('commission', 'Comissão', 'EXPENSE', 'acquisition', '#F59E0B', 'Users', true, true, 2),
('freight', 'Frete', 'EXPENSE', 'acquisition', '#10B981', 'Truck', true, true, 3),
('acquisition_other', 'Documentação, Taxas, Etc.', 'EXPENSE', 'acquisition', '#6B7280', 'FileText', true, true, 4),

-- DESPESAS - Engorda
('feed', 'Alimentação', 'EXPENSE', 'fattening', '#84CC16', 'Package', true, true, 5),
('health_costs', 'Sanidade', 'EXPENSE', 'fattening', '#06B6D4', 'Heart', true, true, 6),
('operational_costs', 'Custos Operacionais', 'EXPENSE', 'fattening', '#8B5CF6', 'Settings', true, true, 7),
('deaths', 'Mortalidade', 'EXPENSE', 'fattening', '#DC2626', 'AlertTriangle', false, true, 8),
('weight_loss', 'Quebra de Peso', 'EXPENSE', 'fattening', '#F97316', 'TrendingDown', false, true, 9),
('fattening_other', 'Outros Engorda', 'EXPENSE', 'fattening', '#6B7280', 'MoreHorizontal', true, true, 10),

-- DESPESAS - Administrativo
('general_admin', 'Administração Geral', 'EXPENSE', 'administrative', '#3B82F6', 'Briefcase', true, true, 11),
('personnel', 'Pessoal', 'EXPENSE', 'administrative', '#EC4899', 'Users', true, true, 12),
('office', 'Escritório', 'EXPENSE', 'administrative', '#14B8A6', 'Building', true, true, 13),
('marketing', 'Marketing', 'EXPENSE', 'administrative', '#F59E0B', 'Megaphone', true, true, 14),
('accounting', 'Contabilidade', 'EXPENSE', 'administrative', '#6366F1', 'Calculator', true, true, 15),
('services', 'Serviços', 'EXPENSE', 'administrative', '#10B981', 'Tool', true, true, 16),
('technology', 'Tecnologia', 'EXPENSE', 'administrative', '#8B5CF6', 'Monitor', true, true, 17),
('depreciation', 'Depreciação', 'EXPENSE', 'administrative', '#6B7280', 'TrendingDown', false, true, 18),
('admin_other', 'Outros Admin', 'EXPENSE', 'administrative', '#6B7280', 'MoreHorizontal', true, true, 19),

-- DESPESAS - Financeiro
('taxes', 'Impostos', 'EXPENSE', 'financial', '#DC2626', 'Receipt', true, true, 20),
('interest', 'Juros', 'EXPENSE', 'financial', '#F59E0B', 'Percent', true, true, 21),
('fees', 'Taxas', 'EXPENSE', 'financial', '#6B7280', 'CreditCard', true, true, 22),
('insurance', 'Seguro', 'EXPENSE', 'financial', '#3B82F6', 'Shield', true, true, 23),
('capital_cost', 'Custo de Capital', 'EXPENSE', 'financial', '#8B5CF6', 'DollarSign', false, true, 24),
('financial_management', 'Gestão Financeira', 'EXPENSE', 'financial', '#14B8A6', 'BarChart', true, true, 25),
('default', 'Inadimplência', 'EXPENSE', 'financial', '#DC2626', 'XCircle', false, true, 26),
('financial_other', 'Outros Financeiro', 'EXPENSE', 'financial', '#6B7280', 'MoreHorizontal', true, true, 27),

-- DESPESAS - Vendas
('sales_commission', 'Comissão de Venda', 'EXPENSE', 'sales', '#F59E0B', 'Users', true, true, 28),
('sales_freight', 'Frete de Venda', 'EXPENSE', 'sales', '#10B981', 'Truck', true, true, 29),
('sales_tax', 'Impostos sobre Venda', 'EXPENSE', 'sales', '#DC2626', 'Receipt', true, true, 30),
('sales_other', 'Outros Venda', 'EXPENSE', 'sales', '#6B7280', 'MoreHorizontal', true, true, 31),

-- RECEITAS
('cattle_sale', 'Venda de Gado', 'INCOME', 'revenue', '#10B981', 'DollarSign', true, true, 32),
('subsidy', 'Subsídio', 'INCOME', 'revenue', '#3B82F6', 'Gift', true, true, 33),
('financing', 'Financiamento', 'INCOME', 'revenue', '#8B5CF6', 'CreditCard', true, true, 34),
('partnership', 'Parceria', 'INCOME', 'revenue', '#F59E0B', 'Users', true, true, 35),
('investment', 'Investimento', 'INCOME', 'contributions', '#14B8A6', 'TrendingUp', true, true, 36),
('loan', 'Empréstimo', 'INCOME', 'contributions', '#6366F1', 'Banknote', true, true, 37),
('capital_contribution', 'Aporte de Capital', 'INCOME', 'contributions', '#10B981', 'PlusCircle', true, true, 38),
('other_income', 'Outras Receitas', 'INCOME', 'revenue', '#6B7280', 'MoreHorizontal', true, true, 39);

-- Criar tabela de auditoria para rastrear mudanças
CREATE TABLE IF NOT EXISTS categories_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID, -- ID do usuário que fez a mudança
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para registrar mudanças na auditoria
CREATE OR REPLACE FUNCTION audit_category_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO categories_audit(category_id, action, new_data)
    VALUES (NEW.id, 'CREATE', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO categories_audit(category_id, action, old_data, new_data)
    VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO categories_audit(category_id, action, old_data)
    VALUES (OLD.id, 'DELETE', to_jsonb(OLD));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoria
CREATE TRIGGER audit_categories
AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION audit_category_changes();

-- Habilitar RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Categorias são visíveis para todos os usuários autenticados"
ON categories FOR SELECT
TO authenticated
USING (true);

-- Política para permitir inserção/atualização/deleção apenas para admins
CREATE POLICY "Apenas admins podem modificar categorias"
ON categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'ADMIN'
  )
);

-- Função para verificar se uma categoria está em uso
CREATE OR REPLACE FUNCTION category_in_use(category_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  is_used BOOLEAN;
BEGIN
  -- Verificar se existe alguma transação usando esta categoria
  SELECT EXISTS (
    SELECT 1 FROM expenses WHERE category = category_code
    UNION ALL
    SELECT 1 FROM incomes WHERE category = category_code
  ) INTO is_used;

  RETURN is_used;
END;
$$ LANGUAGE plpgsql;

-- Adicionar constraint para prevenir exclusão de categorias em uso
CREATE OR REPLACE FUNCTION prevent_category_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF category_in_use(OLD.code) THEN
    RAISE EXCEPTION 'Categoria % está em uso e não pode ser excluída', OLD.name;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_category_deletion_trigger
BEFORE DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION prevent_category_deletion();
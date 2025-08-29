#!/bin/bash

echo "🔧 Corrigindo imports do Supabase..."

# Remove imports do @/config/supabase
find src -name "*.ts" -type f -exec sed -i '' "s/import.*from '@\/config\/supabase';//g" {} \;

# Remove imports do supabase client
find src -name "*.ts" -type f -exec sed -i '' "s/import { supabase.* } from.*;//g" {} \;

# Adiciona import do Prisma onde necessário
find src -name "*.ts" -type f -exec sed -i '' "s/supabase\./prisma\./g" {} \;

echo "✅ Imports corrigidos!"
#!/usr/bin/env tsx
/**
 * Script para criar usuários no Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8';

// Cliente admin do Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface UserToCreate {
  email: string;
  password: string;
  name: string;
  role: string;
}

const users: UserToCreate[] = [
  { email: 'admin@boigordo.com', password: 'admin123', name: 'Administrador', role: 'ADMIN' },
  { email: 'gerente@boigordo.com', password: 'gerente123', name: 'Gerente', role: 'MANAGER' },
  { email: 'usuario@boigordo.com', password: 'usuario123', name: 'Usuário', role: 'USER' },
  { email: 'visualizador@boigordo.com', password: 'visualizador123', name: 'Visualizador', role: 'VIEWER' }
];

async function createSupabaseUsers() {
  console.log('🚀 Criando usuários no Supabase Auth...\n');

  for (const userData of users) {
    try {
      // Tenta criar o usuário no Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role
        }
      });

      if (authError) {
        if (authError.message?.includes('already been registered')) {
          console.log(`⚠️  Usuário já existe: ${userData.email}`);
          
          // Atualiza a senha se o usuário já existe
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            authUser?.id || '',
            { password: userData.password }
          );
          
          if (updateError) {
            console.error(`❌ Erro ao atualizar senha de ${userData.email}:`, updateError.message);
          } else {
            console.log(`✅ Senha atualizada para: ${userData.email}`);
          }
        } else {
          console.error(`❌ Erro ao criar ${userData.email}:`, authError.message);
        }
      } else {
        console.log(`✅ Usuário criado: ${userData.email} (${userData.role})`);
        
        // Também cria/atualiza na tabela users para sincronização
        const { error: dbError } = await supabase
          .from('users')
          .upsert({
            id: authUser.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            isActive: true
          }, {
            onConflict: 'email'
          });

        if (dbError) {
          console.error(`⚠️  Erro ao sincronizar no banco:`, dbError.message);
        }
      }
    } catch (error: any) {
      console.error(`❌ Erro ao processar ${userData.email}:`, error.message);
    }
  }

  console.log('\n✅ Processo concluído!');
  console.log('\n📝 Credenciais de acesso:');
  users.forEach(user => {
    console.log(`   ${user.email} / ${user.password} (${user.role})`);
  });
}

// Executa o script
createSupabaseUsers().catch(console.error);
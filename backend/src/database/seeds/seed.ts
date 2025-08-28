import { PrismaClient } from '@prisma/client';
import { supabase } from '@/config/supabase';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // 1. CRIAR USUÁRIO MASTER ADMIN
    console.log('👑 Criando usuário master admin...');
    
    const masterUserData = {
      email: 'carlosedufaraujo@outlook.com',
      password: '368308450',
      name: 'Carlos Eduardo (Master Admin)',
      role: 'ADMIN' as const,
      isActive: true,
      isMaster: true
    };

    // Criar no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: masterUserData.email,
      password: masterUserData.password,
      email_confirm: true,
      user_metadata: {
        name: masterUserData.name,
        role: masterUserData.role,
        isMaster: true
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Supabase Auth:', authError);
      throw authError;
    }

    if (!authUser.user) {
      throw new Error('Usuário não foi criado no Supabase Auth');
    }

    console.log('✅ Usuário criado no Supabase Auth:', authUser.user.id);

    // Criar na tabela local
    const masterUser = await prisma.user.upsert({
      where: { email: masterUserData.email },
      update: {
        name: masterUserData.name,
        role: masterUserData.role,
        isActive: masterUserData.isActive,
        isMaster: masterUserData.isMaster
      },
      create: {
        id: authUser.user.id,
        email: masterUserData.email,
        password: null, // Senha gerenciada pelo Supabase
        name: masterUserData.name,
        role: masterUserData.role,
        isActive: masterUserData.isActive,
        isMaster: masterUserData.isMaster
      }
    });

    console.log('✅ Usuário master criado na tabela local:', masterUser.id);

    // 2. CRIAR USUÁRIOS DE TESTE
    console.log('👥 Criando usuários de teste...');

    const testUsers = [
      {
        email: 'admin@ceac.com.br',
        password: 'admin123',
        name: 'Administrador CEAC',
        role: 'ADMIN' as const,
        isActive: true,
        isMaster: false
      },
      {
        email: 'gerente@ceac.com.br',
        password: 'gerente123',
        name: 'Gerente de Produção',
        role: 'USER' as const,
        isActive: true,
        isMaster: false
      },
      {
        email: 'operador@ceac.com.br',
        password: 'operador123',
        name: 'Operador de Campo',
        role: 'USER' as const,
        isActive: true,
        isMaster: false
      }
    ];

    for (const userData of testUsers) {
      try {
        // Criar no Supabase Auth
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
          console.warn(`⚠️ Erro ao criar usuário ${userData.email} no Supabase:`, authError.message);
          continue;
        }

        if (authUser.user) {
          // Criar na tabela local
          await prisma.user.upsert({
            where: { email: userData.email },
            update: {
              name: userData.name,
              role: userData.role,
              isActive: userData.isActive
            },
            create: {
              id: authUser.user.id,
              email: userData.email,
              password: null,
              name: userData.name,
              role: userData.role,
              isActive: userData.isActive,
              isMaster: false
            }
          });

          console.log(`✅ Usuário ${userData.email} criado com sucesso`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao criar usuário ${userData.email}:`, error);
      }
    }

    // 3. CRIAR DADOS DE EXEMPLO PARA OUTRAS TABELAS
    console.log('🏗️ Criando dados de exemplo...');

    // Criar parceiros
    const partners = await Promise.all([
      prisma.partner.upsert({
        where: { cpfCnpj: '12.345.678/0001-90' },
        update: {},
        create: {
          name: 'Fazenda Modelo Ltda',
          type: 'VENDOR',
          cpfCnpj: '12.345.678/0001-90',
          phone: '(11) 99999-9999',
          email: 'contato@fazendamodelo.com.br',
          address: 'Rodovia BR-050, Km 150, Zona Rural',
          notes: 'Fornecedor principal de gado'
        }
      }),
      prisma.partner.upsert({
        where: { cpfCnpj: '98.765.432/0001-10' },
        update: {},
        create: {
          name: 'Corretor Silva',
          type: 'BROKER',
          cpfCnpj: '98.765.432/0001-10',
          phone: '(11) 88888-8888',
          email: 'silva@corretor.com.br',
          notes: 'Corretor de gado experiente'
        }
      })
    ]);

    console.log(`✅ ${partners.length} parceiros criados`);

    // Criar contas pagadoras
    const payerAccounts = await Promise.all([
      prisma.payerAccount.upsert({
        where: { accountNumber: '001-1' },
        update: {},
        create: {
          bankName: 'Banco do Brasil',
          accountName: 'CEAC Agropecuária Ltda',
          agency: '1234',
          accountNumber: '001-1',
          accountType: 'CHECKING' as const,
          balance: 50000.00
        }
      }),
      prisma.payerAccount.upsert({
        where: { accountNumber: '002-2' },
        update: {},
        create: {
          bankName: 'Itaú',
          accountName: 'CEAC Agropecuária Ltda',
          agency: '5678',
          accountNumber: '002-2',
          accountType: 'CHECKING' as const,
          balance: 75000.00
        }
      })
    ]);

    console.log(`✅ ${payerAccounts.length} contas pagadoras criadas`);

    // Criar ciclos
    const cycles = await Promise.all([
      prisma.cycles.upsert({
        where: { id: 'cycle-2024-01' },
        update: {},
        create: {
          id: 'cycle-2024-01',
          name: 'Ciclo Janeiro 2024',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-30'),
          status: 'ACTIVE' as const,
          notes: 'Ciclo de engorda para mercado interno'
        }
      }),
      prisma.cycles.upsert({
        where: { id: 'cycle-2024-02' },
        update: {},
        create: {
          id: 'cycle-2024-02',
          name: 'Ciclo Julho 2024',
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-12-31'),
          status: 'PLANNED' as const,
          targetWeight: 520.0,
          notes: 'Ciclo de engorda para exportação'
        }
      })
    ]);

    console.log(`✅ ${cycles.length} ciclos criados`);

    console.log('🎉 Seed concluído com sucesso!');
    console.log('');
    console.log('📋 RESUMO:');
    console.log(`👑 Usuário Master: ${masterUser.email}`);
    console.log(`👥 Usuários de Teste: ${testUsers.length}`);
    console.log(`🤝 Parceiros: ${partners.length}`);
    console.log(`🏦 Contas Pagadoras: ${payerAccounts.length}`);
    console.log(`📅 Ciclos: ${cycles.length}`);
    console.log('');
    console.log('🔑 CREDENCIAIS DE ACESSO:');
    console.log(`Master: ${masterUserData.email} / ${masterUserData.password}`);
    console.log(`Admin: admin@ceac.com.br / admin123`);
    console.log(`Gerente: gerente@ceac.com.br / gerente123`);
    console.log(`Operador: operador@ceac.com.br / operador123`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal no seed:', e);
    process.exit(1);
  }); 
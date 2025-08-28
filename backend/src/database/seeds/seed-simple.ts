import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed simplificado do banco de dados...');

  try {
    // 1. CRIAR USUÁRIO MASTER ADMIN
    console.log('👑 Criando usuário master admin...');
    
    const masterPassword = await bcrypt.hash('368308450', 10);
    
    const masterUser = await prisma.user.upsert({
      where: { email: 'carlosedufaraujo@outlook.com' },
      update: {
        name: 'Carlos Eduardo (Master Admin)',
        role: 'ADMIN',
        isActive: true,
        isMaster: true
      },
      create: {
        email: 'carlosedufaraujo@outlook.com',
        password: masterPassword,
        name: 'Carlos Eduardo (Master Admin)',
        role: 'ADMIN',
        isActive: true,
        isMaster: true
      }
    });

    console.log('✅ Usuário master criado:', masterUser.email);

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
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        await prisma.user.upsert({
          where: { email: userData.email },
          update: {
            name: userData.name,
            role: userData.role,
            isActive: userData.isActive
          },
          create: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
            isActive: userData.isActive,
            isMaster: false
          }
        });

        console.log(`✅ Usuário ${userData.email} criado com sucesso`);
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
        where: { id: 'account-001' },
        update: {},
        create: {
          id: 'account-001',
          bankName: 'Banco do Brasil',
          accountName: 'CEAC Agropecuária Ltda',
          agency: '1234',
          accountNumber: '001-1',
          accountType: 'CHECKING',
          balance: 50000.00
        }
      }),
      prisma.payerAccount.upsert({
        where: { id: 'account-002' },
        update: {},
        create: {
          id: 'account-002',
          bankName: 'Itaú',
          accountName: 'CEAC Agropecuária Ltda',
          agency: '5678',
          accountNumber: '002-2',
          accountType: 'CHECKING',
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
          description: 'Ciclo de engorda para mercado interno',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-30'),
          status: 'ACTIVE',
          budget: 100000.0,
          targetAnimals: 100,
          userId: masterUser.id
        }
      }),
      prisma.cycles.upsert({
        where: { id: 'cycle-2024-02' },
        update: {},
        create: {
          id: 'cycle-2024-02',
          name: 'Ciclo Julho 2024',
          description: 'Ciclo de engorda para exportação',
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-12-31'),
          status: 'PLANNED',
          budget: 120000.0,
          targetAnimals: 120,
          userId: masterUser.id
        }
      })
    ]);

    console.log(`✅ ${cycles.length} ciclos criados`);

    console.log('🎉 Seed simplificado concluído com sucesso!');
    console.log('');
    console.log('📋 RESUMO:');
    console.log(`👑 Usuário Master: ${masterUser.email}`);
    console.log(`👥 Usuários de Teste: ${testUsers.length}`);
    console.log(`🤝 Parceiros: ${partners.length}`);
    console.log(`🏦 Contas Pagadoras: ${payerAccounts.length}`);
    console.log(`📅 Ciclos: ${cycles.length}`);
    console.log('');
    console.log('🔑 CREDENCIAIS DE ACESSO:');
    console.log(`Master: carlosedufaraujo@outlook.com / 368308450`);
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

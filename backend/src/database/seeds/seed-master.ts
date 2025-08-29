import { PrismaClient, UserRole } from '@prisma/client';


const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do usuário master...');

  try {
    // 1. Criar usuário master no Supabase Auth
    console.log('📝 Criando usuário master no Supabase Auth...');
    
    const { data: authUser, error: authError } = await prisma.auth.admin.createUser({
      email: 'carlosedufaraujo@outlook.com',
      password: '368308450',
      email_confirm: true,
      user_metadata: {
        name: 'Carlos Eduardo (Master Admin)',
        role: 'ADMIN',
        isMaster: true
      }
    });

    if (authError) {
      throw new Error(`Erro ao criar usuário no Supabase Auth: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error('Usuário não foi criado no Supabase Auth');
    }

    console.log('✅ Usuário master criado no Supabase Auth:', authUser.user.id);

    // 2. Criar usuário master na tabela local
    console.log('📝 Criando usuário master na tabela local...');
    
    const masterUser = await prisma.user.upsert({
      where: { email: 'carlosedufaraujo@outlook.com' },
      update: {
        name: 'Carlos Eduardo (Master Admin)',
        role: UserRole.ADMIN,
        isActive: true,
        isMaster: true
      },
      create: {
        id: authUser.user.id, // Usar mesmo ID do Supabase
        email: 'carlosedufaraujo@outlook.com',
        name: 'Carlos Eduardo (Master Admin)',
        role: UserRole.ADMIN,
        isActive: true,
        isMaster: true
      },
    });

    console.log('✅ Usuário master criado na tabela local:', masterUser.id);

    // 3. Criar alguns usuários de teste
    console.log('📝 Criando usuários de teste...');

    const testUsers = [
      {
        email: 'admin@teste.com',
        name: 'Admin Teste',
        role: UserRole.ADMIN,
        password: '123456'
      },
      {
        email: 'manager@teste.com',
        name: 'Manager Teste',
        role: UserRole.MANAGER,
        password: '123456'
      },
      {
        email: 'user@teste.com',
        name: 'Usuário Teste',
        role: UserRole.USER,
        password: '123456'
      }
    ];

    for (const testUser of testUsers) {
      // Criar no Supabase Auth
      const { data: testAuthUser, error: testAuthError } = await prisma.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          name: testUser.name,
          role: testUser.role
        }
      });

      if (testAuthError) {
        console.warn(`⚠️ Erro ao criar usuário de teste ${testUser.email}: ${testAuthError.message}`);
        continue;
      }

      if (testAuthUser.user) {
        // Criar na tabela local
        await prisma.user.upsert({
          where: { email: testUser.email },
          update: {
            name: testUser.name,
            role: testUser.role,
            isActive: true
          },
          create: {
            id: testAuthUser.user.id,
            email: testUser.email,
            name: testUser.name,
            role: testUser.role,
            isActive: true,
            isMaster: false
          },
        });

        console.log(`✅ Usuário de teste criado: ${testUser.email}`);
      }
    }

    console.log('🎉 Seed do usuário master concluído com sucesso!');
    console.log('👑 Usuário Master:', {
      email: 'carlosedufaraujo@outlook.com',
      senha: '368308450',
      role: 'ADMIN',
      isMaster: true
    });

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  });

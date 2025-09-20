import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // USUÁRIO MASTER - PRIORIDADE MÁXIMA
  const masterUser = {
    email: 'carlosedufaraujo@outlook.com',
    password: '368308450',
    name: 'Carlos Eduardo (Master Admin)',
    role: 'ADMIN' as const,
  };

  // Criar usuário master primeiro
  console.log('👑 Criando usuário MASTER...');
  const existingMaster = await prisma.user.findUnique({
    where: { email: masterUser.email },
  });

  if (!existingMaster) {
    const hashedMasterPassword = await bcrypt.hash(masterUser.password, 10);
    
    const master = await prisma.user.create({
      data: {
        email: masterUser.email,
        password: hashedMasterPassword,
        name: masterUser.name,
        role: masterUser.role,
        isActive: true,
      },
    });

    console.log(`✅ MASTER criado: ${master.email} (${master.role}) - ACESSO TOTAL`);
  } else {
    // Atualizar senha do master se ele já existir
    const hashedMasterPassword = await bcrypt.hash(masterUser.password, 10);
    await prisma.user.update({
      where: { email: masterUser.email },
      data: {
        password: hashedMasterPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`⚠️  MASTER atualizado: ${masterUser.email}`);
  }

  // Criar usuários padrão
  const users = [
    {
      email: 'admin@boigordo.com',
      password: 'admin123',
      name: 'Administrador',
      role: 'ADMIN' as const,
    },
    {
      email: 'gerente@boigordo.com',
      password: 'gerente123',
      name: 'Gerente Operacional',
      role: 'MANAGER' as const,
    },
    {
      email: 'usuario@boigordo.com',
      password: 'usuario123',
      name: 'Usuário Padrão',
      role: 'USER' as const,
    },
    {
      email: 'visualizador@boigordo.com',
      password: 'visualizador123',
      name: 'Visualizador',
      role: 'VIEWER' as const,
    },
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          isActive: true,
        },
      });

      console.log(`✅ Usuário criado: ${user.email} (${user.role})`);
    } else {
      console.log(`⚠️  Usuário já existe: ${userData.email}`);
    }
  }

  // Criar alguns dados iniciais se necessário
  const partnersCount = await prisma.partner.count();
  
  if (partnersCount === 0) {
    console.log('\n🏢 Criando parceiros iniciais...');
    
    const partners = [
      {
        name: 'Fazenda São João',
        type: 'VENDOR' as const,
        cpfCnpj: '12.345.678/0001-90',
        phone: '(11) 98765-4321',
        email: 'contato@fazendaSaojoao.com',
        address: 'Rodovia SP-123, km 45',
        isActive: true,
      },
      {
        name: 'JBS - Frigorífico',
        type: 'BUYER' as const,
        cpfCnpj: '02.916.265/0001-60',
        phone: '(11) 3144-4000',
        email: 'compras@jbs.com.br',
        address: 'Av. Marginal Direita do Tietê, 500',
        isActive: true,
      },
      {
        name: 'Corretor José Silva',
        type: 'BROKER' as const,
        cpfCnpj: '123.456.789-00',
        phone: '(11) 91234-5678',
        email: 'jose@corretorsilva.com',
        address: 'Rua dos Pecuaristas, 123',
        isActive: true,
      },
    ];

    for (const partnerData of partners) {
      const partner = await prisma.partner.create({
        data: partnerData,
      });
      console.log(`✅ Parceiro criado: ${partner.name} (${partner.type})`);
    }
  }

  // Contas financeiras removidas temporariamente - modelo precisa ser ajustado

  // Criar currais
  const pensCount = await prisma.pen.count();
  
  if (pensCount === 0) {
    console.log('\n🏠 Criando currais...');
    
    for (let i = 1; i <= 10; i++) {
      const pen = await prisma.pen.create({
        data: {
          penNumber: `C${i.toString().padStart(3, '0')}`,
          capacity: 100,
          location: `Setor ${Math.ceil(i / 5)}`,
          type: 'FATTENING',
          status: 'AVAILABLE',
          isActive: true,
        },
      });
      console.log(`✅ Curral criado: ${pen.penNumber}`);
    }
  }

  console.log('\n✨ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// Script para criar usuários de teste
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🌱 Criando usuários de teste...\n');

  try {
    // Criar usuários (verifica se já existem)
    const users = [
      {
        email: 'admin@ceac.com.br',
        password: await bcrypt.hash('admin123', 10),
        name: 'Administrador',
        role: 'ADMIN'
      },
      {
        email: 'gerente@ceac.com.br',
        password: await bcrypt.hash('gerente123', 10),
        name: 'Gerente Operacional',
        role: 'MANAGER'
      },
      {
        email: 'usuario@ceac.com.br',
        password: await bcrypt.hash('usuario123', 10),
        name: 'Usuário Padrão',
        role: 'USER'
      },
      {
        email: 'visualizador@ceac.com.br',
        password: await bcrypt.hash('viewer123', 10),
        name: 'Visualizador',
        role: 'VIEWER'
      },
      {
        email: 'carlos@ceac.com.br',
        password: await bcrypt.hash('carlos123', 10),
        name: 'Carlos Eduardo',
        role: 'ADMIN'
      }
    ];

    for (const userData of users) {
      // Verificar se o usuário já existe
      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existing) {
        console.log(`⚠️  Usuário já existe: ${userData.email}`);
      } else {
        const user = await prisma.user.create({
          data: userData
        });
        console.log(`✅ Usuário criado: ${user.name} (${user.email}) - Role: ${user.role}`);
      }
    }

    console.log('\n🎉 Todos os usuários foram criados com sucesso!');
    
    console.log('\n📋 CREDENCIAIS DE ACESSO:');
    console.log('=' .repeat(50));
    console.log('ADMIN: admin@ceac.com.br / admin123');
    console.log('ADMIN: carlos@ceac.com.br / carlos123');
    console.log('GERENTE: gerente@ceac.com.br / gerente123');
    console.log('USUÁRIO: usuario@ceac.com.br / usuario123');
    console.log('VISUALIZADOR: visualizador@ceac.com.br / viewer123');
    console.log('=' .repeat(50));

    // Adicionar alguns dados de exemplo
    console.log('\n🌱 Criando dados de exemplo...\n');

    // Criar um ciclo ativo
    const cycle = await prisma.cycle.create({
      data: {
        name: 'Ciclo 2024/Q1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        status: 'ACTIVE',
        budget: 5000000,
        targetAnimals: 1000,
        description: 'Primeiro trimestre de 2024'
      }
    });
    console.log('✅ Ciclo criado:', cycle.name);

    // Criar alguns parceiros
    const vendors = [
      {
        name: 'Fazenda São João',
        type: 'VENDOR',
        document: '12.345.678/0001-90',
        email: 'contato@fazendajoao.com.br',
        phone: '(16) 99999-9999',
        address: 'Rodovia SP-330, Km 298',
        city: 'Ribeirão Preto',
        state: 'SP',
        isActive: true
      },
      {
        name: 'Fazenda Boa Vista',
        type: 'VENDOR',
        document: '23.456.789/0001-01',
        email: 'vendas@boavista.com.br',
        phone: '(17) 88888-8888',
        address: 'Estrada Municipal BRT-050, Km 15',
        city: 'Barretos',
        state: 'SP',
        isActive: true
      }
    ];

    for (const vendorData of vendors) {
      const vendor = await prisma.partner.create({
        data: vendorData
      });
      console.log('✅ Vendedor criado:', vendor.name);
    }

    // Criar corretores
    const broker = await prisma.partner.create({
      data: {
        name: 'José Silva Corretor',
        type: 'BROKER',
        document: '123.456.789-00',
        email: 'jose@corretor.com',
        phone: '(17) 98888-8888',
        address: 'Rua dos Pecuaristas, 100',
        city: 'Barretos',
        state: 'SP',
        isActive: true
      }
    });
    console.log('✅ Corretor criado:', broker.name);

    // Criar frigorífico
    const slaughterhouse = await prisma.partner.create({
      data: {
        name: 'Frigorífico Central',
        type: 'SLAUGHTERHOUSE',
        document: '98.765.432/0001-10',
        email: 'vendas@frigorificocentral.com.br',
        phone: '(11) 3333-3333',
        address: 'Av. Industrial, 5000',
        city: 'São Paulo',
        state: 'SP',
        isActive: true
      }
    });
    console.log('✅ Frigorífico criado:', slaughterhouse.name);

    console.log('\n✨ Seed concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
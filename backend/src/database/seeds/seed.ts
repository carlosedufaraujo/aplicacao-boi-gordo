import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ceac.com.br' },
    update: {},
    create: {
      email: 'admin@ceac.com.br',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Usuário admin criado:', admin.email);

  // Criar contas pagadoras de exemplo
  const accounts = await Promise.all([
    prisma.payerAccount.upsert({
      where: { id: 'default-cash' },
      update: {},
      create: {
        id: 'default-cash',
        bankName: 'Caixa',
        accountName: 'Caixa Fazenda',
        accountType: 'CASH',
        balance: 50000,
        isActive: true,
      },
    }),
    prisma.payerAccount.upsert({
      where: { id: 'default-bank' },
      update: {},
      create: {
        id: 'default-bank',
        bankName: 'Banco do Brasil',
        accountName: 'Conta Corrente Principal',
        agency: '1234',
        accountNumber: '12345-6',
        accountType: 'CHECKING',
        balance: 150000,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Contas pagadoras criadas:', accounts.length);

  // Criar currais de exemplo
  const pens = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.pen.upsert({
        where: { penNumber: `${i + 1}` },
        update: {},
        create: {
          penNumber: `${i + 1}`,
          capacity: 100,
          location: `Setor ${Math.ceil((i + 1) / 5)}`,
          type: 'FATTENING',
          status: 'AVAILABLE',
          isActive: true,
        },
      })
    )
  );

  console.log('✅ Currais criados:', pens.length);

  // Criar centros de custo
  const costCenters = await Promise.all([
    prisma.costCenter.upsert({
      where: { code: 'AQUISICAO' },
      update: {},
      create: {
        code: 'AQUISICAO',
        name: 'Aquisição',
        type: 'ACQUISITION',
        isActive: true,
      },
    }),
    prisma.costCenter.upsert({
      where: { code: 'ENGORDA' },
      update: {},
      create: {
        code: 'ENGORDA',
        name: 'Engorda',
        type: 'FATTENING',
        isActive: true,
      },
    }),
    prisma.costCenter.upsert({
      where: { code: 'ADMINISTRATIVO' },
      update: {},
      create: {
        code: 'ADMINISTRATIVO',
        name: 'Administrativo',
        type: 'ADMINISTRATIVE',
        isActive: true,
      },
    }),
    prisma.costCenter.upsert({
      where: { code: 'FINANCEIRO' },
      update: {},
      create: {
        code: 'FINANCEIRO',
        name: 'Financeiro',
        type: 'FINANCIAL',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Centros de custo criados:', costCenters.length);

  // Criar alguns parceiros de exemplo
  const partners = await Promise.all([
    prisma.partner.upsert({
      where: { id: 'vendor-1' },
      update: {},
      create: {
        id: 'vendor-1',
        name: 'Fazenda São José',
        type: 'VENDOR',
        cpfCnpj: '12345678901',
        phone: '65999998888',
        email: 'contato@fazendasaojose.com.br',
        address: 'Rodovia MT-130, Km 45',
        isActive: true,
      },
    }),
    prisma.partner.upsert({
      where: { id: 'broker-1' },
      update: {},
      create: {
        id: 'broker-1',
        name: 'João Silva Corretor',
        type: 'BROKER',
        cpfCnpj: '98765432101',
        phone: '65988887777',
        email: 'joao@corretores.com.br',
        isActive: true,
      },
    }),
    prisma.partner.upsert({
      where: { id: 'buyer-1' },
      update: {},
      create: {
        id: 'buyer-1',
        name: 'JBS S/A',
        type: 'BUYER',
        cpfCnpj: '02916265000160',
        phone: '1133241000',
        email: 'compras@jbs.com.br',
        address: 'Av. Marginal Direita do Tietê, 500',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Parceiros criados:', partners.length);

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
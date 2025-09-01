const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPartners() {
  try {
    // Verificar se já existem parceiros
    const existingPartners = await prisma.partner.count();
    
    if (existingPartners > 0) {
      console.log(`✅ Já existem ${existingPartners} parceiros no banco`);
      const confirmation = process.argv[2] === '--force';
      if (!confirmation) {
        console.log('Use --force para adicionar mais parceiros');
        return;
      }
    }

    // Criar parceiros por tipo
    const partners = [
      // VENDORS (Fornecedores/Vendedores de gado)
      {
        name: 'Fazenda Boi Forte',
        type: 'VENDOR',
        cpfCnpj: '12345678000190',
        phone: '(65) 99987-6543',
        email: 'contato@fazendaboiforte.com.br',
        address: 'Rod. BR-163, Km 850 - Sorriso/MT',
        notes: 'Fornecedor premium de gado nelore, entrega pontual'
      },
      {
        name: 'João Carlos Pecuarista',
        type: 'VENDOR',
        cpfCnpj: '98765432109',
        phone: '(65) 98765-4321',
        email: 'joao.pecuarista@gmail.com',
        address: 'Fazenda Santa Rita - Rondonópolis/MT',
        notes: 'Especialista em gado de recria, bom histórico'
      },
      {
        name: 'Agropecuária Três Irmãos',
        type: 'VENDOR',
        cpfCnpj: '98765432000187',
        phone: '(65) 3322-1100',
        email: 'vendas@3irmaos.agro.br',
        address: 'Estrada Municipal 45, Km 12 - Primavera do Leste/MT',
        notes: 'Grande volume, negociação flexível'
      },

      // BROKERS (Corretores/Intermediários)
      {
        name: 'Pedro Henrique Corretor',
        type: 'BROKER',
        cpfCnpj: '45678912345',
        phone: '(65) 99876-5432',
        email: 'pedro.corretor@outlook.com',
        address: 'Av. Historiador Rubens de Mendonça, 1000 - Cuiabá/MT',
        notes: 'Comissão de 2% sobre vendas, ampla carteira'
      },
      {
        name: 'Corretora Boi & Cia',
        type: 'BROKER',
        cpfCnpj: '11223344000155',
        phone: '(65) 3625-8900',
        email: 'contato@boiecia.com.br',
        address: 'Rua das Palmeiras, 450 - Várzea Grande/MT',
        notes: 'Especializada em leilões e vendas diretas'
      },
      {
        name: 'Maria Silva Intermediações',
        type: 'BROKER',
        cpfCnpj: '78945612378',
        phone: '(65) 98888-7777',
        email: 'maria.silva@corretora.com',
        address: 'Centro Comercial Popular - Cáceres/MT',
        notes: 'Foco em pequenos e médios produtores'
      },

      // BUYERS (Compradores)
      {
        name: 'Frigorífico Central MT',
        type: 'BUYER',
        cpfCnpj: '55667788000199',
        phone: '(65) 3641-2000',
        email: 'compras@frigorificocentral.com.br',
        address: 'Distrito Industrial - Sinop/MT',
        notes: 'Compra programada, pagamento em 30 dias'
      },
      {
        name: 'JBS Unidade Cuiabá',
        type: 'BUYER',
        cpfCnpj: '02916265000160',
        phone: '(65) 3611-3000',
        email: 'compras.cuiaba@jbs.com.br',
        address: 'Rod. BR-364, Km 305 - Cuiabá/MT',
        notes: 'Maior comprador da região, exige qualidade'
      },
      {
        name: 'Cooperativa Boi Gordo',
        type: 'BUYER',
        cpfCnpj: '33445566000177',
        phone: '(65) 3333-4444',
        email: 'cooperativa@boigordo.coop.br',
        address: 'Av. Mato Grosso, 2500 - Lucas do Rio Verde/MT',
        notes: 'Compra coletiva, melhores preços'
      },

      // INVESTORS (Investidores)
      {
        name: 'Capital Agro Investimentos',
        type: 'INVESTOR',
        cpfCnpj: '77889900000188',
        phone: '(11) 3456-7890',
        email: 'investimentos@capitalagro.com.br',
        address: 'Av. Faria Lima, 3000 - São Paulo/SP',
        notes: 'Fundo de investimento focado em pecuária'
      },
      {
        name: 'Roberto Fazendeiro',
        type: 'INVESTOR',
        cpfCnpj: '11122233344',
        phone: '(65) 99999-8888',
        email: 'roberto.investidor@gmail.com',
        address: 'Condomínio Alphaville - Cuiabá/MT',
        notes: 'Investidor individual, aportes de até R$ 500k'
      },
      {
        name: 'Banco Rural S.A.',
        type: 'INVESTOR',
        cpfCnpj: '99887766000155',
        phone: '(65) 3028-9000',
        email: 'agronegocio@bancorural.com.br',
        address: 'Av. Miguel Sutil, 8000 - Cuiabá/MT',
        notes: 'Linhas de crédito e investimento direto'
      },

      // SERVICE_PROVIDERS (Prestadores de Serviço)
      {
        name: 'Veterinária Boi Saúde',
        type: 'SERVICE_PROVIDER',
        cpfCnpj: '44556677000133',
        phone: '(65) 3322-5566',
        email: 'atendimento@boisaude.vet.br',
        address: 'Rua dos Veterinários, 100 - Rondonópolis/MT',
        notes: 'Serviços veterinários 24h, vacinação em lote'
      },
      {
        name: 'Nutrição Animal Plus',
        type: 'SERVICE_PROVIDER',
        cpfCnpj: '22334455000166',
        phone: '(65) 3624-7788',
        email: 'contato@nutricaoplus.com.br',
        address: 'Av. Industrial, 500 - Primavera do Leste/MT',
        notes: 'Fornecimento de ração e suplementos'
      },
      {
        name: 'TechPec Soluções',
        type: 'SERVICE_PROVIDER',
        cpfCnpj: '66778899000111',
        phone: '(65) 3025-4040',
        email: 'suporte@techpec.com.br',
        address: 'Parque Tecnológico - Cuiabá/MT',
        notes: 'Software de gestão e rastreabilidade'
      },

      // FREIGHT_CARRIERS (Transportadoras)
      {
        name: 'Transporte Rápido Bovino',
        type: 'FREIGHT_CARRIER',
        cpfCnpj: '88990011000122',
        phone: '(65) 3333-2222',
        email: 'frete@rapidobovino.com.br',
        address: 'Rod. BR-070, Km 15 - Várzea Grande/MT',
        notes: 'Frota própria, 50 caminhões, R$ 2,50/km'
      },
      {
        name: 'Logística Pantanal',
        type: 'FREIGHT_CARRIER',
        cpfCnpj: '55443322000144',
        phone: '(65) 3642-1111',
        email: 'contato@logisticapantanal.com',
        address: 'Terminal de Cargas - Cáceres/MT',
        notes: 'Especializada em longas distâncias, R$ 2,20/km'
      },
      {
        name: 'José Caminhoneiro MEI',
        type: 'FREIGHT_CARRIER',
        cpfCnpj: '99988877766',
        phone: '(65) 99777-6666',
        email: 'jose.caminhao@gmail.com',
        address: 'Posto Ipiranga - Tangará da Serra/MT',
        notes: 'Caminhão próprio, disponível sob demanda, R$ 3,00/km'
      },

      // OTHER (Outros)
      {
        name: 'Consultoria Agro MT',
        type: 'OTHER',
        cpfCnpj: '12312312000190',
        phone: '(65) 3027-8888',
        email: 'consultoria@agromt.com.br',
        address: 'Edifício Empresarial, Sala 1001 - Cuiabá/MT',
        notes: 'Consultoria em gestão e planejamento pecuário'
      },
      {
        name: 'Associação de Pecuaristas',
        type: 'OTHER',
        cpfCnpj: '45645645000177',
        phone: '(65) 3623-0000',
        email: 'contato@pecuaristasmt.org.br',
        address: 'Casa do Produtor Rural - Rondonópolis/MT',
        notes: 'Representação e apoio aos produtores'
      },
      {
        name: 'Feira Agro Show MT',
        type: 'OTHER',
        cpfCnpj: '78978978000155',
        phone: '(65) 3333-9999',
        email: 'eventos@agroshow.com.br',
        address: 'Centro de Eventos - Lucas do Rio Verde/MT',
        notes: 'Organização de feiras e eventos do setor'
      }
    ];

    // Inserir parceiros no banco
    let created = 0;
    let skipped = 0;

    for (const partner of partners) {
      try {
        // Verificar se já existe pelo CPF/CNPJ
        const existing = await prisma.partner.findUnique({
          where: { cpfCnpj: partner.cpfCnpj }
        });

        if (existing) {
          console.log(`⚠️  Parceiro ${partner.name} já existe (CPF/CNPJ: ${partner.cpfCnpj})`);
          skipped++;
          continue;
        }

        await prisma.partner.create({ data: partner });
        console.log(`✅ ${partner.type}: ${partner.name} cadastrado`);
        created++;
      } catch (error) {
        console.error(`❌ Erro ao criar ${partner.name}:`, error.message);
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`✅ ${created} parceiros criados`);
    console.log(`⚠️  ${skipped} parceiros já existentes`);
    console.log(`Total de tipos: 7 (VENDOR, BROKER, BUYER, INVESTOR, SERVICE_PROVIDER, FREIGHT_CARRIER, OTHER)`);
    console.log(`Parceiros por tipo: 3`);

  } catch (error) {
    console.error('❌ Erro ao criar parceiros:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPartners();
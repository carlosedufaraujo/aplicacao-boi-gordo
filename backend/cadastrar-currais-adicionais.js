const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista de currais adicionais para cadastrar
// Formato: [Número do Curral, Localização]
const curraisAdicionais = [
  ["J-06", "Linha J"],
  ["M-07", "Linha M"],
  ["M-08", "Linha M"]
];

async function cadastrarCurraisAdicionais() {
  console.log('🐮 Cadastrando currais adicionais...\n');
  
  let sucessos = 0;
  let erros = 0;
  const errosList = [];

  for (const [penNumber, location] of curraisAdicionais) {
    try {
      // Verificar se já existe
      const existe = await prisma.pen.findFirst({
        where: { penNumber: penNumber }
      });

      if (existe) {
        console.log(`⚠️  Curral ${penNumber} - Já cadastrado`);
        erros++;
        errosList.push(`${penNumber} - Já existe no sistema`);
        continue;
      }

      // Cadastrar novo curral
      await prisma.pen.create({
        data: {
          penNumber: penNumber,
          capacity: 140, // Capacidade máxima de 140 animais
          location: location,
          type: 'FATTENING', // Tipo engorda
          status: 'AVAILABLE',
          isActive: true
        }
      });

      console.log(`✅ Curral ${penNumber} (${location}) - Cadastrado com sucesso`);
      sucessos++;
      
    } catch (error) {
      console.log(`❌ Curral ${penNumber} - Erro ao cadastrar`);
      erros++;
      errosList.push(`${penNumber} - ${error.message}`);
    }
  }

  console.log('\n========================================');
  console.log(`📊 RESUMO DO CADASTRO:`);
  console.log(`✅ Cadastrados com sucesso: ${sucessos}`);
  console.log(`❌ Erros/Duplicados: ${erros}`);
  
  if (errosList.length > 0) {
    console.log('\n📋 Detalhes dos erros:');
    errosList.forEach(err => console.log(`   - ${err}`));
  }
  
  console.log('========================================\n');
  
  // Listar total de currais no sistema
  const totalCurrais = await prisma.pen.count();
  console.log(`🏠 Total de currais no sistema: ${totalCurrais}`);
  
  // Listar todos os currais por linha
  const curraisPorLinha = await prisma.pen.groupBy({
    by: ['location'],
    _count: true,
    orderBy: { location: 'asc' }
  });
  
  console.log('\n📍 Distribuição por linha:');
  curraisPorLinha.forEach(linha => {
    console.log(`   - ${linha.location}: ${linha._count} currais`);
  });
  
  const capacidadeTotal = totalCurrais * 140;
  console.log(`\n🐄 Capacidade total: ${capacidadeTotal} animais`);
}

// Executar cadastro
cadastrarCurraisAdicionais()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n✨ Processo finalizado!');
  });
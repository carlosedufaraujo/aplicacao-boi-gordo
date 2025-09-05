const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista de currais para cadastrar
// Formato: [Número do Curral, Localização]
const currais = [
  ["C-14", "Linha C"],
  ["F-12", "Linha F"],
  ["F-17", "Linha F"],
  ["F-18", "Linha F"],
  ["F-19", "Linha F"],
  ["H-01", "Linha H"],
  ["H-02", "Linha H"],
  ["H-22", "Linha H"],
  ["J-01", "Linha J"],
  ["J-02", "Linha J"],
  ["J-03", "Linha J"],
  ["M-01", "Linha M"],
  ["M-02", "Linha M"],
  ["M-03", "Linha M"],
  ["M-04", "Linha M"],
  ["M-05", "Linha M"],
  ["M-06", "Linha M"],
  ["M-09", "Linha M"],
  ["N-09", "Linha N"],
  ["N-10", "Linha N"],
  ["O-03", "Linha O"],
  ["P-02", "Linha P"]
];

async function cadastrarCurrais() {
  console.log('🐮 Iniciando cadastro em massa de currais...\n');
  
  let sucessos = 0;
  let erros = 0;
  const errosList = [];

  for (const [penNumber, location] of currais) {
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
  
  // Listar todos os currais cadastrados
  const totalCurrais = await prisma.pen.count();
  console.log(`🏠 Total de currais no sistema: ${totalCurrais}`);
}

// Executar cadastro
cadastrarCurrais()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✨ Processo finalizado!');
  });
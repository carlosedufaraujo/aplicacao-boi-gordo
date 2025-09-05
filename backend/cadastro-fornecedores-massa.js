const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista de fornecedores para cadastrar
// ADICIONE OS NOMES AQUI, UM POR LINHA
const fornecedores = [
  "LAURENTINO FERNANDES BATISTA",
  "ADIO SOUZA DA SILVA",
  "JONAS BARBOSA DE SOUZA",
  "SIDNEY PEREIRA LIMA",
  "GUILHERME ANDALO MACIEL",
  "LUAN MIRANDA COSTA",
  "GIOVANI GONÇALVES",
  "AMAURI ROQUE FERREIRA",
  "VITOR BARBOSA DA SILVA",
  "MARCELO DE SOUZA",
  "MARCOS PAULO GARCIA DE SOUZA",
  "JOSINALDO MATIAS DE OLIVEIRA",
  "ELIANE APARECIDA BARBOSA BORGES",
  "GILMAR LUIZ DA COSTA",
  "EDSON RODRIGUES DOS SANTOS",
  "ALESSANDRO CARVALHO DE SOUZA",
  "LUIS FELIPE CUNHA ANDRADE",
  "LUIZ FELIPE CUNHA DE ANDRADE",
  "LICIA MARIA VIDAL DE SOUZA",
  "RODINELLI FERNANDES DA SILVA",
  "RAFAEL MACHADO MEDEIROS",
  "WELBE CARLOS DA COSTA SILVA"
];

async function cadastrarFornecedores() {
  console.log('🚀 Iniciando cadastro em massa de fornecedores...\n');
  
  let sucessos = 0;
  let erros = 0;
  const errosList = [];

  for (const nome of fornecedores) {
    if (!nome || nome.trim() === '') continue;
    
    try {
      // Verificar se já existe
      const existe = await prisma.partner.findFirst({
        where: { 
          name: nome.trim(),
          type: 'VENDOR'
        }
      });

      if (existe) {
        console.log(`⚠️  ${nome} - Já cadastrado`);
        erros++;
        errosList.push(`${nome} - Já existe no sistema`);
        continue;
      }

      // Cadastrar novo fornecedor
      await prisma.partner.create({
        data: {
          name: nome.trim(),
          type: 'VENDOR', // Tipo fornecedor
          isActive: true
        }
      });

      console.log(`✅ ${nome} - Cadastrado com sucesso`);
      sucessos++;
      
    } catch (error) {
      console.log(`❌ ${nome} - Erro ao cadastrar`);
      erros++;
      errosList.push(`${nome} - ${error.message}`);
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
}

// Executar cadastro
cadastrarFornecedores()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✨ Processo finalizado!');
  });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista dos 22 fornecedores que devem ser MANTIDOS
const fornecedoresParaManter = [
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

async function limparFornecedoresAntigos() {
  console.log('🧹 Iniciando limpeza de fornecedores antigos...\n');
  
  try {
    // Buscar todos os fornecedores do tipo VENDOR
    const todosFornecedores = await prisma.partner.findMany({
      where: { type: 'VENDOR' },
      select: { id: true, name: true }
    });
    
    console.log(`📊 Total de fornecedores encontrados: ${todosFornecedores.length}`);
    
    // Filtrar fornecedores para excluir (que NÃO estão na lista para manter)
    const fornecedoresParaExcluir = todosFornecedores.filter(f => 
      !fornecedoresParaManter.includes(f.name.toUpperCase()) &&
      !fornecedoresParaManter.includes(f.name)
    );
    
    console.log(`🗑️  Fornecedores a serem excluídos: ${fornecedoresParaExcluir.length}`);
    console.log(`✅ Fornecedores a serem mantidos: ${todosFornecedores.length - fornecedoresParaExcluir.length}\n`);
    
    if (fornecedoresParaExcluir.length > 0) {
      console.log('Excluindo fornecedores antigos:');
      console.log('================================');
      
      for (const fornecedor of fornecedoresParaExcluir) {
        try {
          await prisma.partner.delete({
            where: { id: fornecedor.id }
          });
          console.log(`❌ Excluído: ${fornecedor.name}`);
        } catch (error) {
          console.log(`⚠️  Erro ao excluir ${fornecedor.name}: ${error.message}`);
        }
      }
      
      console.log('\n================================');
      console.log(`✅ Processo concluído!`);
      console.log(`   - ${fornecedoresParaExcluir.length} fornecedores excluídos`);
      console.log(`   - ${todosFornecedores.length - fornecedoresParaExcluir.length} fornecedores mantidos`);
    } else {
      console.log('✨ Nenhum fornecedor antigo para excluir!');
    }
    
    // Listar fornecedores restantes
    const fornecedoresRestantes = await prisma.partner.findMany({
      where: { type: 'VENDOR' },
      orderBy: { name: 'asc' }
    });
    
    console.log('\n📋 Fornecedores no sistema após limpeza:');
    console.log('========================================');
    fornecedoresRestantes.forEach((f, index) => {
      console.log(`${index + 1}. ${f.name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
limparFornecedoresAntigos()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n✨ Conexão com banco de dados encerrada!');
  });
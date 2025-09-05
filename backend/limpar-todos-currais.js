const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limparTodosCurrais() {
  console.log('🧹 Iniciando limpeza de todos os currais...\n');
  
  try {
    // Buscar todos os currais
    const currais = await prisma.pen.findMany({
      select: { 
        id: true, 
        penNumber: true,
        location: true 
      }
    });
    
    console.log(`📊 Total de currais encontrados: ${currais.length}`);
    
    if (currais.length > 0) {
      console.log('\nRemovendo currais e dados relacionados:');
      console.log('========================================');
      
      let excluidos = 0;
      let erros = 0;
      
      for (const curral of currais) {
        try {
          // Primeiro, remover alocações de lotes nos currais
          await prisma.lotPenLink.deleteMany({
            where: { penId: curral.id }
          });
          
          // Remover movimentações de currais se existir
          await prisma.penMovement.deleteMany({
            where: { 
              OR: [
                { originPenId: curral.id },
                { destinationPenId: curral.id }
              ]
            }
          }).catch(() => {});
          
          // Agora excluir o curral
          await prisma.pen.delete({
            where: { id: curral.id }
          });
          
          console.log(`❌ Excluído: Curral ${curral.penNumber} - ${curral.location || 'Sem localização'}`);
          excluidos++;
        } catch (error) {
          console.log(`⚠️  Erro ao excluir Curral ${curral.penNumber}: ${error.message}`);
          erros++;
        }
      }
      
      console.log('\n========================================');
      console.log(`✅ Processo concluído!`);
      console.log(`   - ${excluidos} currais excluídos`);
      if (erros > 0) {
        console.log(`   - ${erros} erros encontrados`);
      }
    } else {
      console.log('✨ Nenhum curral encontrado para excluir!');
    }
    
    // Verificar total restante
    const totalRestante = await prisma.pen.count();
    
    console.log('\n📋 Resumo final:');
    console.log('================');
    console.log(`Total de currais no sistema: ${totalRestante}`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
limparTodosCurrais()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n✨ Conexão com banco de dados encerrada!');
  });
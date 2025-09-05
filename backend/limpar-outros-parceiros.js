const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limparOutrosParceiros() {
  console.log('🧹 Iniciando limpeza de parceiros não-fornecedores...\n');
  
  try {
    // Buscar todos os parceiros que NÃO são VENDOR
    const parceirosParaExcluir = await prisma.partner.findMany({
      where: { 
        type: { 
          not: 'VENDOR' 
        } 
      },
      select: { 
        id: true, 
        name: true, 
        type: true 
      }
    });
    
    console.log(`📊 Total de parceiros não-fornecedores encontrados: ${parceirosParaExcluir.length}`);
    
    if (parceirosParaExcluir.length > 0) {
      console.log('\nExcluindo parceiros por tipo:');
      console.log('================================');
      
      let excluidos = 0;
      let erros = 0;
      
      for (const parceiro of parceirosParaExcluir) {
        try {
          // Primeiro, remover referências em compras se houver
          if (parceiro.type === 'BROKER') {
            await prisma.cattlePurchase.updateMany({
              where: { brokerId: parceiro.id },
              data: { brokerId: null }
            });
          }
          
          if (parceiro.type === 'FREIGHT_CARRIER') {
            await prisma.cattlePurchase.updateMany({
              where: { transportCompanyId: parceiro.id },
              data: { transportCompanyId: null }
            });
          }
          
          // Agora excluir o parceiro
          await prisma.partner.delete({
            where: { id: parceiro.id }
          });
          
          console.log(`❌ Excluído: ${parceiro.name} (${parceiro.type})`);
          excluidos++;
        } catch (error) {
          console.log(`⚠️  Erro ao excluir ${parceiro.name} (${parceiro.type}): ${error.message}`);
          erros++;
        }
      }
      
      console.log('\n================================');
      console.log(`✅ Processo concluído!`);
      console.log(`   - ${excluidos} parceiros excluídos`);
      if (erros > 0) {
        console.log(`   - ${erros} erros encontrados`);
      }
    } else {
      console.log('✨ Nenhum parceiro não-fornecedor para excluir!');
    }
    
    // Listar total restante
    const totalRestante = await prisma.partner.count();
    const fornecedoresRestantes = await prisma.partner.count({
      where: { type: 'VENDOR' }
    });
    
    console.log('\n📋 Resumo final:');
    console.log('================');
    console.log(`Total de parceiros no sistema: ${totalRestante}`);
    console.log(`Fornecedores (VENDOR): ${fornecedoresRestantes}`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
limparOutrosParceiros()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n✨ Conexão com banco de dados encerrada!');
  });
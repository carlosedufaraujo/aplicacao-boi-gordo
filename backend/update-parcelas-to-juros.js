const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function updateParcelasToJuros() {
  try {
    console.log('🔄 Atualizando categoria das parcelas para Juros...');

    // Buscar ou criar categoria "Juros"
    let jurosCategory = await prisma.category.findFirst({
      where: { name: 'Juros' }
    });

    if (!jurosCategory) {
      jurosCategory = await prisma.category.create({
        data: {
          name: 'Juros',
          type: 'EXPENSE',
          color: '#EF4444',
          icon: 'percent',
          isActive: true
        }
      });
      console.log('✅ Categoria "Juros" criada');
    } else {
      console.log('ℹ️ Categoria "Juros" já existe');
    }

    // Buscar todas as parcelas de 01 a 15
    const parcelas = [];
    for (let i = 1; i <= 15; i++) {
      const description = `Parcela ${String(i).padStart(2, '0')}: Financiamento`;
      parcelas.push(description);
    }

    // Atualizar as parcelas para a categoria Juros
    let updated = 0;
    let notFound = 0;

    for (const description of parcelas) {
      const result = await prisma.cashFlow.updateMany({
        where: {
          description: description
        },
        data: {
          categoryId: jurosCategory.id,
          notes: 'Parcela de juros sobre financiamento'
        }
      });

      if (result.count > 0) {
        console.log(`✅ Atualizada: ${description} → Categoria: Juros`);
        updated += result.count;
      } else {
        console.log(`⚠️ Não encontrada: ${description}`);
        notFound++;
      }
    }

    // Verificar o resultado
    const updatedParcelas = await prisma.cashFlow.findMany({
      where: {
        categoryId: jurosCategory.id,
        description: {
          startsWith: 'Parcela'
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    console.log('\n📊 === RESUMO DA ATUALIZAÇÃO ===');
    console.log(`✅ Parcelas atualizadas: ${updated}`);
    console.log(`⚠️ Parcelas não encontradas: ${notFound}`);
    console.log(`📁 Total de parcelas na categoria Juros: ${updatedParcelas.length}`);
    
    if (updatedParcelas.length > 0) {
      const total = updatedParcelas.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      console.log(`💰 Valor total em Juros: R$ ${total.toLocaleString('pt-BR')}`);
      
      console.log('\n📋 Parcelas atualizadas:');
      updatedParcelas.forEach(p => {
        console.log(`  ${p.description}: ${new Date(p.dueDate).toLocaleDateString('pt-BR')} - R$ ${parseFloat(p.amount).toLocaleString('pt-BR')}`);
      });
    }

    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao atualizar parcelas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
updateParcelasToJuros();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:3001/api/v1';

async function testSync() {
  console.log('🔍 Testando sincronização de categorias...\n');

  try {
    // 1. Testar busca via API
    console.log('1️⃣ Testando GET /categories...');
    const response = await axios.get(`${API_URL}/categories`);
    console.log(`   ✅ Categorias retornadas pela API: ${response.data.length}`);

    // 2. Verificar categorias diretamente no banco
    console.log('\n2️⃣ Verificando banco de dados...');
    const dbCategories = await prisma.category.findMany();
    console.log(`   ✅ Categorias no banco: ${dbCategories.length}`);

    // 3. Comparar
    if (response.data.length === dbCategories.length) {
      console.log('   ✅ API e banco estão sincronizados!');
    } else {
      console.log('   ⚠️ Diferença entre API e banco!');
    }

    // 4. Testar criação de categoria
    console.log('\n3️⃣ Testando criação de categoria...');
    const testCategory = {
      name: `Teste Sync ${Date.now()}`,
      type: 'EXPENSE',
      color: '#123456'
    };

    try {
      const createResponse = await axios.post(`${API_URL}/categories`, testCategory);
      console.log(`   ✅ Categoria criada: ${createResponse.data.name} (ID: ${createResponse.data.id})`);

      // 5. Verificar se foi criada no banco
      const created = await prisma.category.findUnique({
        where: { id: createResponse.data.id }
      });

      if (created) {
        console.log('   ✅ Categoria confirmada no banco!');

        // 6. Limpar teste
        await prisma.category.delete({ where: { id: created.id } });
        console.log('   🧹 Categoria de teste removida');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`   ℹ️ ${error.response.data.error}`);
      } else {
        throw error;
      }
    }

    // 7. Listar categorias customizadas
    console.log('\n4️⃣ Categorias customizadas:');
    const customCategories = dbCategories.filter(c => !c.isDefault);
    if (customCategories.length > 0) {
      customCategories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.type})`);
      });
    } else {
      console.log('   Nenhuma categoria customizada');
    }

    console.log('\n✅ Teste de sincronização concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️ Backend não está rodando na porta 3001');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testSync();
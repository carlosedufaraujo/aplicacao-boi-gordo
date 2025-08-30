const axios = require('axios');

const API_URL = 'http://localhost:3333/api/v1';

// Token de autenticação (você precisa substituir por um token válido)
const TOKEN = 'seu_token_aqui';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testCattlePurchaseAPI() {
  console.log('🧪 Iniciando testes da API de CattlePurchase...\n');

  try {
    // 1. Teste: Listar todas as compras
    console.log('1️⃣ Listando todas as compras...');
    try {
      const listResponse = await api.get('/cattle-purchases');
      console.log(`✅ Listagem OK - ${listResponse.data.results || 0} compras encontradas`);
      console.log('Dados:', JSON.stringify(listResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Erro ao listar:', error.response?.data || error.message);
    }

    // 2. Teste: Obter estatísticas
    console.log('\n2️⃣ Obtendo estatísticas...');
    try {
      const statsResponse = await api.get('/cattle-purchases/statistics');
      console.log('✅ Estatísticas obtidas:');
      console.log(JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Erro ao obter estatísticas:', error.response?.data || error.message);
    }

    // 3. Teste: Criar nova compra (vai falhar sem IDs válidos)
    console.log('\n3️⃣ Testando criação de compra...');
    const newPurchase = {
      vendorId: 'vendor-id-aqui', // Precisa ser um ID válido
      payerAccountId: 'payer-account-id-aqui', // Precisa ser um ID válido
      purchaseDate: new Date().toISOString(),
      animalType: 'MALE',
      initialQuantity: 100,
      purchaseWeight: 15000, // 15000 kg = 500 arrobas
      carcassYield: 52,
      pricePerArroba: 280.00,
      paymentType: 'CASH',
      location: 'Fazenda São João - MT',
      animalAge: 24,
      freightCost: 5000,
      commission: 2000,
      notes: 'Teste de API'
    };

    try {
      const createResponse = await api.post('/cattle-purchases', newPurchase);
      console.log('✅ Compra criada com sucesso!');
      console.log('ID:', createResponse.data.data.id);
      console.log('Código do lote:', createResponse.data.data.lotCode);
      return createResponse.data.data.id;
    } catch (error) {
      console.log('❌ Erro ao criar compra:', error.response?.data || error.message);
      console.log('\n💡 Nota: Para criar uma compra, você precisa de IDs válidos de vendorId e payerAccountId');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Teste sem autenticação primeiro
async function testWithoutAuth() {
  console.log('🔐 Testando sem autenticação...');
  try {
    const response = await axios.get(`${API_URL}/cattle-purchases`);
    console.log('⚠️ API acessível sem autenticação!');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ API protegida corretamente - requer autenticação');
      console.log('Resposta:', error.response.data);
    } else {
      console.log('❌ Erro inesperado:', error.message);
    }
  }
}

// Função principal
async function main() {
  console.log('='.repeat(50));
  console.log('TESTE DA API DE CATTLE PURCHASE');
  console.log('='.repeat(50));
  console.log();

  // Primeiro testa sem autenticação
  await testWithoutAuth();
  console.log();

  // Depois testa com autenticação (se houver token)
  if (TOKEN === 'seu_token_aqui') {
    console.log('⚠️ Por favor, configure um token válido no script');
    console.log('Você pode obter um token fazendo login na aplicação');
  } else {
    await testCattlePurchaseAPI();
  }
}

main().catch(console.error);
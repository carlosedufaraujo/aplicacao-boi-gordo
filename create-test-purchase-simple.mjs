import axios from 'axios';

const API_URL = 'http://localhost:3001/api/v1';

async function createTestPurchase() {
  try {
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@boicontrol.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login OK');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Buscar dados necessários
    const [partnersRes, payerAccountsRes] = await Promise.all([
      axios.get(`${API_URL}/partners`, { headers }),
      axios.get(`${API_URL}/payer-accounts`, { headers })
    ]);
    
    // Extrair os dados corretamente (resposta tem estrutura data.data.items)
    const allPartners = partnersRes.data?.data?.items || partnersRes.data?.items || [];
    const vendors = allPartners.filter(p => p.type === 'VENDOR');
    
    const payerAccounts = payerAccountsRes.data?.data?.items || 
                         payerAccountsRes.data?.items || 
                         payerAccountsRes.data || [];
    
    if (vendors.length === 0) {
      console.log('❌ Nenhum fornecedor encontrado');
      return;
    }
    
    if (payerAccounts.length === 0) {
      console.log('❌ Nenhuma conta pagadora encontrada');
      return;
    }
    
    // Criar compra de teste
    const testPurchase = {
      vendorId: vendors[0].id,
      payerAccountId: payerAccounts[0].id,
      location: 'Fazenda Teste',
      city: 'São Paulo',
      state: 'SP',
      farm: 'Fazenda Teste',
      purchaseDate: new Date().toISOString(),
      animalType: 'MALE',
      animalAge: 24,
      initialQuantity: 50,
      currentQuantity: 50,
      purchaseWeight: 7500,
      averageWeight: 150,
      carcassYield: 52,
      pricePerArroba: 280,
      purchaseValue: 70000,
      freightCost: 2000,
      commission: 500,
      totalCost: 72500,
      paymentType: 'CASH',
      status: 'CONFIRMED',
      stage: 'confirmed'
    };
    
    console.log('\n📝 Criando compra de teste...');
    const createResponse = await axios.post(`${API_URL}/cattle-purchases`, testPurchase, { headers });
    
    // A resposta pode estar em data.data ou diretamente em data
    const purchase = createResponse.data.data || createResponse.data;
    
    console.log('✅ Compra criada com sucesso!');
    console.log(`   - Código: ${purchase.lotCode}`);
    console.log(`   - ID: ${purchase.id}`);
    console.log(`   - Status: ${purchase.status}`);
    console.log(`   - Stage: ${purchase.stage}`);
    console.log(`   - Pode ser excluída: SIM`);
    
    return purchase;
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

createTestPurchase();
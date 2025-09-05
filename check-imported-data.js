import fetch from 'node-fetch';

async function checkImportedData() {
  try {
    console.log('🔍 Verificando dados importados...\n');
    
    // 1. Login
    const loginResponse = await fetch('http://localhost:3002/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@boigordo.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    
    // 2. Buscar todas as compras
    console.log('📋 COMPRAS DE GADO IMPORTADAS:');
    console.log('================================\n');
    
    const purchasesResponse = await fetch('http://localhost:3002/api/v1/cattle-purchases?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const purchasesData = await purchasesResponse.json();
    const purchases = purchasesData.data || purchasesData.cattlePurchases || [];
    
    if (purchases && purchases.length > 0) {
      console.log(`Total de compras no sistema: ${purchases.length}\n`);
      
      purchases.forEach((purchase, index) => {
        console.log(`${index + 1}. Código: ${purchase.lotCode}`);
        console.log(`   Data: ${new Date(purchase.purchaseDate).toLocaleDateString('pt-BR')}`);
        console.log(`   Fornecedor ID: ${purchase.vendorId}`);
        console.log(`   Quantidade: ${purchase.initialQuantity} animais`);
        console.log(`   Peso Total: ${purchase.purchaseWeight.toLocaleString('pt-BR')} kg`);
        console.log(`   Valor: R$ ${purchase.purchaseValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
        console.log(`   Cidade: ${purchase.city}/${purchase.state}`);
        console.log(`   Status: ${purchase.status}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ Nenhuma compra encontrada no sistema');
    }
    
    // 3. Buscar contas pagadoras
    console.log('\n\n💳 CONTAS PAGADORAS:');
    console.log('================================\n');
    
    const accountsResponse = await fetch('http://localhost:3002/api/v1/payer-accounts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const accountsData = await accountsResponse.json();
    
    if (accountsData.data && accountsData.data.length > 0) {
      console.log(`Total de contas: ${accountsData.data.length}\n`);
      accountsData.data.forEach((account, index) => {
        console.log(`${index + 1}. ${account.accountName}`);
        console.log(`   Banco: ${account.bankName}`);
        console.log(`   Tipo: ${account.accountType}`);
        console.log(`   Saldo: R$ ${account.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
        console.log('   ---');
      });
    }
    
    // 4. Buscar fornecedores
    console.log('\n\n👥 FORNECEDORES (Partners):');
    console.log('================================\n');
    
    const partnersResponse = await fetch('http://localhost:3002/api/v1/partners?type=VENDOR&limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const partnersData = await partnersResponse.json();
    
    if (partnersData.data && partnersData.data.length > 0) {
      console.log(`Total de fornecedores: ${partnersData.data.length}\n`);
      partnersData.data.forEach((partner, index) => {
        console.log(`${index + 1}. ${partner.name}`);
        console.log(`   CPF/CNPJ: ${partner.cpfCnpj || 'N/A'}`);
        console.log(`   ID: ${partner.id}`);
        console.log('   ---');
      });
    }
    
    // 5. Comparar com dados originais
    console.log('\n\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log('================================\n');
    console.log('Dados enviados: 22 compras');
    console.log(`Dados importados: ${purchases ? purchases.length : 0} compras`);
    console.log(`Fornecedores criados: ${partnersData.data ? partnersData.data.length : 0}`);
    console.log(`Contas pagadoras criadas: ${accountsData.data ? accountsData.data.length : 0}`);
    
    // Listar compras que faltaram
    const fornecedoresOriginais = [
      'LAURENTINO FERNANDES BATISTA',
      'ADIO SOUZA DA SILVA', 
      'BRAZ SOARES DE ARAGÃO',
      'ISAIAS BORGES DE LARCERDA',
      'WILSON DA COSTA FILHO',
      'LUCIANO FAUSTO DA SILVA',
      'JHONLAINY DIEMETON DE MELO BORGES',
      'PETRONIO CARDOZO FAGUNDES',
      'ANDRÉ CARDOSO FAGUNDES',
      'GUILHERME COELHO LEMOS',
      'FREDERICO SANTOS NOGUEIRA',
      'MARIA GORETE DE OLIVEIRA',
      'JOLFRE REZENDE FILHO',
      'RONALDO FERREIRA SILVA',
      'MICHELY REGINA SOUZA DE JESUS',
      'RAFAEL MACHADO BRAZ',
      'JEAN DE JESUS OLIVEIRA',
      'AGNALDO DOS REIS BRITO'
    ];
    
    const fornecedoresImportados = (partnersData && partnersData.data && Array.isArray(partnersData.data)) ? partnersData.data.map(p => p.name.toUpperCase()) : [];
    const fornecedoresFaltando = fornecedoresOriginais.filter(f => 
      !fornecedoresImportados.includes(f.toUpperCase())
    );
    
    if (fornecedoresFaltando.length > 0) {
      console.log('\n⚠️ Fornecedores que faltaram:');
      fornecedoresFaltando.forEach(f => console.log(`  - ${f}`));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkImportedData();
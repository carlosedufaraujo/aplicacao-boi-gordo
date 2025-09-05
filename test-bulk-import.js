import fs from 'fs';
import fetch from 'node-fetch';
import Papa from 'papaparse';

async function testBulkImport() {
  try {
    console.log('🧪 Iniciando teste de importação em massa...');
    
    // 1. Login
    console.log('1. Fazendo login...');
    const loginResponse = await fetch('http://localhost:3002/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@boigordo.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data?.token;
    
    if (!token) {
      throw new Error('Token not received from login');
    }
    
    console.log('✅ Login realizado com sucesso');

    // 2. Ler arquivo CSV
    console.log('2. Lendo arquivo CSV...');
    const csvContent = fs.readFileSync('./cattle-purchases-import.csv', 'utf8');
    
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });

    console.log(`📊 ${parsed.data.length} registros encontrados no CSV`);

    // 3. Buscar ou criar conta pagadora
    console.log('3. Configurando conta pagadora...');
    const accountsResponse = await fetch('http://localhost:3002/api/v1/payer-accounts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let payerAccountId = null;
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      if (accountsData.data && accountsData.data.length > 0) {
        payerAccountId = accountsData.data[0].id;
        console.log('✅ Conta pagadora encontrada');
      }
    }

    if (!payerAccountId) {
      const createAccountResponse = await fetch('http://localhost:3002/api/v1/payer-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accountName: 'Conta Principal',
          bankName: 'Banco do Brasil',
          accountType: 'CHECKING',
          balance: 50000000.00
        })
      });

      if (createAccountResponse.ok) {
        const newAccountData = await createAccountResponse.json();
        payerAccountId = newAccountData.data.id;
        console.log('✅ Conta pagadora criada');
      }
    }

    // 4. Buscar fornecedores existentes
    console.log('4. Buscando fornecedores existentes...');
    const vendorMap = new Map();

    // Buscar todos os fornecedores
    const partnersResponse = await fetch('http://localhost:3002/api/v1/partners?type=VENDOR&limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (partnersResponse.ok) {
      const partnersData = await partnersResponse.json();
      if (partnersData.data && partnersData.data.length > 0) {
        partnersData.data.forEach(partner => {
          // Mapear por nome em uppercase
          vendorMap.set(partner.name.toUpperCase(), partner.id);
          console.log(`✅ Fornecedor encontrado: ${partner.name} (${partner.id})`);
        });
      }
    }

    // Criar fornecedores que ainda não existem
    const uniqueVendors = [...new Set(parsed.data.map(row => row['Nome do Fornecedor*']))];
    
    for (let i = 0; i < uniqueVendors.length; i++) {
      const vendorName = uniqueVendors[i];
      if (!vendorName) continue;

      // Se já existe, pular
      if (vendorMap.has(vendorName.toUpperCase())) {
        continue;
      }

      // Criar novo fornecedor
      const vendorResponse = await fetch('http://localhost:3002/api/v1/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: vendorName.toUpperCase(),
          type: 'VENDOR',
          cpfCnpj: `${99999999900 + i}`, // CPF/CNPJ único diferente
          isActive: true
        })
      });

      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        vendorMap.set(vendorName.toUpperCase(), vendorData.data.id);
        console.log(`✅ Fornecedor criado: ${vendorName} (${vendorData.data.id})`);
      } else {
        const errorText = await vendorResponse.text();
        console.log(`❌ Erro ao criar fornecedor ${vendorName}:`, errorText);
      }
    }

    console.log(`📊 ${vendorMap.size} fornecedores criados`);

    // 5. Importar compras
    console.log('5. Importando compras...');
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const vendorName = row['Nome do Fornecedor*'];
      const vendorId = vendorMap.get(vendorName.toUpperCase());

      if (!vendorId) {
        errors.push(`Fornecedor não encontrado: ${vendorName}`);
        errorCount++;
        continue;
      }

      const purchaseData = {
        lotCode: `IMPORT-${Date.now()}-${i + 1}`,
        vendorId: vendorId,
        payerAccountId: payerAccountId,
        purchaseDate: new Date(row['Data da Compra*']).toISOString(),
        animalType: row['Tipo de Animal'] || 'MALE',
        initialQuantity: parseInt(row['Quantidade de Animais*']),
        purchaseWeight: parseFloat(row['Peso Total (kg)*']),
        carcassYield: 52, // Default
        pricePerArroba: parseFloat(row['Preço por Arroba*']),
        purchaseValue: parseFloat(row['Valor da Compra*']),
        paymentType: 'CASH',
        city: row['Cidade'],
        state: row['Estado'],
        animalAge: parseInt(row['Idade (meses)']) || 24,
        commission: parseFloat(row['Comissão']) || 0,
        transportCompanyName: row['Transportadora']
      };

      try {
        const createResponse = await fetch('http://localhost:3002/api/v1/cattle-purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(purchaseData)
        });

        if (createResponse.ok) {
          successCount++;
          console.log(`✅ Compra ${i + 1}/${parsed.data.length} importada`);
        } else {
          const errorText = await createResponse.text();
          errors.push(`Registro ${i + 1}: ${errorText}`);
          errorCount++;
          console.log(`❌ Erro na compra ${i + 1}: ${errorText}`);
        }
      } catch (error) {
        errors.push(`Registro ${i + 1}: ${error.message}`);
        errorCount++;
        console.log(`❌ Erro na compra ${i + 1}: ${error.message}`);
      }
    }

    // 6. Resultado final
    console.log('\n📊 RESULTADO FINAL:');
    console.log(`✅ Importações bem-sucedidas: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n🚨 ERROS DETALHADOS:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n🎉 Importação concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testBulkImport();